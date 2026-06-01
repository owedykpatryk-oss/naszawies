"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { KATEGORIE_PROPONOWALNE_POI } from "@/lib/mapa/kategorie-poi-bazowe";
import { KATEGORIA_INWESTYCJA, STATUSY_INWESTYCJI } from "@/lib/mapa/inwestycje-poi";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { pobierzUzytkownikaDoAkcji } from "@/lib/auth/pobierz-uzytkownika-serwer";

export type WynikEdytoraMapy = { ok: true; id?: string } | { blad: string };

const kategorieDozwolone = [...KATEGORIE_PROPONOWALNE_POI] as [string, ...string[]];

const schemaDodaj = z
  .object({
    villageId: z.string().uuid(),
    category: z.enum(kategorieDozwolone),
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(800).optional().nullable(),
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    investmentStatus: z.enum(STATUSY_INWESTYCJI).optional().nullable(),
    plannedCompletionAt: z.string().trim().optional().nullable(),
    documentUrl: z.string().trim().max(500).optional().nullable(),
  })
  .superRefine((d, ctx) => {
    if (d.category === KATEGORIA_INWESTYCJA && !d.investmentStatus) {
      ctx.addIssue({
        code: "custom",
        message: "Dla inwestycji wybierz status (planowana, w budowie…).",
        path: ["investmentStatus"],
      });
    }
    const doc = d.documentUrl?.trim();
    if (doc && !doc.startsWith("http://") && !doc.startsWith("https://")) {
      ctx.addIssue({
        code: "custom",
        message: "Link do dokumentu musi zaczynać się od http:// lub https://",
        path: ["documentUrl"],
      });
    }
  });

