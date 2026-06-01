"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { powiadomObserwujacychONowejHistorii } from "@/lib/historia/powiadomienia-historii";
import { pobierzVillageIdsRoliPaneluSoltysa } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

type WynikProsty = { ok?: true; blad?: string };

async function mozeZarzadzacWies(
  supabase: ReturnType<typeof utworzKlientaSupabaseSerwer>,
  userId: string,
  villageId: string,
): Promise<boolean> {
  const ids = await pobierzVillageIdsRoliPaneluSoltysa(supabase, userId);
  return ids.includes(villageId);
}

function parsujMediaUrls(csv: string): string[] {
  return csv
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter((s) => s.startsWith("http"))
    .slice(0, 12);
}

function parsujWspolrzedne(latRaw: string, lonRaw: string): { latitude: number | null; longitude: number | null } {
  const lat = latRaw.trim() === "" ? null : Number(latRaw.replace(",", "."));
  const lon = lonRaw.trim() === "" ? null : Number(lonRaw.replace(",", "."));
  if (lat == null && lon == null) return { latitude: null, longitude: null };
  if (lat == null || lon == null || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { latitude: null, longitude: null };
  }
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return { latitude: null, longitude: null };
  }
  return { latitude: lat, longitude: lon };
}

const schemaHistoriaWpis = z.object({
  villageId: z.string().uuid(),
  title: z.string().trim().min(5).max(180),
  short_description: z.string().trim().max(500).nullable().optional(),
  body: z.string().trim().min(20).max(60000),
  event_date: z.string().trim().max(20).nullable().optional(),
  era_label: z.string().trim().max(120).nullable().optional(),
  location_label: z.string().trim().max(200).nullable().optional(),
  latitude: z.string().trim().max(24).optional().default(""),
  longitude: z.string().trim().max(24).optional().default(""),
  source_links_csv: z.string().trim().max(1000).optional().default(""),
  media_urls_csv: z.string().trim().max(4000).optional().default(""),
});

const schemaEdycja = schemaHistoriaWpis.extend({
  id: z.string().uuid(),
});

async function rewalidujHistorieWsi(villageId: string) {
  const { data: wies } = await utworzKlientaSupabaseSerwer()
    .from("villages")
    .select("voivodeship, county, commune, slug")
    .eq("id", villageId)
    .maybeSingle();
  revalidatePath("/panel/soltys/spolecznosc/historia");
  revalidatePath("/panel/soltys/spolecznosc");
  revalidatePath("/mapa");
  if (wies) {
    const sciezka = sciezkaProfiluWsi(wies);
    revalidatePath(sciezka);
    revalidatePath(`${sciezka}/historia`);
  }
}

export async function dodajWpisHistoriiWsi(dane: z.infer<typeof schemaHistoriaWpis>): Promise<WynikProsty> {
  const parsed = schemaHistoriaWpis.safeParse(dane);
  if (!parsed.success) return { blad: "Sprawdź dane wpisu historii." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await mozeZarzadzacWies(supabase, user.id, parsed.data.villageId))) {
    return { blad: "Brak uprawnień do tej wsi." };
  }

  const links = parsed.data.source_links_csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
  const media = parsujMediaUrls(parsed.data.media_urls_csv);
  const eventDate = parsed.data.event_date?.trim() ? parsed.data.event_date.trim() : null;
  const { latitude, longitude } = parsujWspolrzedne(parsed.data.latitude, parsed.data.longitude);
  const teraz = new Date().toISOString();

  const { data: wstawiony, error } = await supabase
    .from("village_history_entries")
    .insert({
      village_id: parsed.data.villageId,
      author_id: user.id,
      title: parsed.data.title,
      short_description: parsed.data.short_description?.trim() || null,
      body: parsed.data.body,
      event_date: eventDate,
      era_label: parsed.data.era_label?.trim() || null,
      location_label: parsed.data.location_label?.trim() || null,
      latitude,
      longitude,
      media_urls: media,
      source_links: links,
      status: "approved",
      published_at: teraz,
      moderated_by: user.id,
      moderated_at: teraz,
    })
    .select("id")
    .single();
  if (error) {
    console.error("[dodajWpisHistoriiWsi]", error.message);
    return { blad: "Nie udało się dodać wpisu historii." };
  }
  const { data: wies } = await supabase
    .from("villages")
    .select("name, voivodeship, county, commune, slug")
    .eq("id", parsed.data.villageId)
    .maybeSingle();
  if (wstawiony?.id && wies?.slug) {
    void powiadomObserwujacychONowejHistorii({
      entryId: wstawiony.id,
      villageId: parsed.data.villageId,
      tytul: parsed.data.title,
      wies: {
        name: wies.name,
        voivodeship: wies.voivodeship,
        county: wies.county,
        commune: wies.commune,
        slug: wies.slug,
      },
      authorId: user.id,
    });
  }
  await rewalidujHistorieWsi(parsed.data.villageId);
  return { ok: true };
}

