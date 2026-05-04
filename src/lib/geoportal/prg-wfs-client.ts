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

function normalizujTypeName(typeName: string): string {
  const t = typeName.trim();
  if (!t) return t;
  const idx = t.indexOf(":");
  return idx >= 0 ? t.slice(idx + 1) : t;
}

function jestGranica(geometry: GeoJsonGeometry | null | undefined): boolean {
  if (!geometry?.type) return false;
  return geometry.type === "Polygon" || geometry.type === "MultiPolygon";
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

function wyciagnijFeatureCollectionZXml(xmlText: string): Record<string, unknown> | null {
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
  return (
    (obj["wfs:FeatureCollection"] as Record<string, unknown> | undefined) ??
    (obj.FeatureCollection as Record<string, unknown> | undefined) ??
    obj
  );
}

function kandydaciGeometriiZXml(xmlText: string): GeoJsonGeometry[] {
  const fc = wyciagnijFeatureCollectionZXml(xmlText);
  if (!fc) return [];
  const members = asArray(
    (fc?.["wfs:member"] as unknown) ??
      (fc?.member as unknown) ??
      (fc?.["gml:featureMember"] as unknown) ??
      (fc?.featureMember as unknown),
  );
  if (members.length === 0) return [];
  const out: GeoJsonGeometry[] = [];
  for (const m of members) {
    const mo = m as Record<string, unknown>;
    const featureObj =
      Object.values(mo).find((v) => typeof v === "object" && v !== null) ??
      m;
    const posLists: string[] = [];
    collectPosLists(featureObj, posLists);
    const rings: [number, number][][] = [];
    for (const pl of posLists) {
      const ring = ringFromPosList(pl);
      if (ring) rings.push(ring);
    }
    if (rings.length === 1) out.push({ type: "Polygon", coordinates: [rings[0]] });
    else if (rings.length > 1) out.push({ type: "MultiPolygon", coordinates: rings.map((r) => [r]) });
  }
  return out;
}

function punktWWielokacie(ring: [number, number][], lon: number, lat: number): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function punktWPoligonie(coords: unknown, lon: number, lat: number): boolean {
  if (!Array.isArray(coords) || coords.length === 0) return false;
  const rings = coords as [number, number][][];
  const exterior = rings[0];
  if (!Array.isArray(exterior) || exterior.length < 4) return false;
  if (!punktWWielokacie(exterior, lon, lat)) return false;
  for (let i = 1; i < rings.length; i += 1) {
    if (punktWWielokacie(rings[i], lon, lat)) return false;
  }
  return true;
}

function punktWGeojson(g: unknown, lon: number, lat: number): boolean {
  if (!g || typeof g !== "object") return false;
  const o = g as {
    type?: string;
    coordinates?: unknown;
    geometry?: unknown;
    geometries?: unknown[];
    features?: { geometry?: unknown }[];
  };
  if (o.type === "Feature") return punktWGeojson(o.geometry, lon, lat);
  if (o.type === "FeatureCollection" && Array.isArray(o.features)) {
    return o.features.some((f) => punktWGeojson(f.geometry, lon, lat));
  }
  if (o.type === "GeometryCollection" && Array.isArray(o.geometries)) {
    return o.geometries.some((x) => punktWGeojson(x, lon, lat));
  }
  if (o.type === "Polygon") return punktWPoligonie(o.coordinates, lon, lat);
  if (o.type === "MultiPolygon") {
    const polys = o.coordinates as unknown[];
    return Array.isArray(polys) && polys.some((p) => punktWPoligonie(p, lon, lat));
  }
  return false;
}

function wybierzGeometrieKandydata(kandydaci: GeoJsonGeometry[], lon?: number, lat?: number): GeoJsonGeometry | null {
  if (kandydaci.length === 0) return null;
  if (Number.isFinite(lon) && Number.isFinite(lat)) {
    const trafiony = kandydaci.find((k) => punktWGeojson(k, lon as number, lat as number));
    if (trafiony) return trafiony;
  }
  return kandydaci[0] ?? null;
}

async function pobierzWfs(wfsUrl: string, params: URLSearchParams): Promise<{ text: string; contentType: string; status: number }> {
  const res = await fetch(`${wfsUrl}?${params.toString()}`, {
    method: "GET",
    cache: "no-store",
    signal: AbortSignal.timeout(35_000),
    headers: {
      Accept: "application/json, application/geo+json, text/xml",
      "User-Agent": "NaszawiesPl/1.0 (+https://naszawies.pl/)",
    },
  });
  const text = await res.text();
  return {
    text,
    contentType: (res.headers.get("content-type") ?? "").toLowerCase(),
    status: res.status,
  };
}

function zbudujParamsGetFeature(opts: {
  wfsVersion: string;
  typeName: string;
  cqlFilter?: string;
  bbox?: [number, number, number, number];
  limit?: number;
}): URLSearchParams {
  const params = new URLSearchParams({
    SERVICE: "WFS",
    VERSION: opts.wfsVersion,
    REQUEST: "GetFeature",
    SRSNAME: "EPSG:4326",
    outputFormat: "application/json",
  });
  if (opts.cqlFilter) params.set("CQL_FILTER", opts.cqlFilter);
  if (opts.bbox) params.set("BBOX", `${opts.bbox[0]},${opts.bbox[1]},${opts.bbox[2]},${opts.bbox[3]}`);
  if (opts.wfsVersion.startsWith("1.")) {
    params.set("TYPENAME", opts.typeName);
    params.set("MAXFEATURES", String(opts.limit ?? 10));
  } else {
    params.set("TYPENAMES", opts.typeName);
    params.set("COUNT", String(opts.limit ?? 10));
  }
  return params;
}

function kandydaciGeometriiZJson(txt: string): { candidates: GeoJsonGeometry[]; featureCount: number } | null {
  let json: unknown;
  try {
    json = JSON.parse(txt) as unknown;
  } catch {
    return null;
  }
  const fc = json as GeoJsonFeatureCollection;
  if (fc?.type !== "FeatureCollection" || !Array.isArray(fc.features)) return null;
  const candidates = fc.features.map((f) => f.geometry).filter(jestGranica) as GeoJsonGeometry[];
  return { candidates, featureCount: fc.features.length };
}

/**
 * Bezpieczny klient PRG WFS.
 * Uwaga: różne instancje mogą mieć inną nazwę warstwy i pola TERYT — ustawiane przez env.
 */
export async function pobierzGraniceWsiZPrgWfs(
  terytId: string,
  opts?: { lat?: number | null; lon?: number | null },
): Promise<PrgBoundaryFetchResult> {
  const cleanTeryt = terytId.trim();
  if (!cleanTeryt) {
    return { ok: false, reason: "Pusty identyfikator TERYT.", retryable: false };
  }

  const wfsUrl = env("GEOPORTAL_PRG_WFS_URL") ?? DEFAULT_WFS_URL;
  const wfsVersion = env("GEOPORTAL_PRG_WFS_VERSION") ?? "1.1.0";
  const typeNameRaw = env("GEOPORTAL_PRG_WFS_TYPENAME");
  const terytField = env("GEOPORTAL_PRG_WFS_TERYT_FIELD");
  if (!typeNameRaw || !terytField) {
    return {
      ok: false,
      reason:
        "Brak konfiguracji GEOPORTAL_PRG_WFS_TYPENAME lub GEOPORTAL_PRG_WFS_TERYT_FIELD (wymagane do precyzyjnego filtra granic).",
      retryable: false,
    };
  }
  const typeName = normalizujTypeName(typeNameRaw);

  const cql = `${terytField}='${escapeCqlLiteral(cleanTeryt)}'`;
  const params = zbudujParamsGetFeature({ wfsVersion, typeName, cqlFilter: cql, limit: 12 });
  const lat = typeof opts?.lat === "number" ? opts.lat : undefined;
  const lon = typeof opts?.lon === "number" ? opts.lon : undefined;

  let firstText = "";
  let firstContentType = "";
  let firstStatus = 0;
  try {
    const first = await pobierzWfs(wfsUrl, params);
    firstText = first.text;
    firstContentType = first.contentType;
    firstStatus = first.status;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, reason: `Błąd połączenia z WFS PRG: ${msg}`, retryable: true };
  }

  if (firstStatus < 200 || firstStatus >= 300) {
    return {
      ok: false,
      reason: `WFS PRG zwrócił HTTP ${firstStatus}.`,
      retryable: firstStatus >= 500 || firstStatus === 429,
    };
  }

  if (!firstText.trim()) {
    return { ok: false, reason: "Pusta odpowiedź WFS PRG.", retryable: true };
  }

  let featureCount = 0;
  let kandydaci: GeoJsonGeometry[] = [];
  if (firstContentType.includes("json")) {
    const jsonOut = kandydaciGeometriiZJson(firstText);
    if (!jsonOut) {
      return { ok: false, reason: "WFS PRG zwrócił niepoprawny JSON.", retryable: false };
    }
    kandydaci = jsonOut.candidates;
    featureCount = jsonOut.featureCount;
  } else {
    if (firstText.includes("ExceptionReport")) {
      return {
        ok: false,
        reason: "WFS PRG zwrócił ExceptionReport (sprawdź typ warstwy/filtr).",
        retryable: false,
      };
    }
    kandydaci = kandydaciGeometriiZXml(firstText);
    featureCount = kandydaci.length;
  }

  let boundary = wybierzGeometrieKandydata(kandydaci, lon, lat);
  const mamyPunkt = Number.isFinite(lon) && Number.isFinite(lat);
  const punktWPierwszym = boundary && mamyPunkt ? punktWGeojson(boundary, lon as number, lat as number) : false;
  if (boundary && (!mamyPunkt || punktWPierwszym)) {
    return {
      ok: true,
      boundaryGeojson: boundary,
      sourceName: wfsUrl,
      sourceTypeName: typeName,
      featureCount,
    };
  }

  if (!mamyPunkt) {
    return {
      ok: false,
      reason: `Brak granicy dla TERYT=${cleanTeryt} (typ warstwy: ${typeName}, pole: ${terytField}).`,
      retryable: false,
    };
  }

  // Fallback: filtr po TERYT/SIMC potrafi oddać zły obiekt dla warstwy A06.
  // Dodatkowe zapytanie przestrzenne po BBOX wybiera granicę faktycznie zawierającą punkt wsi.
  const pointLon = lon as number;
  const pointLat = lat as number;
  const dx = 0.18;
  const bbox = [pointLon - dx, pointLat - dx, pointLon + dx, pointLat + dx] as [number, number, number, number];
  const fallbackParams = zbudujParamsGetFeature({ wfsVersion, typeName, bbox, limit: 120 });
  try {
    const fallback = await pobierzWfs(wfsUrl, fallbackParams);
    let fallbackCandidates: GeoJsonGeometry[] = [];
    if (fallback.contentType.includes("json")) {
      const parsed = kandydaciGeometriiZJson(fallback.text);
      fallbackCandidates = parsed?.candidates ?? [];
    } else {
      fallbackCandidates = kandydaciGeometriiZXml(fallback.text);
    }
    boundary = wybierzGeometrieKandydata(fallbackCandidates, pointLon, pointLat);
    if (boundary && punktWGeojson(boundary, pointLon, pointLat)) {
      return {
        ok: true,
        boundaryGeojson: boundary,
        sourceName: wfsUrl,
        sourceTypeName: `${typeName} (fallback BBOX)`,
        featureCount: fallbackCandidates.length,
      };
    }
  } catch {
    // Przy fallbacku wolimy zwrócić precyzyjny błąd domenowy niż błąd transportu.
  }

  return {
    ok: false,
    reason:
      "Nie znaleziono granicy zawierającej punkt wsi. Sprawdź, czy źródło WFS zawiera ten poziom podziału (np. sołectwo vs obręb).",
    retryable: false,
  };
}
