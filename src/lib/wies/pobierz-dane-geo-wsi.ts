import type { SupabaseClient } from "@supabase/supabase-js";

export type DaneGeoWsi = {
  geoKontekst: {
    id: string;
    dataset: string;
    layer_name: string;
    feature_category: string | null;
    feature_name: string | null;
    latitude: number | null;
    longitude: number | null;
    updated_at: string;
  }[];
  adresyUrzedowe: {
    id: string;
    street_name: string | null;
    house_number: string;
    postal_code: string | null;
    latitude: number;
    longitude: number;
    updated_at: string;
  }[];
  geoJakosc: {
    maGraniceGeojson: boolean;
    liczbaAdresow: number;
    liczbaPrng: number;
    liczbaInstytucji: number;
  };
};

export async function pobierzDaneGeoWsi(
  supabase: SupabaseClient,
  villageId: string,
): Promise<DaneGeoWsi> {
  const [{ data: geoKontekstRaw }, { data: adresyRaw }, { data: granicaRaw }] = await Promise.all([
    supabase
      .from("geo_context_features")
      .select("id, dataset, layer_name, feature_category, feature_name, latitude, longitude, updated_at")
      .eq("village_id", villageId)
      .order("updated_at", { ascending: false })
      .limit(80),
    supabase
      .from("address_points")
      .select("id, street_name, house_number, postal_code, latitude, longitude, updated_at")
      .eq("village_id", villageId)
      .order("street_name", { ascending: true })
      .order("house_number", { ascending: true })
      .limit(80),
    supabase.from("villages").select("boundary_geojson").eq("id", villageId).maybeSingle(),
  ]);

  const geoKontekst = (geoKontekstRaw ?? []) as DaneGeoWsi["geoKontekst"];
  const adresyUrzedowe = (adresyRaw ?? []) as DaneGeoWsi["adresyUrzedowe"];
  const maGraniceGeojson = Boolean((granicaRaw as { boundary_geojson?: unknown } | null)?.boundary_geojson);

  return {
    geoKontekst,
    adresyUrzedowe,
    geoJakosc: {
      maGraniceGeojson,
      liczbaAdresow: adresyUrzedowe.length,
      liczbaPrng: geoKontekst.filter((x) => x.dataset === "PRNG").length,
      liczbaInstytucji: geoKontekst.filter((x) => x.dataset === "PRG_INSTITUTIONAL").length,
    },
  };
}
