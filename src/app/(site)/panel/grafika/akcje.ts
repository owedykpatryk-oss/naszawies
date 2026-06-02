"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { pobierzVillageIdsRoliPaneluSoltysa } from "@/lib/panel/rola-panelu-soltysa";
import { czyMozeZapisacGrafikeDlaWsi } from "@/lib/panel/grafika-uprawnienia";
import type { PlakatPubliczny } from "@/components/grafika/galeria-plakatow-wsi";
import type { ProjektGrafiki, SzablonSpolecznosciGrafiki, WartosciPolGrafiki } from "@/lib/grafika/typy";
import { normalizujBackgroundOverlay } from "@/lib/grafika/meta-tla-grafiki";
import {
  miejsceWydarzeniaZWartosci,
  opisWydarzeniaZWartosci,
  parsujDateTimeZWartosci,
  tytulWydarzeniaZWartosci,
} from "@/lib/grafika/parsuj-wydarzenie-z-grafiki";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import { wyslijPrzezResend } from "@/lib/email/wyslij-przez-resend";
import { htmlSzablonNaszawies, siteUrlDlaSzablonuEmail } from "@/lib/email/szablon-html-naszawies";
import { pobierzUzytkownikaDoAkcji } from "@/lib/auth/pobierz-uzytkownika-serwer";

const uuid = z.string().uuid();

export type WynikProsty = { blad: string } | { ok: true };

type WierszProjektu = {
  id: string;
  village_id: string | null;
  created_by: string;
  template_id: string;
  title: string;
  theme_id: string;
  field_values: WartosciPolGrafiki;
  logo_data_url: string | null;
  background_data_url: string | null;
  background_overlay: number | null;
  canvas_json: Record<string, unknown> | null;
  qr_url: string | null;
  booking_id: string | null;
  is_public: boolean;
  updated_at: string;
  published_at: string | null;
  linked_post_id: string | null;
  linked_event_id: string | null;
  featured_on_digital_board: boolean;
};

function mapujWiersz(w: WierszProjektu): ProjektGrafiki {
  return {
    id: w.id,
    templateId: w.template_id,
    tytul: w.title,
    motywId: w.theme_id,
    wartosci: w.field_values ?? {},
    logoDataUrl: w.logo_data_url,
    backgroundDataUrl: w.background_data_url,
    backgroundOverlay: normalizujBackgroundOverlay(w.background_overlay ?? undefined),
    canvasJson: w.canvas_json,
    qrUrl: w.qr_url,
    isPublic: w.is_public,
    villageId: w.village_id,
    bookingId: w.booking_id,
    updatedAt: w.updated_at,
    linkedPostId: w.linked_post_id,
    linkedEventId: w.linked_event_id,
    featuredOnDigitalBoard: w.featured_on_digital_board,
  };
}

export async function wczytajProjektyGrafiki(
  villageId?: string,
): Promise<{ blad: string } | { projekty: ProjektGrafiki[] }> {
  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się." };

  let query = supabase
    .from("village_graphic_designs")
    .select("*")
    .eq("created_by", user.id)
    .order("updated_at", { ascending: false })
    .limit(30);

  if (villageId) {
    query = query.eq("village_id", villageId);
  }

  const { data, error } = await query;
  if (error) {
    if (error.code === "42P01") {
      return { projekty: [] };
    }
    return { blad: error.message };
  }

  return { projekty: ((data ?? []) as WierszProjektu[]).map(mapujWiersz) };
}

const schemaZapisu = z.object({
  id: z.string().uuid().optional(),
  villageId: z.string().uuid().nullable().optional(),
  templateId: z.string().min(1).max(120),
  tytul: z.string().min(1).max(200),
  motywId: z.string().min(1).max(80),
  wartosci: z.record(z.string(), z.string()),
  logoDataUrl: z.string().max(3_000_000).nullable().optional(),
  backgroundDataUrl: z.string().max(3_000_000).nullable().optional(),
  backgroundOverlay: z.number().min(0).max(1).optional(),
  canvasJson: z.record(z.string(), z.unknown()).nullable().optional(),
  qrUrl: z.string().max(2000).nullable().optional(),
  bookingId: z.string().uuid().nullable().optional(),
});

