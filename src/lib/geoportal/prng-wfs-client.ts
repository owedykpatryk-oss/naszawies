import {
  centroidFromGeometry,
  featureExternalId,
  propStr,
  type GeoJsonFeatureCollection,
} from "@/lib/geoportal/geojson-utils";

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

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v && v.length > 0 ? v : null;
}

function makeBbox(lat: number, lon: number, radiusM: number): string {
  const dLat = radiusM / 111_320;
  const dLon = radiusM / (111_320 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
  return `${lon - dLon},${lat - dLat},${lon + dLon},${lat + dLat},EPSG:4326`;
}

export async function pobierzPrngWokolWsi(lat: number, lon: number, radiusM: number): Promise<PrngFetchResult> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { ok: false, reason: "Nieprawidłowe współrzędne wejściowe.", retryable: false };
  }

  const wfsUrl = env("GEOPORTAL_PRNG_WFS_URL") ?? DEFAULT_PRNG_WFS_URL;
  const wfsVersion = env("GEOPORTAL_PRNG_WFS_VERSION") ?? "1.1.0";
  const typeName = env("GEOPORTAL_PRNG_WFS_TYPENAME");
  if (!typeName) {
    return { ok: false, reason: "Brak GEOPORTAL_PRNG_WFS_TYPENAME.", retryable: false };
  }

  const params = new URLSearchParams({
    SERVICE: "WFS",
    VERSION: wfsVersion,
    REQUEST: "GetFeature",
    SRSNAME: "EPSG:4326",
    outputFormat: "application/json",
    BBOX: makeBbox(lat, lon, Math.max(1000, Math.min(25_000, radiusM))),
  });
  if (wfsVersion.startsWith("1.")) {
    params.set("TYPENAME", typeName);
    params.set("MAXFEATURES", "300");
  } else {
    params.set("TYPENAMES", typeName);
    params.set("COUNT", "300");
  }

  let res: Response;
  try {
    res = await fetch(`${wfsUrl}?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(40_000),
      headers: {
        Accept: "application/json, application/geo+json, text/xml",
        "User-Agent": "NaszawiesPl/1.0 (+https://naszawies.pl/)",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, reason: `Błąd połączenia z PRNG WFS: ${msg}`, retryable: true };
  }

  if (!res.ok) {
    return {
      ok: false,
      reason: `PRNG WFS zwrócił HTTP ${res.status}.`,
      retryable: res.status >= 500 || res.status === 429,
    };
  }

  let json: unknown;
  try {
    json = (await res.json()) as unknown;
  } catch {
    return { ok: false, reason: "PRNG WFS nie zwrócił JSON.", retryable: false };
  }

  const fc = json as GeoJsonFeatureCollection;
  if (fc?.type !== "FeatureCollection" || !Array.isArray(fc.features)) {
    return { ok: false, reason: "Nieoczekiwany format odpowiedzi PRNG WFS.", retryable: false };
  }

  const customNameField = env("GEOPORTAL_PRNG_NAME_FIELD");
  const customCategoryField = env("GEOPORTAL_PRNG_CATEGORY_FIELD");
  const features: PrngFeature[] = [];
  for (const f of fc.features) {
    const extId = featureExternalId(f);
    const c = centroidFromGeometry(f.geometry);
    const name = customNameField
      ? propStr(f.properties, [customNameField])
      : propStr(f.properties, ["name", "NAZWA", "PRNG_NAZWA", "nazwa"]);
    const category = customCategoryField
      ? propStr(f.properties, [customCategoryField])
      : propStr(f.properties, ["rodzaj", "RODZAJ", "typ", "TYP", "category", "KATEGORIA"]);
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

  return {
    ok: true,
    features,
    sourceName: wfsUrl,
    sourceTypeName: typeName,
    featureCount: fc.features.length,
  };
}