export async function edytujWpisHistoriiWsi(dane: z.infer<typeof schemaEdycja>): Promise<WynikProsty> {
  const parsed = schemaEdycja.safeParse(dane);
  if (!parsed.success) return { blad: "Sprawdź dane wpisu." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await mozeZarzadzacWies(supabase, user.id, parsed.data.villageId))) {
    return { blad: "Brak uprawnień." };
  }

  const links = parsed.data.source_links_csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
  const media = parsujMediaUrls(parsed.data.media_urls_csv);
  const eventDate = parsed.data.event_date?.trim() ? parsed.data.event_date.trim() : null;
  const { latitude, longitude } = parsujWspolrzedne(parsed.data.latitude, parsed.data.longitude);

  const { error } = await supabase
    .from("village_history_entries")
    .update({
      title: parsed.data.title,
      short_description: parsed.data.short_description?.trim() || null,
      body: parsed.data.body,
      event_date: eventDate,
      era_label: parsed.data.era_label?.trim() || null,
      location_label: parsed.data.location_label?.trim() || null,
      latitude,
      longitude,
      media_urls: media,
      source_links: links,
    })
    .eq("id", parsed.data.id)
    .eq("village_id", parsed.data.villageId);

  if (error) {
    console.error("[edytujWpisHistoriiWsi]", error.message);
    return { blad: "Nie udało się zapisać zmian." };
  }
  await rewalidujHistorieWsi(parsed.data.villageId);
  return { ok: true };
}

export async function usunWpisHistoriiWsi(villageId: string, id: string): Promise<WynikProsty> {
  const vid = z.string().uuid().safeParse(villageId);
  const wid = z.string().uuid().safeParse(id);
  if (!vid.success || !wid.success) return { blad: "Niepoprawne dane." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await mozeZarzadzacWies(supabase, user.id, vid.data))) {
    return { blad: "Brak uprawnień." };
  }

  const { error } = await supabase
    .from("village_history_entries")
    .delete()
    .eq("id", wid.data)
    .eq("village_id", vid.data);
  if (error) {
    console.error("[usunWpisHistoriiWsi]", error.message);
    return { blad: "Nie udało się usunąć wpisu." };
  }
  await rewalidujHistorieWsi(vid.data);
  return { ok: true };
}

const schemaIdWsi = z.object({
  villageId: z.string().uuid(),
  id: z.string().uuid(),
});

