import {
  centroidFromGeometry,
  featureExternalId,
  propStr,
  type GeoJsonFeatureCollection,
} from "@/lib/geoportal/geojson-utils";

export type InstitutionalFeature = {
  layerName: string;
  sourceExternalId: string;
  featureName: string | null;
  featureCategory: string | null;
  latitude: number | null;
  longitude: number | null;
  geometry: unknown;
  rawPayload: Record<string, unknown> | null;
};

export type InstitutionalFetchResult =
  | {
      ok: true;
      features: InstitutionalFeature[];
      sourceName: string;
      sourceTypeName: string;
      featureCount: number;
    }
  | {
      ok: false;
      reason: string;
      retryable: boolean;
    };

const DEFAULT_PRG_WFS_URL = "https://mapy.geoportal.gov.pl/wss/service/PZGIK/PRG/WFS/AdministrativeBoundaries";

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v && v.length > 0 ? v : null;
}

function makeBbox(lat: number, lon: number, radiusM: number): string {
  const dLat = radiusM / 111_320;
  const dLon = radiusM / (111_320 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
  return `${lon - dLon},${lat - dLat},${lon + dLon},${lat + dLat},EPSG:4326`;
}

async function fetchLayer(
  wfsUrl: string,
  wfsVersion: string,
  typeName: string,
  bbox: string,
): Promise<InstitutionalFetchResult> {
  const params = new URLSearchParams({
    SERVICE: "WFS",
    VERSION: wfsVersion,
    REQUEST: "GetFeature",
    SRSNAME: "EPSG:4326",
    outputFormat: "application/json",
    BBOX: bbox,
  });
  if (wfsVersion.startsWith("1.")) {
    params.set("TYPENAME", typeName);
    params.set("MAXFEATURES", "150");
  } else {
    params.set("TYPENAMES", typeName);
    params.set("COUNT", "150");
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
    return { ok: false, reason: `Błąd połączenia PRG WFS (${typeName}): ${msg}`, retryable: true };
  }

  if (!res.ok) {
    return {
      ok: false,
      reason: `PRG WFS (${typeName}) zwrócił HTTP ${res.status}.`,
      retryable: res.status >= 500 || res.status === 429,
    };
  }

  let json: unknown;
  try {
    json = (await res.json()) as unknown;
  } catch {
    return { ok: false, reason: `PRG WFS (${typeName}) nie zwrócił JSON.`, retryable: false };
  }

  const fc = json as GeoJsonFeatureCollection;
  if (fc?.type !== "FeatureCollection" || !Array.isArray(fc.features)) {
    return { ok: false, reason: `PRG WFS (${typeName}) zwrócił nieoczekiwany format.`, retryable: false };
  }

  const out: InstitutionalFeature[] = [];
  for (const f of fc.features) {
    const extId = featureExternalId(f);
    const c = centroidFromGeometry(f.geometry);
    const nm = propStr(f.properties, ["name", "NAZWA", "nazwa", "JPT_NAZWA_", "JPT_NAZWA1"]);
    out.push({
      layerName: typeName,
      sourceExternalId: extId ?? `${typeName}:${out.length}`,
      featureName: nm,
      featureCategory: null,
      latitude: c?.lat ?? null,
      longitude: c?.lon ?? null,
      geometry: f.geometry,
      rawPayload: f.properties ?? null,
    });
  }

  return {
    ok: true,
    features: out,
    sourceName: wfsUrl,
    sourceTypeName: typeName,
    featureCount: fc.features.length,
  };
}

export async function pobierzWarstwyInstytucjonalnePrgWokolWsi(
  lat: number,
  lon: number,
  radiusM: number,
): Promise<InstitutionalFetchResult> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { ok: false, reason: "Nieprawidłowe współrzędne wejściowe.", retryable: false };
  }
  const typenamesRaw = env("GEOPORTAL_PRG_INSTITUTIONAL_TYPENAMES");
  if (!typenamesRaw) {
    return { ok: false, reason: "Brak GEOPORTAL_PRG_INSTITUTIONAL_TYPENAMES.", retryable: false };
  }
  const typeNames = typenamesRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
  if (typeNames.length === 0) {
    return { ok: false, reason: "Pusta lista warstw GEOPORTAL_PRG_INSTITUTIONAL_TYPENAMES.", retryable: false };
  }

  const wfsUrl = env("GEOPORTAL_PRG_INSTITUTIONAL_WFS_URL") ?? DEFAULT_PRG_WFS_URL;
  const wfsVersion = env("GEOPORTAL_PRG_INSTITUTIONAL_WFS_VERSION") ?? "1.1.0";
  const bbox = makeBbox(lat, lon, Math.max(2000, Math.min(35_000, radiusM)));

  const merged: InstitutionalFeature[] = [];
  let sourceType = "";
  let count = 0;
  for (const tn of typeNames) {
    const one = await fetchLayer(wfsUrl, wfsVersion, tn, bbox);
    if (!one.ok) return one;
    sourceType = sourceType ? `${sourceType},${tn}` : tn;
    count += one.featureCount;
    merged.push(...one.features);
  }
  return {
    ok: true,
    features: merged,
    sourceName: wfsUrl,
    sourceTypeName: sourceType,
    featureCount: count,
  };
}