export async function zapiszProjektGrafiki(
  dane: z.infer<typeof schemaZapisu>,
): Promise<WynikProsty & { id?: string }> {
  const parsed = schemaZapisu.safeParse(dane);
  if (!parsed.success) return { blad: "Niepoprawne dane projektu." };

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się." };

  const {
    villageId,
    templateId,
    tytul,
    motywId,
    wartosci,
    logoDataUrl,
    backgroundDataUrl,
    backgroundOverlay,
    canvasJson,
    qrUrl,
    bookingId,
  } = parsed.data;
  const id = parsed.data.id ?? crypto.randomUUID();

  if (villageId) {
    const wolno = await czyMozeZapisacGrafikeDlaWsi(supabase, user.id, villageId);
    if (!wolno) {
      return { blad: "Brak uprawnień do zapisu dla tej wsi." };
    }
  }

  const payload: Record<string, unknown> = {
    id,
    village_id: villageId ?? null,
    created_by: user.id,
    template_id: templateId,
    title: tytul,
    theme_id: motywId,
    field_values: wartosci,
    logo_data_url: logoDataUrl ?? null,
    background_data_url: backgroundDataUrl ?? null,
    background_overlay: normalizujBackgroundOverlay(backgroundOverlay),
    canvas_json: canvasJson ?? null,
    qr_url: qrUrl ?? null,
    booking_id: bookingId ?? null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("village_graphic_designs").upsert(payload);
  if (error) {
    if (error.code === "42P01") {
      return { blad: "Tabela projektów graficznych nie jest jeszcze wdrożona — użyj zapisu lokalnego." };
    }
    return { blad: error.message };
  }

  revalidatePath("/panel/soltys/grafika");
  revalidatePath("/panel/mieszkaniec/grafika");
  return { ok: true, id };
}

export async function opublikujPlakatNaProfilWsi(projektId: string): Promise<WynikProsty> {
  const parsed = uuid.safeParse(projektId);
  if (!parsed.success) return { blad: "Niepoprawny identyfikator." };

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się." };

  const { data: projekt } = await supabase
    .from("village_graphic_designs")
    .select("id, village_id, created_by")
    .eq("id", parsed.data)
    .eq("created_by", user.id)
    .maybeSingle();

  if (!projekt?.village_id) {
    return { blad: "Projekt musi być przypisany do wsi." };
  }

  const dozwolone = await pobierzVillageIdsRoliPaneluSoltysa(supabase, user.id);
  if (!dozwolone.includes(projekt.village_id)) {
    return { blad: "Brak uprawnień sołtysa do publikacji." };
  }

  const { error } = await supabase
    .from("village_graphic_designs")
    .update({
      is_public: true,
      published_at: new Date().toISOString(),
    })
    .eq("id", parsed.data);

  if (error) return { blad: error.message };

  const { data: v } = await supabase
    .from("villages")
    .select("voivodeship, county, commune, slug")
    .eq("id", projekt.village_id)
    .maybeSingle();

  revalidatePath("/panel/soltys/grafika");
  if (v) {
    revalidatePath(sciezkaProfiluWsi(v));
  }
  return { ok: true };
}

export async function pobierzLogoWsiJakoDataUrl(
  villageId: string,
): Promise<{ dataUrl: string } | { blad: string }> {
  const parsed = uuid.safeParse(villageId);
  if (!parsed.success) return { blad: "Niepoprawna wieś." };

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się." };

  const dozwolone = await pobierzVillageIdsRoliPaneluSoltysa(supabase, user.id);
  if (!dozwolone.includes(parsed.data)) {
    return { blad: "Brak uprawnień." };
  }

  const { data: v } = await supabase
    .from("villages")
    .select("cover_image_url")
    .eq("id", parsed.data)
    .maybeSingle();

  const url = v?.cover_image_url?.trim();
  if (!url) {
    return { blad: "W profilu wsi nie ma jeszcze zdjęcia okładki — dodaj w „Moja wieś”." };
  }

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return { blad: "Nie udało się pobrać zdjęcia z profilu." };
    const buf = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const dataUrl = `data:${contentType};base64,${buf.toString("base64")}`;
    if (dataUrl.length > 2_500_000) {
      return { blad: "Zdjęcie okładki jest za duże — użyj mniejszego pliku w profilu wsi." };
    }
    return { dataUrl };
  } catch {
    return { blad: "Błąd pobierania obrazu okładki." };
  }
}