export async function zatwierdzWpisHistoriiWsi(
  dane: z.infer<typeof schemaIdWsi>,
): Promise<WynikProsty> {
  const parsed = schemaIdWsi.safeParse(dane);
  if (!parsed.success) return { blad: "Niepoprawne dane." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await mozeZarzadzacWies(supabase, user.id, parsed.data.villageId))) {
    return { blad: "Brak uprawnień." };
  }

  const { data: wpis } = await supabase
    .from("village_history_entries")
    .select("id, title, author_id")
    .eq("id", parsed.data.id)
    .eq("village_id", parsed.data.villageId)
    .eq("status", "pending")
    .maybeSingle();
  if (!wpis) return { blad: "Nie znaleziono wspomnienia do zatwierdzenia." };

  const teraz = new Date().toISOString();
  const { error } = await supabase
    .from("village_history_entries")
    .update({
      status: "approved",
      published_at: teraz,
      moderated_by: user.id,
      moderated_at: teraz,
      moderation_note: null,
    })
    .eq("id", parsed.data.id)
    .eq("village_id", parsed.data.villageId)
    .eq("status", "pending");

  if (error) {
    console.error("[zatwierdzWpisHistoriiWsi]", error.message);
    return { blad: "Nie udało się zatwierdzić wpisu." };
  }

  const { data: wies } = await supabase
    .from("villages")
    .select("name, voivodeship, county, commune, slug")
    .eq("id", parsed.data.villageId)
    .maybeSingle();
  if (wies?.slug) {
    void powiadomObserwujacychONowejHistorii({
      entryId: parsed.data.id,
      villageId: parsed.data.villageId,
      tytul: String(wpis.title),
      wies: {
        name: wies.name,
        voivodeship: wies.voivodeship,
        county: wies.county,
        commune: wies.commune,
        slug: wies.slug,
      },
      authorId: (wpis.author_id as string | null) ?? user.id,
    });
  }
  await rewalidujHistorieWsi(parsed.data.villageId);
  return { ok: true };
}

export async function przelaczWyroznienieWpisuHistorii(
  dane: z.infer<typeof schemaIdWsi>,
): Promise<WynikProsty> {
  const parsed = schemaIdWsi.safeParse(dane);
  if (!parsed.success) return { blad: "Niepoprawne dane." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await mozeZarzadzacWies(supabase, user.id, parsed.data.villageId))) {
    return { blad: "Brak uprawnień." };
  }

  const { data: wpis } = await supabase
    .from("village_history_entries")
    .select("is_featured")
    .eq("id", parsed.data.id)
    .eq("village_id", parsed.data.villageId)
    .eq("status", "approved")
    .maybeSingle();
  if (!wpis) return { blad: "Nie znaleziono wpisu." };

  const nowe = !Boolean(wpis.is_featured);
  if (nowe) {
    await supabase
      .from("village_history_entries")
      .update({ is_featured: false })
      .eq("village_id", parsed.data.villageId)
      .eq("is_featured", true);
  }

  const { error } = await supabase
    .from("village_history_entries")
    .update({ is_featured: nowe })
    .eq("id", parsed.data.id)
    .eq("village_id", parsed.data.villageId);
  if (error) {
    console.error("[przelaczWyroznienieWpisuHistorii]", error.message);
    return { blad: "Nie udało się zmienić wyróżnienia." };
  }
  await rewalidujHistorieWsi(parsed.data.villageId);
  return { ok: true };
}

export async function odrzucWpisHistoriiWsi(
  dane: z.infer<typeof schemaIdWsi> & { notatka?: string },
): Promise<WynikProsty> {
  const parsed = schemaIdWsi.safeParse(dane);
  if (!parsed.success) return { blad: "Niepoprawne dane." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await mozeZarzadzacWies(supabase, user.id, parsed.data.villageId))) {
    return { blad: "Brak uprawnień." };
  }

  const { error } = await supabase
    .from("village_history_entries")
    .update({
      status: "rejected",
      moderated_by: user.id,
      moderated_at: new Date().toISOString(),
      moderation_note: dane.notatka?.trim().slice(0, 500) || "Odrzucone przez sołtysa.",
    })
    .eq("id", parsed.data.id)
    .eq("village_id", parsed.data.villageId)
    .eq("status", "pending");

  if (error) {
    console.error("[odrzucWpisHistoriiWsi]", error.message);
    return { blad: "Nie udało się odrzucić wpisu." };
  }
  await rewalidujHistorieWsi(parsed.data.villageId);
  return { ok: true };
}
