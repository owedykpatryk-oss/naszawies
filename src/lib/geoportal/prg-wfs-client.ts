type GeoJsonGeometry = {
  type: string;
  coordinates?: unknown;
  geometries?: unknown;
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

export type PrgBoundaryFetchResult =
  | {
      ok: true;
      boundaryGeojson: unknown;
      sourceName: string;
      sourceTypeName: string;
      featureCount: number;
    }
  | {
      ok: false;
      reason: string;
      retryable: boolean;
    };

const DEFAULT_WFS_URL = "https://mapy.geoportal.gov.pl/wss/service/PZGIK/PRG/WFS/AdministrativeBoundaries";

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v && v.length > 0 ? v : null;
}

function escapeCqlLiteral(v: string): string {
  return v.replace(/'/g, "''");
}

function jestGranica(geometry: GeoJsonGeometry | null | undefined): boolean {
  if (!geometry?.type) return false;
  return geometry.type === "Polygon" || geometry.type === "MultiPolygon";
}

function wybierzGeojsonGranicy(fc: GeoJsonFeatureCollection): unknown | null {
  if (!Array.isArray(fc.features) || fc.features.length === 0) return null;
  const trafiona = fc.features.find((f) => jestGranica(f.geometry)) ?? fc.features[0];
  if (trafiona?.geometry && jestGranica(trafiona.geometry)) {
    return trafiona.geometry;
  }
  return fc;
}

/**
 * Bezpieczny klient PRG WFS.
 * Uwaga: różne instancje mogą mieć inną nazwę warstwy i pola TERYT — ustawiane przez env.
 */
export async function pobierzGraniceWsiZPrgWfs(terytId: string): Promise<PrgBoundaryFetchResult> {
  const cleanTeryt = terytId.trim();
  if (!cleanTeryt) {
    return { ok: false, reason: "Pusty identyfikator TERYT.", retryable: false };
  }

  const wfsUrl = env("GEOPORTAL_PRG_WFS_URL") ?? DEFAULT_WFS_URL;
  const wfsVersion = env("GEOPORTAL_PRG_WFS_VERSION") ?? "2.0.0";
  const typeName = env("GEOPORTAL_PRG_WFS_TYPENAME");
  const terytField = env("GEOPORTAL_PRG_WFS_TERYT_FIELD");
  if (!typeName || !terytField) {
    return {
      ok: false,
      reason:
        "Brak konfiguracji GEOPORTAL_PRG_WFS_TYPENAME lub GEOPORTAL_PRG_WFS_TERYT_FIELD (wymagane do precyzyjnego filtra granic).",
      retryable: false,
    };
  }

  const cql = `${terytField}='${escapeCqlLiteral(cleanTeryt)}'`;
  const params = new URLSearchParams({
    SERVICE: "WFS",
    VERSION: wfsVersion,
    REQUEST: "GetFeature",
    SRSNAME: "EPSG:4326",
    outputFormat: "application/json",
    CQL_FILTER: cql,
  });
  if (wfsVersion.startsWith("1.")) {
    params.set("TYPENAME", typeName);
    params.set("MAXFEATURES", "10");
  } else {
    params.set("TYPENAMES", typeName);
    params.set("COUNT", "10");
  }

  let res: Response;
  try {
    res = await fetch(`${wfsUrl}?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(35_000),
      headers: {
        Accept: "application/json, application/geo+json, text/xml",
        "User-Agent": "NaszawiesPl/1.0 (+https://naszawies.pl/)",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, reason: `Błąd połączenia z WFS PRG: ${msg}`, retryable: true };
  }

  if (!res.ok) {
    return {
      ok: false,
      reason: `WFS PRG zwrócił HTTP ${res.status}.`,
      retryable: res.status >= 500 || res.status === 429,
    };
  }

  let json: unknown;
  try {
    json = (await res.json()) as unknown;
  } catch {
    return {
      ok: false,
      reason: "WFS PRG nie zwrócił JSON (sprawdź outputFormat / typename).",
      retryable: false,
    };
  }

  const fc = json as GeoJsonFeatureCollection;
  if (fc?.type !== "FeatureCollection" || !Array.isArray(fc.features)) {
    return { ok: false, reason: "Nieoczekiwany format odpowiedzi WFS.", retryable: false };
  }
  if (fc.features.length === 0) {
    return {
      ok: false,
      reason: `Brak granicy dla TERYT=${cleanTeryt} (typ warstwy: ${typeName}, pole: ${terytField}).`,
      retryable: false,
    };
  }

  const boundary = wybierzGeojsonGranicy(fc);
  if (!boundary) {
    return { ok: false, reason: "Brak geometrii granicy w odpowiedzi WFS.", retryable: false };
  }

  return {
    ok: true,
    boundaryGeojson: boundary,
    sourceName: wfsUrl,
    sourceTypeName: typeName,
    featureCount: fc.features.length,
  };
}