export async function usunProjektGrafiki(id: string): Promise<WynikProsty> {
  const parsed = uuid.safeParse(id);
  if (!parsed.success) return { blad: "Niepoprawny identyfikator." };

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się." };

  const { error } = await supabase
    .from("village_graphic_designs")
    .delete()
    .eq("id", parsed.data)
    .eq("created_by", user.id);

  if (error) {
    if (error.code === "42P01") return { ok: true };
    return { blad: error.message };
  }

  revalidatePath("/panel/soltys/grafika");
  return { ok: true };
}

const schemaEmail = z.object({
  do: z.string().email(),
  temat: z.string().min(1).max(200),
  wiadomosc: z.string().min(1).max(5000),
  pdfBase64: z.string().min(100).max(8_000_000),
  nazwaPliku: z.string().min(1).max(120),
});

export async function wyslijGrafikeEmail(dane: z.infer<typeof schemaEmail>): Promise<WynikProsty> {
  const parsed = schemaEmail.safeParse(dane);
  if (!parsed.success) return { blad: "Niepoprawne dane wiadomości." };

  const user = await pobierzUzytkownikaDoAkcji();
  if (!user) return { blad: "Zaloguj się." };

  const html = htmlSzablonNaszawies({
    siteUrl: siteUrlDlaSzablonuEmail(),
    naglowek: parsed.data.temat,
    trescHtml: `<p style="margin:0;">${parsed.data.wiadomosc.replace(/\n/g, "<br/>")}</p>`,
  });

  const w = await wyslijPrzezResend({
    do: parsed.data.do,
    temat: parsed.data.temat,
    trescHtml: html,
    zalaczniki: [{ filename: parsed.data.nazwaPliku, content: parsed.data.pdfBase64 }],
  });

  if (!w.ok) return { blad: w.blad };
  return { ok: true };
}

export async function pobierzPublicznePlakatyWsi(villageId: string): Promise<PlakatPubliczny[]> {
  const parsed = uuid.safeParse(villageId);
  if (!parsed.success) return [];

  const supabase = createPublicSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("village_graphic_designs")
    .select(
      "id, title, template_id, theme_id, field_values, logo_data_url, background_data_url, qr_url, published_at",
    )
    .eq("village_id", parsed.data)
    .eq("is_public", true)
    .order("published_at", { ascending: false })
    .limit(12);

  if (error || !data) return [];

  return data.map((w) => ({
    id: w.id,
    tytul: w.title,
    templateId: w.template_id,
    motywId: w.theme_id,
    wartosci: (w.field_values ?? {}) as WartosciPolGrafiki,
    logoDataUrl: w.logo_data_url,
    backgroundDataUrl: w.background_data_url,
    qrUrl: w.qr_url,
    publishedAt: w.published_at ?? new Date().toISOString(),
  }));
}

