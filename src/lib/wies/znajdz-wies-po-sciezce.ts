import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import { slugCzesciAdministracyjnej } from "@/lib/wies/slug-administracyjny";

export type WiesPubliczna = {
  id: string;
  teryt_id: string;
  name: string;
  slug: string;
  voivodeship: string;
  county: string;
  commune: string;
  commune_type: string;
  latitude: number | null;
  longitude: number | null;
  population: number | null;
  gmina_population?: number | null;
  gmina_population_rok?: number | null;
  gmina_population_zrodlo?: string | null;
  description: string | null;
  website: string | null;
  is_active: boolean;
  cover_image_url: string | null;
  updated_at: string | null;
  boundary_geojson?: unknown | null;
};

const POLE_WIES =
  "id, teryt_id, name, slug, voivodeship, county, commune, commune_type, latitude, longitude, population, gmina_population, gmina_population_rok, gmina_population_zrodlo, description, website, is_active, cover_image_url, updated_at, boundary_geojson";

async function lookupWiesPoSciezce(
  supabase: SupabaseClient,
  wojSeg: string,
  powSeg: string,
  gminaSeg: string,
  slugWioski: string,
): Promise<WiesPubliczna | null> {
  const slug = decodeURIComponent(slugWioski);
  const w = slugCzesciAdministracyjnej(wojSeg);
  const p = slugCzesciAdministracyjnej(powSeg);
  const g = slugCzesciAdministracyjnej(gminaSeg);

  const { data, error } = await supabase
    .from("villages")
    .select(POLE_WIES)
    .eq("voivodeship_slug", w)
    .eq("county_slug", p)
    .eq("commune_slug", g)
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as WiesPubliczna;
}

const znajdzWiesPoSciezceCached = unstable_cache(
  async (wojSeg: string, powSeg: string, gminaSeg: string, slugWioski: string) => {
    const supabase = createPublicSupabaseClient();
    if (!supabase) return null;
    return lookupWiesPoSciezce(supabase, wojSeg, powSeg, gminaSeg, slugWioski);
  },
  ["znajdz-wies-po-sciezce"],
  { revalidate: 300 },
);

/**
 * Dopasowuje wieś do czterech segmentów URL (slugi administracyjne + slug wsi).
 * Wynik cache'owany 5 min (metadata + strona wołają tę samą funkcję wielokrotnie).
 */
export async function znajdzWiesPoSciezce(
  _supabase: SupabaseClient | null,
  wojSeg: string,
  powSeg: string,
  gminaSeg: string,
  slugWioski: string,
): Promise<WiesPubliczna | null> {
  return znajdzWiesPoSciezceCached(wojSeg, powSeg, gminaSeg, slugWioski);
}
