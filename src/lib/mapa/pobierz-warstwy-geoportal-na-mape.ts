import type { ZnacznikAdres, ZnacznikGeoKontekst } from "@/components/mapa/mapa-wsi-leaflet";
import { mapujGeoKontekstDlaMapy } from "@/lib/mapa/mapuj-geo-kontekst-dla-mapy";
import { podzielNaPartie } from "@/lib/mapa/podziel-na-partie";
import type { SupabaseClient } from "@supabase/supabase-js";

type WierszAdres = {
  id: string;
  village_id: string;
  street_name: string | null;
  house_number: string;
  latitude: number | string;
  longitude: number | string;
};

export type WarstwyGeoportalNaMape = {
  punktyGeoKontekst: ZnacznikGeoKontekst[];
  punktyAdresy: ZnacznikAdres[];
};

/** PRNG + instytucje PRG + adresy KIN zsynchronizowane z Geoportalu — pod warstwy mapy. */
export async function pobierzWarstwyGeoportalNaMape(
  supabase: SupabaseClient,
  wiesPoId: Map<string, { name: string; sciezka: string }>,
): Promise<WarstwyGeoportalNaMape> {
  const puste: WarstwyGeoportalNaMape = { punktyGeoKontekst: [], punktyAdresy: [] };
  const ids = Array.from(wiesPoId.keys());
  if (ids.length === 0) return puste;

  const geoRows: Parameters<typeof mapujGeoKontekstDlaMapy>[0] = [];
  const adresRows: WierszAdres[] = [];

  for (const partia of podzielNaPartie(ids, 80)) {
    const [{ data: geoPart }, { data: adresPart }] = await Promise.all([
      supabase
        .from("geo_context_features")
        .select("id, village_id, dataset, layer_name, feature_category, feature_name, latitude, longitude")
        .in("village_id", partia)
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .limit(400),
      supabase
        .from("address_points")
        .select("id, village_id, street_name, house_number, latitude, longitude")
        .in("village_id", partia)
        .limit(800),
    ]);
    if (geoPart) geoRows.push(...geoPart);
    if (adresPart) adresRows.push(...(adresPart as WierszAdres[]));
  }

  const punktyGeoKontekst = mapujGeoKontekstDlaMapy(geoRows, wiesPoId, 800);

  const punktyAdresy: ZnacznikAdres[] = [];
  for (const r of adresRows) {
    const w = wiesPoId.get(r.village_id);
    if (!w) continue;
    const lat = Number(r.latitude);
    const lon = Number(r.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    punktyAdresy.push({
      id: r.id,
      villageId: r.village_id,
      villageName: w.name,
      streetName: r.street_name,
      houseNumber: r.house_number,
      lat,
      lon,
    });
    if (punktyAdresy.length >= 2000) break;
  }

  return { punktyGeoKontekst, punktyAdresy };
}