async function wczytajProjektSoltysa(
  supabase: Awaited<ReturnType<typeof utworzKlientaSupabaseSerwer>>,
  userId: string,
  projektId: string,
): Promise<{ blad: string } | { projekt: WierszProjektu }> {
  const { data: projekt } = await supabase
    .from("village_graphic_designs")
    .select("*")
    .eq("id", projektId)
    .eq("created_by", userId)
    .maybeSingle();

  if (!projekt?.village_id) {
    return { blad: "Projekt musi być przypisany do wsi." };
  }

  const dozwolone = await pobierzVillageIdsRoliPaneluSoltysa(supabase, userId);
  if (!dozwolone.includes(projekt.village_id)) {
    return { blad: "Brak uprawnień sołtysa." };
  }

  return { projekt: projekt as WierszProjektu };
}

async function revalidateProfilPoIntegracji(
  supabase: Awaited<ReturnType<typeof utworzKlientaSupabaseSerwer>>,
  villageId: string,
) {
  const { data: v } = await supabase
    .from("villages")
    .select("voivodeship, county, commune, slug")
    .eq("id", villageId)
    .maybeSingle();
  revalidatePath("/panel/soltys/grafika");
  revalidatePath("/panel/soltys");
  revalidatePath("/panel/mieszkaniec/ogloszenia");
  if (v) {
    revalidatePath(sciezkaProfiluWsi(v));
  }
}

export async function dodajOgloszenieZPlakatu(projektId: string): Promise<WynikProsty & { postId?: string }> {
  const parsed = uuid.safeParse(projektId);
  if (!parsed.success) return { blad: "Niepoprawny identyfikator projektu." };

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się." };

  const wczytany = await wczytajProjektSoltysa(supabase, user.id, parsed.data);
  if ("blad" in wczytany) return wczytany;
  const projekt = wczytany.projekt;

  if (projekt.linked_post_id) {
    return { blad: "Ten projekt ma już powiązane ogłoszenie." };
  }

  const wartosci = (projekt.field_values ?? {}) as WartosciPolGrafiki;
  const { startsAt } = parsujDateTimeZWartosci(wartosci);
  const tytul = tytulWydarzeniaZWartosci(wartosci, projekt.title);
  const body = opisWydarzeniaZWartosci(wartosci);
  const teraz = new Date().toISOString();

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      village_id: projekt.village_id,
      author_id: user.id,
      type: startsAt ? "wydarzenie" : "ogloszenie",
      title: tytul,
      body,
      event_start_at: startsAt,
      event_location: miejsceWydarzeniaZWartosci(wartosci),
      status: "approved",
      moderated_by: user.id,
      moderated_at: teraz,
      is_public: true,
    })
    .select("id")
    .single();

  if (error || !post) {
    console.error("[dodajOgloszenieZPlakatu]", error?.message);
    return { blad: "Nie udało się utworzyć ogłoszenia." };
  }

  await supabase
    .from("village_graphic_designs")
    .update({ linked_post_id: post.id })
    .eq("id", projekt.id);

  await revalidateProfilPoIntegracji(supabase, projekt.village_id!);
  return { ok: true, postId: post.id };
}

