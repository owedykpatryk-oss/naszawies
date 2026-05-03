import { XMLParser } from "fast-xml-parser";

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

function asArray<T>(v: T | T[] | null | undefined): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function liczbyZPosList(posList: string): number[] {
  return posList
    .trim()
    .split(/\s+/)
    .map((x) => Number.parseFloat(x))
    .filter((x) => Number.isFinite(x));
}

function paraDoGeoJson(a: number, b: number): [number, number] {
  // Częsty przypadek dla usług PRG: EPSG:4326 jako (lat, lon).
  if (Math.abs(a) > 40 && Math.abs(b) < 40) return [b, a];
  return [a, b];
}

function ringFromPosList(posList: string): [number, number][] | null {
  const nums = liczbyZPosList(posList);
  if (nums.length < 6 || nums.length % 2 !== 0) return null;
  const ring: [number, number][] = [];
  for (let i = 0; i < nums.length; i += 2) {
    ring.push(paraDoGeoJson(nums[i], nums[i + 1]));
  }
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first && last && (first[0] !== last[0] || first[1] !== last[1])) {
    ring.push([first[0], first[1]]);
  }
  return ring.length >= 4 ? ring : null;
}

function collectPosLists(node: unknown, out: string[]): void {
  if (!node) return;
  if (Array.isArray(node)) {
    for (const x of node) collectPosLists(x, out);
    return;
  }
  if (typeof node !== "object") return;
  const obj = node as Record<string, unknown>;
  for (const [k, v] of Object.entries(obj)) {
    const lk = k.toLowerCase();
    if ((lk.endsWith(":poslist") || lk === "poslist") && typeof v === "string") {
      out.push(v);
      continue;
    }
    collectPosLists(v, out);
  }
}

function boundaryFromWfsXml(xmlText: string): unknown | null {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    trimValues: true,
  });
  let root: unknown;
  try {
    root = parser.parse(xmlText) as unknown;
  } catch {
    return null;
  }
  const obj = root as Record<string, unknown>;
  const fc =
    (obj["wfs:FeatureCollection"] as Record<string, unknown> | undefined) ??
    (obj.FeatureCollection as Record<string, unknown> | undefined) ??
    obj;
  const members = asArray(
    (fc?.["wfs:member"] as unknown) ??
      (fc?.member as unknown) ??
      (fc?.["gml:featureMember"] as unknown) ??
      (fc?.featureMember as unknown),
  );
  if (members.length === 0) return null;

  const rings: [number, number][][] = [];
  for (const m of members) {
    const mo = m as Record<string, unknown>;
    const featureObj =
      Object.values(mo).find((v) => typeof v === "object" && v !== null) ??
      m;
    const posLists: string[] = [];
    collectPosLists(featureObj, posLists);
    for (const pl of posLists) {
      const ring = ringFromPosList(pl);
      if (ring) rings.push(ring);
    }
  }
  if (rings.length === 0) return null;
  if (rings.length === 1) {
    return { type: "Polygon", coordinates: [rings[0]] };
  }
  return { type: "MultiPolygon", coordinates: rings.map((r) => [r]) };
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

  const contentType = (res.headers.get("content-type") ?? "").toLowerCase();
  const text = await res.text();
  if (!text.trim()) {
    return { ok: false, reason: "Pusta odpowiedź WFS PRG.", retryable: true };
  }

  if (contentType.includes("json")) {
    let json: unknown;
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      return { ok: false, reason: "WFS PRG zwrócił niepoprawny JSON.", retryable: false };
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

  if (text.includes("ExceptionReport")) {
    return {
      ok: false,
      reason: "WFS PRG zwrócił ExceptionReport (sprawdź typ warstwy/filtr).",
      retryable: false,
    };
  }

  const boundaryFromXml = boundaryFromWfsXml(text);
  if (!boundaryFromXml) {
    return {
      ok: false,
      reason: "Nie udało się odczytać geometrii granicy z odpowiedzi GML/XML.",
      retryable: false,
    };
  }

  return {
    ok: true,
    boundaryGeojson: boundaryFromXml,
    sourceName: wfsUrl,
    sourceTypeName: typeName,
    featureCount: 1,
  };
}
