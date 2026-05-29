"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PRODUKTY_ROLNE } from "@/lib/rolnictwo/produkty-rolne";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

const uuid = z.string().uuid();

const schemaZgloszenia = z.object({
  villageId: uuid,
  productKey: z.enum(PRODUKTY_ROLNE.map((p) => p.key) as [string, ...string[]]),
  priceValue: z.number().positive().max(999_999),
  placeName: z.string().trim().min(2).max(200),
  poiId: uuid.optional().nullable(),
  observedAt: z.string().optional(),
  notes: z.string().trim().max(500).optional().nullable(),
});

const schemaPotwierdzenia = z.object({
  priceReportId: uuid,
  observedAt: z.string().optional(),
  notes: z.string().trim().max(300).optional().nullable(),
});

export type WynikRol = { blad: string } | { ok: true; id?: string };

async function czyMieszkaniecWsi(userId: string, villageId: string): Promise<boolean> {
  const supabase = utworzKlientaSupabaseSerwer();
  const { data } = await supabase
    .from("user_village_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("village_id", villageId)
    .eq("status", "active")
    .limit(1);
  return (data?.length ?? 0) > 0;
}

async function odswiezProfilWsi(villageId: string): Promise<void> {
  const supabase = utworzKlientaSupabaseSerwer();
  const { data: wies } = await supabase
    .from("villages")
    .select("slug, voivodeship, county, commune")
    .eq("id", villageId)
    .maybeSingle();
  if (!wies) return;
  revalidatePath(sciezkaProfiluWsi(wies));
}

export async function zglosCeneSkupuLokalna(dane: z.infer<typeof schemaZgloszenia>): Promise<WynikRol> {
  const parsed = schemaZgloszenia.safeParse(dane);
  if (!parsed.success) return { blad: "Sprawdź produkt, cenę i miejsce odbioru." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się, aby zgłosić cenę." };

  if (!(await czyMieszkaniecWsi(user.id, parsed.data.villageId))) {
    return { blad: "Tylko mieszkańcy wsi mogą zgłaszać ceny w swojej gminie." };
  }

  const produkt = PRODUKTY_ROLNE.find((p) => p.key === parsed.data.productKey);
  if (!produkt) return { blad: "Nieznany produkt." };

  let placeLat: number | null = null;
  let placeLon: number | null = null;
  if (parsed.data.poiId) {
    const { data: poi } = await supabase
      .from("pois")
      .select("latitude, longitude, village_id")
      .eq("id", parsed.data.poiId)
      .maybeSingle();
    if (!poi || poi.village_id !== parsed.data.villageId) {
      return { blad: "Wybrany punkt na mapie nie należy do tej wsi." };
    }
    placeLat = poi.latitude != null ? Number(poi.latitude) : null;
    placeLon = poi.longitude != null ? Number(poi.longitude) : null;
  }

  const observedAt =
    parsed.data.observedAt && parsed.data.observedAt.length >= 8
      ? parsed.data.observedAt.slice(0, 10)
      : new Date().toISOString().slice(0, 10);

  const { data: row, error } = await supabase
    .from("agri_ceny_lokalne")
    .insert({
      village_id: parsed.data.villageId,
      poi_id: parsed.data.poiId ?? null,
      product_key: produkt.key,
      price_value: parsed.data.priceValue,
      price_unit: produkt.jednostka,
      place_name: parsed.data.placeName,
      place_lat: placeLat,
      place_lon: placeLon,
      observed_at: observedAt,
      notes: parsed.data.notes?.trim() || null,
      reported_by: user.id,
      confirmation_count: 1,
    })
    .select("id")
    .maybeSingle();

  if (error || !row?.id) {
    console.error("[zglosCeneSkupuLokalna]", error?.message);
    return { blad: "Nie udało się zapisać zgłoszenia ceny." };
  }

  revalidatePath("/panel/mieszkaniec/rolnictwo-ceny");
  await odswiezProfilWsi(parsed.data.villageId);
  return { ok: true, id: row.id };
}

export async function potwierdzCeneSkupuLokalna(dane: z.infer<typeof schemaPotwierdzenia>): Promise<WynikRol> {
  const parsed = schemaPotwierdzenia.safeParse(dane);
  if (!parsed.success) return { blad: "Niepoprawne dane potwierdzenia." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się, aby potwierdzić cenę." };

  const { data: raport } = await supabase
    .from("agri_ceny_lokalne")
    .select("id, village_id, reported_by")
    .eq("id", parsed.data.priceReportId)
    .maybeSingle();

  if (!raport) return { blad: "Nie znaleziono zgłoszenia ceny." };
  if (raport.reported_by === user.id) {
    return { blad: "Autor zgłoszenia nie może go potwierdzić — poproś innych mieszkańców." };
  }
  if (!(await czyMieszkaniecWsi(user.id, raport.village_id))) {
    return { blad: "Potwierdzić mogą tylko mieszkańcy tej wsi." };
  }

  const observedAt =
    parsed.data.observedAt && parsed.data.observedAt.length >= 8
      ? parsed.data.observedAt.slice(0, 10)
      : null;

  const { error } = await supabase.from("agri_ceny_potwierdzenia").insert({
    price_report_id: parsed.data.priceReportId,
    user_id: user.id,
    observed_at: observedAt,
    notes: parsed.data.notes?.trim() || null,
  });

  if (error) {
    if (error.code === "23505") return { blad: "Już potwierdziłeś to zgłoszenie." };
    console.error("[potwierdzCeneSkupuLokalna]", error.message);
    return { blad: "Nie udało się zapisać potwierdzenia." };
  }

  revalidatePath("/panel/mieszkaniec/rolnictwo-ceny");
  await odswiezProfilWsi(raport.village_id);
  return { ok: true };
}
