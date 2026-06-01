"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { czyMaDostepMieszkancaDoWsi } from "@/lib/historia/dostep-mieszkaniec-wsi";
import { powiadomSoltysowOWspomnieniuHistorii } from "@/lib/historia/powiadomienia-historii";
import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { pobierzUzytkownikaDoAkcji } from "@/lib/auth/pobierz-uzytkownika-serwer";

export type WynikHistoriaMieszkanca = { blad: string } | { ok: true; komunikat?: string };

const schemaWspomnienie = z.object({
  villageId: z.string().uuid(),
  title: z.string().trim().min(5).max(180),
  short_description: z.string().trim().max(500).nullable().optional(),
  body: z.string().trim().min(30).max(20000),
  event_date: z.string().trim().max(20).nullable().optional(),
  era_label: z.string().trim().max(120).nullable().optional(),
  location_label: z.string().trim().max(200).nullable().optional(),
});

function sprawdzTresc(tresc: string): string | null {
  const t = tresc.trim();
  if (t.length < 30) return "Opis jest za krótki.";
  if ((t.match(/https?:\/\//gi) ?? []).length > 2) return "Za dużo linków (maks. 2).";
  return null;
}

export async function zglosWspomnienieHistorii(
  dane: z.infer<typeof schemaWspomnienie>,
): Promise<WynikHistoriaMieszkanca> {
  const parsed = schemaWspomnienie.safeParse(dane);
  if (!parsed.success) return { blad: "Sprawdź tytuł i opis wspomnienia." };

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await czyMaDostepMieszkancaDoWsi(supabase, user.id, parsed.data.villageId))) {
    return { blad: "Dołącz do wsi lub obserwuj ją, aby zgłosić wspomnienie." };
  }

  const trescErr = sprawdzTresc(`${parsed.data.title}\n${parsed.data.body}`);
  if (trescErr) return { blad: trescErr };

  const od = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("village_history_entries")
    .select("id", { count: "exact", head: true })
    .eq("author_id", user.id)
    .eq("village_id", parsed.data.villageId)
    .gte("created_at", od);
  if ((count ?? 0) >= 2) {
    return { blad: "Limit: maksymalnie 2 wspomnienia na dobę dla tej wsi." };
  }

  const eventDate = parsed.data.event_date?.trim() ? parsed.data.event_date.trim() : null;
  const { error } = await supabase.from("village_history_entries").insert({
    village_id: parsed.data.villageId,
    author_id: user.id,
    title: parsed.data.title,
    short_description: parsed.data.short_description?.trim() || null,
    body: parsed.data.body,
    event_date: eventDate,
    era_label: parsed.data.era_label?.trim() || null,
    location_label: parsed.data.location_label?.trim() || null,
    media_urls: [],
    source_links: [],
    status: "pending",
  });
  if (error) {
    console.error("[zglosWspomnienieHistorii]", error.message);
    return { blad: "Nie udało się wysłać wspomnienia." };
  }

  const { data: wies } = await supabase
    .from("villages")
    .select("name, voivodeship, county, commune, slug")
    .eq("id", parsed.data.villageId)
    .maybeSingle();

  const admin = createAdminSupabaseClient();
  if (admin && wies?.name) {
    void powiadomSoltysowOWspomnieniuHistorii(admin, {
      villageId: parsed.data.villageId,
      nazwaWsi: wies.name,
      tytul: parsed.data.title,
      authorId: user.id,
    });
  }

  revalidatePath("/panel/mieszkaniec/historia");
  revalidatePath("/panel/mieszkaniec");
  revalidatePath("/panel/soltys/spolecznosc/historia");
  if (wies) revalidatePath(sciezkaProfiluWsi(wies));
  return {
    ok: true,
    komunikat: "Wspomnienie wysłane — sołtys zatwierdzi je przed publikacją na profilu wsi.",
  };
}