const schemaPrzesun = z.object({
  poiId: z.string().uuid(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

const schemaUsun = z.object({
  poiId: z.string().uuid(),
});

async function wymagajPoi(poiId: string) {
  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { ok: false as const, blad: "Zaloguj się." };

  const { data: poi } = await supabase
    .from("pois")
    .select("id, village_id, category, name, source")
    .eq("id", poiId)
    .maybeSingle();
  if (!poi) return { ok: false as const, blad: "Nie znaleziono pinezki." };

  const vids = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  if (!vids.includes(poi.village_id)) return { ok: false as const, blad: "Brak uprawnień do tej wsi." };

  return { ok: true as const, supabase, poi };
}

function revalidatePoZmianieMapy(villageId?: string) {
  revalidatePath("/mapa");
  revalidatePath("/panel/soltys/mapa");
  revalidatePath("/panel/soltys/moja-wies");
  revalidatePath("/wies");
  if (villageId) {
    revalidatePath(`/mapa/miejsce/${villageId}`);
  }
}

export async function dodajPoiNaMapieSoltys(dane: z.infer<typeof schemaDodaj>): Promise<WynikEdytoraMapy> {
  const parsed = schemaDodaj.safeParse(dane);
  if (!parsed.success) {
    return { blad: parsed.error.issues[0]?.message ?? "Sprawdź nazwę i kategorię." };
  }

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się." };

  const vids = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  if (!vids.includes(parsed.data.villageId)) return { blad: "Brak uprawnień do tej wsi." };

  const { data: village } = await supabase
    .from("villages")
    .select("voivodeship, county, commune, slug")
    .eq("id", parsed.data.villageId)
    .maybeSingle();

  const { data: inserted, error } = await supabase
    .from("pois")
    .insert({
      village_id: parsed.data.villageId,
      category: parsed.data.category,
      name: parsed.data.name,
      description: parsed.data.description?.trim() || null,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      source: "manual",
      confidence: 0.95,
      verified_at: new Date().toISOString(),
      is_local_override: true,
      ...(parsed.data.category === KATEGORIA_INWESTYCJA
        ? {
            investment_status: parsed.data.investmentStatus ?? "planowana",
            planned_completion_at: parsed.data.plannedCompletionAt?.trim().slice(0, 10) || null,
            document_url: parsed.data.documentUrl?.trim() || null,
          }
        : {}),
    })
    .select("id")
    .single();

  if (error || !inserted) {
    console.error("[dodajPoiNaMapieSoltys]", error?.message);
    return { blad: "Nie udało się dodać pinezki." };
  }

  revalidatePoZmianieMapy();
  if (village) revalidatePath(sciezkaProfiluWsi(village));
  revalidatePath(`/mapa/miejsce/${inserted.id}`);

  return { ok: true, id: inserted.id };
}

export async function przesunPoiNaMapieSoltys(dane: z.infer<typeof schemaPrzesun>): Promise<WynikEdytoraMapy> {
  const parsed = schemaPrzesun.safeParse(dane);
  if (!parsed.success) return { blad: "Nieprawidłowe współrzędne." };

  const auth = await wymagajPoi(parsed.data.poiId);
  if (!auth.ok) return { blad: auth.blad };

  const { error } = await auth.supabase
    .from("pois")
    .update({
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      verified_at: new Date().toISOString(),
      is_local_override: true,
      source:
        auth.poi.source === "osm_auto" || auth.poi.source === "geoportal"
          ? "local_corrected"
          : auth.poi.source ?? "manual",
    })
    .eq("id", parsed.data.poiId);

  if (error) {
    console.error("[przesunPoiNaMapieSoltys]", error.message);
    return { blad: "Nie udało się przesunąć pinezki." };
  }

  revalidatePoZmianieMapy(auth.poi.village_id);
  revalidatePath(`/mapa/miejsce/${parsed.data.poiId}`);
  return { ok: true };
}

export async function usunPoiNaMapieSoltys(dane: z.infer<typeof schemaUsun>): Promise<WynikEdytoraMapy> {
  const parsed = schemaUsun.safeParse(dane);
  if (!parsed.success) return { blad: "Nieprawidłowy punkt." };

  const auth = await wymagajPoi(parsed.data.poiId);
  if (!auth.ok) return { blad: auth.blad };

  const src = auth.poi.source ?? "";
  if (src === "geoportal" || src === "nazwa_geo") {
    return { blad: "Tej pinezki nie można usunąć z edytora (dane urzędowe)." };
  }

  const { error } = await auth.supabase.from("pois").delete().eq("id", parsed.data.poiId);
  if (error) return { blad: "Nie udało się usunąć pinezki." };

  revalidatePoZmianieMapy(auth.poi.village_id);
  return { ok: true };
}

const schemaAktualizujInwestycje = z
  .object({
    poiId: z.string().uuid(),
    investmentStatus: z.enum(STATUSY_INWESTYCJI),
    plannedCompletionAt: z.string().trim().optional().nullable(),
    documentUrl: z.string().trim().max(500).optional().nullable(),
    description: z.string().trim().max(800).optional().nullable(),
  })
  .superRefine((d, ctx) => {
    const doc = d.documentUrl?.trim();
    if (doc && !doc.startsWith("http://") && !doc.startsWith("https://")) {
      ctx.addIssue({
        code: "custom",
        message: "Link do dokumentu musi zaczynać się od http:// lub https://",
        path: ["documentUrl"],
      });
    }
  });

export async function aktualizujInwestycjePoiSoltys(
  dane: z.infer<typeof schemaAktualizujInwestycje>,
): Promise<WynikEdytoraMapy> {
  const parsed = schemaAktualizujInwestycje.safeParse(dane);
  if (!parsed.success) {
    return { blad: parsed.error.issues[0]?.message ?? "Sprawdź dane inwestycji." };
  }

  const auth = await wymagajPoi(parsed.data.poiId);
  if (!auth.ok) return { blad: auth.blad };
  if (auth.poi.category !== KATEGORIA_INWESTYCJA) {
    return { blad: "Ten punkt nie jest inwestycją." };
  }

  const { error } = await auth.supabase
    .from("pois")
    .update({
      investment_status: parsed.data.investmentStatus,
      planned_completion_at: parsed.data.plannedCompletionAt?.trim().slice(0, 10) || null,
      document_url: parsed.data.documentUrl?.trim() || null,
      description: parsed.data.description?.trim() || null,
      verified_at: new Date().toISOString(),
      is_local_override: true,
    })
    .eq("id", parsed.data.poiId);

  if (error) {
    console.error("[aktualizujInwestycjePoiSoltys]", error.message);
    return { blad: "Nie udało się zapisać inwestycji." };
  }

  revalidatePoZmianieMapy(auth.poi.village_id);
  revalidatePath(`/mapa/miejsce/${parsed.data.poiId}`);
  return { ok: true };
}
