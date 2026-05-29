import type { ZnacznikPoi, ZnacznikWsi } from "@/components/mapa/mapa-wsi-leaflet";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import type { SupabaseClient } from "@supabase/supabase-js";
import { mapujPoiDlaMapy, POLE_SELECT_POI_MAPY, type WierszPoiMapy } from "./mapuj-poi-dla-mapy";

type WiesDoMapy = {
  id: string;
  name: string;
  slug: string;
  voivodeship: string;
  county: string;
  commune: string;
  latitude: number | string | null;
  longitude: number | string | null;
  population: number | null;
  boundary_geojson?: unknown | null;
};

export async function pobierzDaneMapyWsi(
  supabase: SupabaseClient,
  wies: WiesDoMapy,
): Promise<{ znacznik: ZnacznikWsi | null; pois: ZnacznikPoi[] }> {
  const sciezka = sciezkaProfiluWsi(wies);
  const lat = wies.latitude != null ? Number(wies.latitude) : NaN;
  const lon = wies.longitude != null ? Number(wies.longitude) : NaN;

  let znacznik: ZnacznikWsi | null = null;
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    znacznik = {
      id: wies.id,
      name: wies.name,
      sciezka,
      lat,
      lon,
      population: wies.population,
      boundary_geojson: wies.boundary_geojson ?? null,
      public_offers_count: 0,
      commune: wies.commune,
      county: wies.county,
      voivodeship: wies.voivodeship,
    };
  }

  const meta = new Map([[wies.id, { name: wies.name, sciezka }]]);
  const { data } = await supabase.from("pois").select(POLE_SELECT_POI_MAPY).eq("village_id", wies.id);
  const pois = mapujPoiDlaMapy((data ?? []) as WierszPoiMapy[], meta);
  return { znacznik, pois };
}
