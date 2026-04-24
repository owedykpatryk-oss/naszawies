import type { SupabaseClient } from "@supabase/supabase-js";
import slugify from "slugify";

function slugCzesciUrl(tekst: string): string {
  return slugify(decodeURIComponent(tekst), { lower: true, strict: true, locale: "pl" });
}

function slugCzesciZBazy(tekst: string): string {
  return slugify(tekst, { lower: true, strict: true, locale: "pl" });
}

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
  description: string | null;
  website: string | null;
  is_active: boolean;
  cover_image_url: string | null;
};

/**
 * Dopasowuje wieś do czterech segmentów URL (jak w /api/wies/szukaj — slugify nazw administracyjnych + slug wsi).
 */
export async function znajdzWiesPoSciezce(
  supabase: SupabaseClient,
  wojSeg: string,
  powSeg: string,
  gminaSeg: string,
  slugWioski: string
): Promise<WiesPubliczna | null> {
  const slug = decodeURIComponent(slugWioski);
  const w = slugCzesciUrl(wojSeg);
  const p = slugCzesciUrl(powSeg);
  const g = slugCzesciUrl(gminaSeg);

  const { data, error } = await supabase
    .from("villages")
    .select(
      "id, teryt_id, name, slug, voivodeship, county, commune, commune_type, latitude, longitude, population, description, website, is_active, cover_image_url"
    )
    .eq("slug", slug);

  if (error || !data?.length) {
    return null;
  }

  const hit = data.find(
    (v) =>
      slugCzesciZBazy(v.voivodeship) === w &&
      slugCzesciZBazy(v.county) === p &&
      slugCzesciZBazy(v.commune) === g
  );

  return (hit as WiesPubliczna) ?? null;
}
