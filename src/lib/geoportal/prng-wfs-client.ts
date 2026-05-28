import {
  centroidFromGeometry,
  featureExternalId,
  propStr,
  type GeoJsonFeatureCollection,
} from "@/lib/geoportal/geojson-utils";
import { normalizujWfsTypeName, pobierzWfsFeatureCollection } from "@/lib/geoportal/wfs-get-feature";

export type PrngFeature = {
  sourceExternalId: string;
  featureName: string | null;
  featureCategory: string | null;
  latitude: number | null;
  longitude: number | null;
  geometry: unknown;
  rawPayload: Record<string, unknown> | null;
};

export type PrngFetchResult =
  | {
      ok: true;
      features: PrngFeature[];
      sourceName: string;
      sourceTypeName: string;
      featureCount: number;
    }
  | {
      ok: false;
      reason: string;
      retryable: boolean;
    };

const DEFAULT_PRNG_WFS_URL = "https://mapy.geoportal.gov.pl/wss/service/PZGIK/PRNG/WFS/GeographicalNames";
const DEFAULT_PRNG_TYPENAMES =
  "O1_UrzedoweNazwyObiektowFizjograficznych,O2_ZestandaryzowaneNazwyObiektowFizjograficznych,O3_PozostaleNazwyObiektowFizjograficznych";

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v && v.length > 0 ? v : null;
}

function makeBbox(lat: number, lon: number, radiusM: number): string {
  const dLat = radiusM / 111_320;
  const dLon = radiusM / (111_320 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
  return `${lon - dLon},${lat - dLat},${lon + dLon},${lat + dLat},EPSG:4326`;
}

function featureZWarstwy(
  fc: GeoJsonFeatureCollection,
  typeName: string,
  customNameField: string | null,
  customCategoryField: string | null,
): PrngFeature[] {
  const features: PrngFeature[] = [];
  for (const f of fc.features) {
    const extId = featureExternalId(f);
    const c = centroidFromGeometry(f.geometry);
    const name = customNameField
      ? propStr(f.properties, [customNameField])
      : propStr(f.properties, ["name", "NAZWA", "PRNG_NAZWA", "nazwa", "NAZWAGLOWNA"]);
    const category = customCategoryField
      ? propStr(f.properties, [customCategoryField])
      : propStr(f.properties, ["rodzaj", "RODZAJ", "typ", "TYP", "category", "KATEGORIA", "KATEGORIAOBIEKTU"]);
    features.push({
      sourceExternalId: extId ?? `${typeName}:${features.length}`,
      featureName: name,
      featureCategory: category,
      latitude: c?.lat ?? null,
      longitude: c?.lon ?? null,
      geometry: f.geometry,
      rawPayload: f.properties ?? null,
    });
  }
  return features;
}

export async function pobierzPrngWokolWsi(lat: number, lon: number, radiusM: number): Promise<PrngFetchResult> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { ok: false, reason: "Nieprawidłowe współrzędne wejściowe.", retryable: false };
  }

  const wfsUrl = env("GEOPORTAL_PRNG_WFS_URL") ?? DEFAULT_PRNG_WFS_URL;
  const wfsVersion = env("GEOPORTAL_PRNG_WFS_VERSION") ?? "1.1.0";
  const typenamesRaw = env("GEOPORTAL_PRNG_WFS_TYPENAME") ?? env("GEOPORTAL_PRNG_WFS_TYPENAMES") ?? DEFAULT_PRNG_TYPENAMES;
  const typeNames = typenamesRaw
    .split(",")
    .map((s) => normalizujWfsTypeName(s))
    .filter(Boolean)
    .slice(0, 5);

  const customNameField = env("GEOPORTAL_PRNG_NAME_FIELD");
  const customCategoryField = env("GEOPORTAL_PRNG_CATEGORY_FIELD");
  const bbox = makeBbox(lat, lon, Math.max(1000, Math.min(25_000, radiusM)));

  const merged: PrngFeature[] = [];
  const bledy: string[] = [];
  let sourceType = "";

  for (const typeName of typeNames) {
    const wfs = await pobierzWfsFeatureCollection({
      wfsUrl,
      wfsVersion,
      typeName,
      bbox,
      maxFeatures: 200,
      timeoutMs: 40_000,
    });
    if (!wfs.ok) {
      bledy.push(`${typeName}: ${wfs.reason}`);
      continue;
    }
    sourceType = sourceType ? `${sourceType},${typeName}` : typeName;
    merged.push(
      ...featureZWarstwy(wfs.collection as GeoJsonFeatureCollection, typeName, customNameField, customCategoryField),
    );
  }

  if (merged.length === 0 && bledy.length > 0) {
    return {
      ok: false,
      reason: `PRNG WFS: ${bledy.slice(0, 2).join("; ")}`,
      retryable: bledy.some((b) => b.includes("HTTP 5")),
    };
  }

  return {
    ok: true,
    features: merged,
    sourceName: wfsUrl,
    sourceTypeName: sourceType || typeNames.join(","),
    featureCount: merged.length,
  };
}
