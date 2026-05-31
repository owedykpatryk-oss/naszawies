"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { KATEGORIE_PROPONOWALNE_POI } from "@/lib/mapa/kategorie-poi-bazowe";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

export type WynikEdytoraMapy = { ok: true; id?: string } | { blad: string };

const kategorieDozwolone = [...KATEGORIE_PROPONOWALNE_POI] as [string, ...string[]];

const schemaDodaj = z.object({
  villageId: z.string().uuid(),
  category: z.enum(kategorieDozwolone),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(800).optional().nullable(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
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
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