export async function dodajDoKalendarzaZPlakatu(projektId: string): Promise<WynikProsty & { eventId?: string }> {
  const parsed = uuid.safeParse(projektId);
  if (!parsed.success) return { blad: "Niepoprawny identyfikator projektu." };

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się." };

  const wczytany = await wczytajProjektSoltysa(supabase, user.id, parsed.data);
  if ("blad" in wczytany) return wczytany;
  const projekt = wczytany.projekt;

  if (projekt.linked_event_id) {
    return { blad: "Ten projekt ma już powiązane wydarzenie w kalendarzu." };
  }

  const wartosci = (projekt.field_values ?? {}) as WartosciPolGrafiki;
  const { startsAt } = parsujDateTimeZWartosci(wartosci);
  if (!startsAt) {
    return { blad: "Uzupełnij datę wydarzenia w szablonie (krok 2)." };
  }

  const teraz = new Date();
  const expiresAt = new Date(teraz.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
  const terazIso = teraz.toISOString();

  const { data: ev, error } = await supabase
    .from("village_community_events")
    .insert({
      village_id: projekt.village_id,
      event_kind: "festyn",
      title: tytulWydarzeniaZWartosci(wartosci, projekt.title),
      description: opisWydarzeniaZWartosci(wartosci),
      location_text: miejsceWydarzeniaZWartosci(wartosci),
      starts_at: startsAt,
      status: "approved",
      published_at: terazIso,
      expires_at: expiresAt,
      moderated_by: user.id,
      moderated_at: terazIso,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !ev) {
    console.error("[dodajDoKalendarzaZPlakatu]", error?.message);
    return { blad: "Nie udało się dodać wydarzenia do kalendarza." };
  }

  await supabase
    .from("village_graphic_designs")
    .update({ linked_event_id: ev.id })
    .eq("id", projekt.id);

  await revalidateProfilPoIntegracji(supabase, projekt.village_id!);
  revalidatePath("/panel/soltys/spolecznosc");
  return { ok: true, eventId: ev.id };
}

export async function ustawPlakatNaTablicyCyfrowej(
  projektId: string,
  wlacz: boolean,
): Promise<WynikProsty> {
  const parsed = uuid.safeParse(projektId);
  if (!parsed.success) return { blad: "Niepoprawny identyfikator projektu." };

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się." };

  const wczytany = await wczytajProjektSoltysa(supabase, user.id, parsed.data);
  if ("blad" in wczytany) return wczytany;
  const projekt = wczytany.projekt;

  if (wlacz && !projekt.is_public) {
    return { blad: "Najpierw opublikuj plakat na profilu wsi." };
  }

  const { error } = await supabase
    .from("village_graphic_designs")
    .update({ featured_on_digital_board: wlacz })
    .eq("id", projekt.id);

  if (error) {
    if (error.code === "42703") {
      return { blad: "Uruchom migrację bazy (tablica cyfrowa)." };
    }
    return { blad: error.message };
  }

  revalidatePath("/panel/soltys/grafika");
  if (projekt.village_id) {
    revalidatePath("/panel/soltys/swietlica");
  }
  return { ok: true };
}

export async function pobierzPlakatyTablicyCyfrowejWsi(villageId: string): Promise<PlakatPubliczny[]> {
  const parsed = uuid.safeParse(villageId);
  if (!parsed.success) return [];

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return [];

  const dozwolone = await pobierzVillageIdsRoliPaneluSoltysa(supabase, user.id);
  if (!dozwolone.includes(parsed.data)) return [];

  const { data, error } = await supabase
    .from("village_graphic_designs")
    .select(
      "id, title, template_id, theme_id, field_values, logo_data_url, background_data_url, qr_url, published_at",
    )
    .eq("village_id", parsed.data)
    .eq("is_public", true)
    .eq("featured_on_digital_board", true)
    .order("published_at", { ascending: false })
    .limit(20);

  if (error) {
    if (error.code === "42703") {
      return pobierzPublicznePlakatyWsi(parsed.data);
    }
    return [];
  }

  return (data ?? []).map((w) => ({
    id: w.id,
    tytul: w.title,
    templateId: w.template_id,
    motywId: w.theme_id,
    wartosci: (w.field_values ?? {}) as WartosciPolGrafiki,
    logoDataUrl: w.logo_data_url,
    backgroundDataUrl: w.background_data_url,
    qrUrl: w.qr_url,
    publishedAt: w.published_at ?? new Date().toISOString(),
  }));
}

type WierszSzablonuSpolecznosci = {
  id: string;
  created_by: string;
  village_name: string | null;
  title: string;
  description: string | null;
  template_id: string;
  theme_id: string;
  field_values: WartosciPolGrafiki;
  logo_data_url: string | null;
  background_data_url: string | null;
  background_overlay: number | null;
  qr_url: string | null;
  created_at: string;
};

function mapujSzablonSpolecznosci(w: WierszSzablonuSpolecznosci): SzablonSpolecznosciGrafiki {
  return {
    id: w.id,
    tytul: w.title,
    opis: w.description,
    templateId: w.template_id,
    motywId: w.theme_id,
    wartosci: w.field_values ?? {},
    logoDataUrl: w.logo_data_url,
    backgroundDataUrl: w.background_data_url,
    backgroundOverlay: normalizujBackgroundOverlay(w.background_overlay ?? undefined),
    qrUrl: w.qr_url,
    villageName: w.village_name,
    createdBy: w.created_by,
    createdAt: w.created_at,
  };
}

const schemaPublikacjiSzablonu = z.object({
  tytul: z.string().min(1).max(200),
  opis: z.string().max(500).optional(),
  villageId: z.string().uuid().nullable().optional(),
  villageName: z.string().max(120).optional(),
  templateId: z.string().min(1).max(120),
  motywId: z.string().min(1).max(80),
  wartosci: z.record(z.string(), z.string()),
  logoDataUrl: z.string().max(3_000_000).nullable().optional(),
  backgroundDataUrl: z.string().max(3_000_000).nullable().optional(),
  backgroundOverlay: z.number().min(0).max(1).optional(),
  qrUrl: z.string().max(2000).nullable().optional(),
});

export async function wczytajSzablonySpolecznosci(): Promise<
  { blad: string } | { szablony: SzablonSpolecznosciGrafiki[] }
> {
  const supabase = createPublicSupabaseClient() ?? (await utworzKlientaSupabaseSerwer());
  const { data, error } = await supabase
    .from("community_graphic_templates")
    .select(
      "id, created_by, village_name, title, description, template_id, theme_id, field_values, logo_data_url, background_data_url, background_overlay, qr_url, created_at",
    )
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) {
    if (error.code === "42P01") return { szablony: [] };
    return { blad: error.message };
  }

  return { szablony: ((data ?? []) as WierszSzablonuSpolecznosci[]).map(mapujSzablonSpolecznosci) };
}

export async function opublikujSzablonSpolecznosci(
  dane: z.infer<typeof schemaPublikacjiSzablonu>,
): Promise<WynikProsty & { id?: string }> {
  const parsed = schemaPublikacjiSzablonu.safeParse(dane);
  if (!parsed.success) return { blad: "Niepoprawne dane szablonu." };

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się." };

  const id = crypto.randomUUID();
  const { error } = await supabase.from("community_graphic_templates").insert({
    id,
    created_by: user.id,
    village_id: parsed.data.villageId ?? null,
    village_name: parsed.data.villageName ?? null,
    title: parsed.data.tytul,
    description: parsed.data.opis ?? null,
    template_id: parsed.data.templateId,
    theme_id: parsed.data.motywId,
    field_values: parsed.data.wartosci,
    logo_data_url: parsed.data.logoDataUrl ?? null,
    background_data_url: parsed.data.backgroundDataUrl ?? null,
    background_overlay: normalizujBackgroundOverlay(parsed.data.backgroundOverlay),
    qr_url: parsed.data.qrUrl ?? null,
    is_public: true,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    if (error.code === "42P01") {
      return { blad: "Udostępnianie szablonów wymaga migracji bazy — skontaktuj się z administratorem." };
    }
    return { blad: error.message };
  }

  revalidatePath("/panel/soltys/grafika");
  revalidatePath("/panel/mieszkaniec/grafika");
  return { ok: true, id };
}

export async function usunSzablonSpolecznosci(id: string): Promise<WynikProsty> {
  const parsed = uuid.safeParse(id);
  if (!parsed.success) return { blad: "Niepoprawny identyfikator." };

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się." };

  const { error } = await supabase
    .from("community_graphic_templates")
    .delete()
    .eq("id", parsed.data)
    .eq("created_by", user.id);

  if (error) {
    if (error.code === "42P01") return { ok: true };
    return { blad: error.message };
  }

  revalidatePath("/panel/soltys/grafika");
  revalidatePath("/panel/mieszkaniec/grafika");
  return { ok: true };
}
