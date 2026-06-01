import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ZnacznikPoi, ZnacznikWsi } from "@/components/mapa/mapa-wsi-leaflet";
import { pobierzDaneMapyWsi } from "@/lib/mapa/pobierz-dane-mapy-wsi";
import { POLE_SELECT_RYNEK_STRONA_WSI } from "@/lib/marketplace/pola-select-rynku";
import { wyodrebnijWarstwyMapyRynkuZOgloszen } from "@/lib/marketplace/wyodrebnij-warstwy-mapy-rynku";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

export type ProfilRynekWies = {
  id: string;
  business_name: string;
  short_description: string | null;
  categories: string[] | null;
  phone: string | null;
  is_verified: boolean;
  profile_kind?: string | null;
};

export type MetaRynekWies = {
  rynek_banner_text: string | null;
  rynek_banner_until: string | null;
  latitude: number | null;
  longitude: number | null;
  population: number | null;
  boundary_geojson: unknown;
};

export type DaneRynekStronaWsi = {
  ogloszeniaRaw: unknown[];
  profileRynek: ProfilRynekWies[];
  metaWies: MetaRynekWies | null;
  znacznikMapy: ZnacznikWsi | null;
  poisMapy: ZnacznikPoi[];
  punktyRynek: ReturnType<typeof wyodrebnijWarstwyMapyRynkuZOgloszen>["punktyRynek"];
  punktyRynekDzialki: ReturnType<typeof wyodrebnijWarstwyMapyRynkuZOgloszen>["punktyRynekDzialki"];
};

async function pobierzSuroweDaneRynekStronaWsi(
  villageId: string,
  wies: {
    id: string;
    name: string;
    slug: string;
    voivodeship: string;
    county: string;
    commune: string;
    latitude: number | null;
    longitude: number | null;
    population: number | null;
  },
): Promise<DaneRynekStronaWsi> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return {
      ogloszeniaRaw: [],
      profileRynek: [],
      metaWies: null,
      znacznikMapy: null,
      poisMapy: [],
      punktyRynek: [],
      punktyRynekDzialki: [],
    };
  }

  const sciezka = sciezkaProfiluWsi(wies);
  const wiesPoId = new Map([[wies.id, { name: wies.name, sciezka }]]);

  const [{ data: ogloszeniaRaw }, { data: profileRynek }, { data: metaWies }] = await Promise.all([
    supabase
      .from("marketplace_listings")
      .select(POLE_SELECT_RYNEK_STRONA_WSI)
      .eq("village_id", villageId)
      .eq("status", "approved")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(100),
    supabase
      .from("marketplace_profiles")
      .select("id, business_name, short_description, categories, phone, is_verified, profile_kind")
      .eq("village_id", villageId)
      .eq("is_active", true)
      .order("is_verified", { ascending: false })
      .order("business_name"),
    supabase
      .from("villages")
      .select("rynek_banner_text, rynek_banner_until, latitude, longitude, population, boundary_geojson")
      .eq("id", villageId)
      .maybeSingle(),
  ]);

  const wiersze = (ogloszeniaRaw ?? []) as Parameters<typeof wyodrebnijWarstwyMapyRynkuZOgloszen>[0];
  const { punktyRynek, punktyRynekDzialki } = wyodrebnijWarstwyMapyRynkuZOgloszen(wiersze, wiesPoId);

  const { znacznik: znacznikMapy, pois: poisMapy } = await pobierzDaneMapyWsi(supabase, {
    id: wies.id,
    name: wies.name,
    slug: wies.slug,
    voivodeship: wies.voivodeship,
    county: wies.county,
    commune: wies.commune,
    latitude: metaWies?.latitude ?? wies.latitude,
    longitude: metaWies?.longitude ?? wies.longitude,
    population: wies.population,
    boundary_geojson: metaWies?.boundary_geojson,
  });

  return {
    ogloszeniaRaw: ogloszeniaRaw ?? [],
    profileRynek: (profileRynek ?? []) as ProfilRynekWies[],
    metaWies: metaWies
      ? {
          rynek_banner_text: metaWies.rynek_banner_text,
          rynek_banner_until: metaWies.rynek_banner_until,
          latitude: metaWies.latitude != null ? Number(metaWies.latitude) : null,
          longitude: metaWies.longitude != null ? Number(metaWies.longitude) : null,
          population: metaWies.population,
          boundary_geojson: metaWies.boundary_geojson,
        }
      : null,
    znacznikMapy,
    poisMapy,
    punktyRynek,
    punktyRynekDzialki,
  };
}

/** Cache 120 s — jedno zapytanie ogłoszeń zamiast trzech + POI (TTFB strony /rynek). */
export function pobierzRynekStronaWsiCached(
  villageId: string,
  wies: {
    id: string;
    name: string;
    slug: string;
    voivodeship: string;
    county: string;
    commune: string;
    latitude: number | null;
    longitude: number | null;
    population: number | null;
  },
) {
  return unstable_cache(
    () => pobierzSuroweDaneRynekStronaWsi(villageId, wies),
    ["rynek-strona-wsi", villageId],
    { revalidate: 120, tags: [`rynek-wsi-${villageId}`, `profil-wsi-${villageId}`] },
  )();
}

export async function pobierzSubskrypcjeKategoriiRynku(
  supabase: SupabaseClient,
  userId: string,
  villageId: string,
): Promise<(string | null)[]> {
  const { data: subs } = await supabase
    .from("marketplace_category_subscriptions")
    .select("equipment_category")
    .eq("user_id", userId)
    .eq("village_id", villageId);
  return (subs ?? []).map((s) => s.equipment_category ?? null);
}
