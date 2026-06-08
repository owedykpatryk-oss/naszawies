import type { SupabaseClient } from "@supabase/supabase-js";
import { mapujGeoKontekstNaPoi } from "@/lib/mapa/mapuj-geoportal-na-poi";

type VillageRow = {
  id: string;
  name: string;
};

type GeoRow = {
  village_id: string;
  dataset: string;
  layer_name: string;
  feature_category: string | null;
  feature_name: string | null;
  source_external_id: string;
  latitude: number | string | null;
  longitude: number | string | null;
};

type PoiRow = {
  village_id: string;
  category: string;
  latitude: number | string;
  longitude: number | string;
  source: string | null;
  is_local_override: boolean | null;
};

export type GeoportalPoiSyncSummary = {
  scannedVillages: number;
  processedVillages: number;
  added: number;
  skippedNoFeatures: number;
  errors: string[];
};

function parseIntEnv(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name]?.trim();
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function czyWlaczone(): boolean {
  const raw = process.env.GEOPORTAL_POI_SYNC_ENABLED?.trim();
  if (raw === "0" || raw?.toLowerCase() === "false") return false;
  return true;
}

function odlegloscMetry(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function synchronizujPoiZGeoportalAutomatycznie(
  supabase: SupabaseClient,
  opts?: { tylkoVillageIds?: string[] },
): Promise<GeoportalPoiSyncSummary> {
  const summary: GeoportalPoiSyncSummary = {
    scannedVillages: 0,
    processedVillages: 0,
    added: 0,
    skippedNoFeatures: 0,
    errors: [],
  };

  if (!czyWlaczone()) return summary;

  const maxVillages = opts?.tylkoVillageIds?.length
    ? opts.tylkoVillageIds.length
    : parseIntEnv("GEOPORTAL_POI_SYNC_VILLAGES_PER_RUN", 4, 1, 30);
  const maxGeoPerVillage = parseIntEnv("GEOPORTAL_POI_SYNC_FEATURES_PER_VILLAGE", 60, 5, 250);
  const promienDuplikatuM = parseIntEnv("GEOPORTAL_POI_SYNC_DEDUP_METERS", 450, 80, 2000);

  let zapytanieWsi = supabase.from("villages").select("id, name").eq("is_active", true);
  if (opts?.tylkoVillageIds?.length) {
    zapytanieWsi = zapytanieWsi.in("id", opts.tylkoVillageIds);
  } else {
    zapytanieWsi = zapytanieWsi.order("updated_at", { ascending: true }).limit(maxVillages);
  }

  const { data: wsie, error: errWsie } = await zapytanieWsi;
  if (errWsie) throw new Error(`POI Geoportal: lista wsi: ${errWsie.message}`);

  const villages = (wsie ?? []) as VillageRow[];
  summary.scannedVillages = villages.length;
  if (villages.length === 0) return summary;

  const ids = villages.map((v) => v.id);

  const { data: geoRows, error: errGeo } = await supabase
    .from("geo_context_features")
    .select(
      "village_id, dataset, layer_name, feature_category, feature_name, source_external_id, latitude, longitude",
    )
    .in("village_id", ids)
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .limit(maxVillages * maxGeoPerVillage);
  if (errGeo) throw new Error(`POI Geoportal: geo_context: ${errGeo.message}`);

  const geoByVillage = new Map<string, GeoRow[]>();
  for (const g of (geoRows ?? []) as GeoRow[]) {
    const arr = geoByVillage.get(g.village_id) ?? [];
    arr.push(g);
    geoByVillage.set(g.village_id, arr);
  }

  const { data: pois, error: errPois } = await supabase
    .from("pois")
    .select("village_id, category, latitude, longitude, source, is_local_override")
    .in("village_id", ids);
  if (errPois) throw new Error(`POI Geoportal: pois: ${errPois.message}`);

  const poisByVillage = new Map<string, PoiRow[]>();
  for (const id of ids) poisByVillage.set(id, []);
  for (const p of (pois ?? []) as PoiRow[]) {
    const arr = poisByVillage.get(p.village_id);
    if (arr) arr.push(p);
  }

  for (const village of villages) {
    const geo = geoByVillage.get(village.id) ?? [];
    if (geo.length === 0) {
      summary.skippedNoFeatures += 1;
      continue;
    }

    const existing = poisByVillage.get(village.id) ?? [];
    const doWstawienia: {
      category: string;
      name: string;
      lat: number;
      lon: number;
      sourceExternalId: string;
      ospWaterSourceType?: "hydrant" | "staw" | "zbiornik" | "rzeka" | "inne";
    }[] = [];

    for (const g of geo) {
      const lat = Number(g.latitude);
      const lon = Number(g.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

      const kandydat = mapujGeoKontekstNaPoi({
        dataset: g.dataset,
        layerName: g.layer_name,
        featureName: g.feature_name,
        featureCategory: g.feature_category,
        sourceExternalId: g.source_external_id,
      });
      if (!kandydat) continue;

      const duplikat = existing.some((p) => {
        if (p.is_local_override) return false;
        const plat = Number(p.latitude);
        const plon = Number(p.longitude);
        if (!Number.isFinite(plat) || !Number.isFinite(plon)) return false;
        if (p.category !== kandydat.category) return false;
        return odlegloscMetry(lat, lon, plat, plon) < promienDuplikatuM;
      });
      const duplikatNowy = doWstawienia.some(
        (d) =>
          d.category === kandydat.category &&
          odlegloscMetry(lat, lon, d.lat, d.lon) < promienDuplikatuM,
      );
      if (duplikat || duplikatNowy) continue;

      doWstawienia.push({
        category: kandydat.category,
        name: kandydat.name,
        lat,
        lon,
        sourceExternalId: kandydat.sourceExternalId,
        ospWaterSourceType: kandydat.ospWaterSourceType,
      });
    }

    if (doWstawienia.length === 0) continue;

    const { error: insertErr } = await supabase.from("pois").insert(
      doWstawienia.map((p) => ({
        village_id: village.id,
        category: p.category,
        name: p.name,
        description: `AUTO_GEOPORTAL_SYNC (${p.sourceExternalId}). Dane z Państwowego Zasobu Geodezyjnego — zweryfikuj lokalnie.`,
        latitude: p.lat,
        longitude: p.lon,
        source: "geoportal",
        confidence: p.category === "osp_punkt_czerpania_wody" ? 0.62 : 0.72,
        verified_at: null,
        is_local_override: false,
        ...(p.category === "osp_punkt_czerpania_wody" && p.ospWaterSourceType
          ? { osp_water_source_type: p.ospWaterSourceType }
          : {}),
      })),
    );

    if (insertErr) {
      summary.errors.push(`${village.name}: ${insertErr.message}`);
      continue;
    }

    summary.processedVillages += 1;
    summary.added += doWstawienia.length;
  }

  return summary;
}
