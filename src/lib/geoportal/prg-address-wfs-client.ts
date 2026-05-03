export type PrgAddressPoint = {
  sourceExternalId: string;
  latitude: number;
  longitude: number;
  houseNumber: string;
  streetName: string | null;
  postalCode: string | null;
  terytSimc: string | null;
  terytUlic: string | null;
  rawPayload: Record<string, unknown> | null;
  locationGeom: unknown;
};

export type PrgAddressFetchResult =
  | {
      ok: true;
      points: PrgAddressPoint[];
      sourceName: string;
      sourceTypeName: string;
      featureCount: number;
    }
  | {
      ok: false;
      reason: string;
      retryable: boolean;
    };

type GeoJsonGeometry = {
  type: string;
  coordinates?: unknown;
};

type GeoJsonFeature = {
  type: "Feature";
  id?: string | number;
  geometry: GeoJsonGeometry | null;
  properties?: Record<string, unknown>;
};

type GeoJsonFeatureCollection = {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
};

const DEFAULT_WFS_URL = "https://mapy.geoportal.gov.pl/wss/ext/KrajowaIntegracjaNumeracjiAdresowej";

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v && v.length > 0 ? v : null;
}

function propStr(props: Record<string, unknown> | undefined, names: string[]): string | null {
  if (!props) return null;
  for (const n of names) {
    const v = props[n];
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  const keys = Object.keys(props);
  for (const n of names) {
    const hit = keys.find((k) => k.toLowerCase() === n.toLowerCase());
    if (!hit) continue;
    const v = props[hit];
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return null;
}

function escapeCqlLiteral(v: string): string {
  return v.replace(/'/g, "''");
}

function makeBbox(lat: number, lon: number, radiusM: number): string {
  // Szybkie przybliżenie: 1 deg lat ~= 111.32km
  const dLat = radiusM / 111_320;
  const dLon = radiusM / (111_320 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
  const minLon = lon - dLon;
  const minLat = lat - dLat;
  const maxLon = lon + dLon;
  const maxLat = lat + dLat;
  return `${minLon},${minLat},${maxLon},${maxLat},EPSG:4326`;
}

function pointFromGeometry(geometry: GeoJsonGeometry | null): { lat: number; lon: number } | null {
  if (!geometry?.type) return null;
  if (geometry.type === "Point" && Array.isArray(geometry.coordinates) && geometry.coordinates.length >= 2) {
    const lon = Number(geometry.coordinates[0]);
    const lat = Number(geometry.coordinates[1]);
    if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon };
  }
  if (
    geometry.type === "MultiPoint" &&
    Array.isArray(geometry.coordinates) &&
    geometry.coordinates.length > 0 &&
    Array.isArray(geometry.coordinates[0]) &&
    geometry.coordinates[0].length >= 2
  ) {
    const lon = Number(geometry.coordinates[0][0]);
    const lat = Number(geometry.coordinates[0][1]);
    if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon };
  }
  return null;
}

function pointFromFeature(f: GeoJsonFeature): PrgAddressPoint | null {
  const xy = pointFromGeometry(f.geometry);
  if (!xy) return null;
  const props = f.properties ?? {};
  const houseNumber = propStr(props, ["house_number", "numer_porzadkowy", "numer", "nr", "NUMER", "NR", "NUMERPORZ"]);
  if (!houseNumber) return null;

  const streetName = propStr(props, [
    "street_name",
    "ulica",
    "nazwa_ulicy",
    "nazwaulicy",
    "ULICA",
    "NAZWA_ULICY",
    "NAZWAULICY",
  ]);
  const postalCode = propStr(props, ["postal_code", "kod_pocztowy", "kod", "KOD_POCZTOWY", "KOD"]);
  const terytSimc = propStr(props, ["simc", "teryt_simc", "SIMC", "TERYT_SIMC"]);
  const terytUlic = propStr(props, ["ulic", "teryt_ulic", "ULIC", "TERYT_ULIC"]);
  const extId =
    (typeof f.id === "string" || typeof f.id === "number" ? String(f.id) : null) ??
    propStr(props, ["iip_identy", "IIP_IDENTY", "id", "ID"]);
  const sourceExternalId =
    extId ??
    `${xy.lat.toFixed(7)}|${xy.lon.toFixed(7)}|${houseNumber.toLowerCase()}|${(streetName ?? "").toLowerCase()}`;

  return {
    sourceExternalId,
    latitude: xy.lat,
    longitude: xy.lon,
    houseNumber,
    streetName,
    postalCode,
    terytSimc,
    terytUlic,
    rawPayload: props,
    locationGeom: f.geometry,
  };
}

export async function pobierzAdresyWsiZPrgWfs(
  villageTeryt: string,
  lat: number,
  lon: number,
  radiusM: number,
): Promise<PrgAddressFetchResult> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { ok: false, reason: "Nieprawidłowe współrzędne wsi.", retryable: false };
  }
  const cleanTeryt = villageTeryt.trim();
  if (!cleanTeryt) {
    return { ok: false, reason: "Brak kodu TERYT wsi.", retryable: false };
  }

  const wfsUrl = env("GEOPORTAL_PRG_ADDRESS_WFS_URL") ?? DEFAULT_WFS_URL;
  const wfsVersion = env("GEOPORTAL_PRG_ADDRESS_WFS_VERSION") ?? "1.1.0";
  const typeName = env("GEOPORTAL_PRG_ADDRESS_WFS_TYPENAME");
  if (!typeName) {
    return { ok: false, reason: "Brak GEOPORTAL_PRG_ADDRESS_WFS_TYPENAME.", retryable: false };
  }

  const params = new URLSearchParams({
    SERVICE: "WFS",
    VERSION: wfsVersion,
    REQUEST: "GetFeature",
    SRSNAME: "EPSG:4326",
    outputFormat: "application/json",
    BBOX: makeBbox(lat, lon, Math.max(400, Math.min(8000, radiusM))),
  });
  if (wfsVersion.startsWith("1.")) {
    params.set("TYPENAME", typeName);
    params.set("MAXFEATURES", "1500");
  } else {
    params.set("TYPENAMES", typeName);
    params.set("COUNT", "1500");
  }

  const simcField = env("GEOPORTAL_PRG_ADDRESS_SIMC_FIELD");
  if (simcField) {
    params.set("CQL_FILTER", `${simcField}='${escapeCqlLiteral(cleanTeryt)}'`);
  }

  let res: Response;
  try {
    res = await fetch(`${wfsUrl}?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(45_000),
      headers: {
        Accept: "application/json, application/geo+json, text/xml",
        "User-Agent": "NaszawiesPl/1.0 (+https://naszawies.pl/)",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, reason: `Błąd połączenia z KIN/PRG WFS: ${msg}`, retryable: true };
  }

  if (!res.ok) {
    return {
      ok: false,
      reason: `KIN/PRG WFS zwrócił HTTP ${res.status}.`,
      retryable: res.status >= 500 || res.status === 429,
    };
  }

  let json: unknown;
  try {
    json = (await res.json()) as unknown;
  } catch {
    return { ok: false, reason: "KIN/PRG WFS nie zwrócił JSON.", retryable: false };
  }

  const fc = json as GeoJsonFeatureCollection;
  if (fc?.type !== "FeatureCollection" || !Array.isArray(fc.features)) {
    return { ok: false, reason: "Nieoczekiwany format odpowiedzi KIN/PRG WFS.", retryable: false };
  }

  const points = fc.features.map(pointFromFeature).filter(Boolean) as PrgAddressPoint[];
  return {
    ok: true,
    points,
    sourceName: wfsUrl,
    sourceTypeName: typeName,
    featureCount: fc.features.length,
  };
}
