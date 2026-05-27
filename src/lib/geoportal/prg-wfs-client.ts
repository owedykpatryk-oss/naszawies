import { XMLParser } from "fast-xml-parser";

export type GeoJsonGeometry = {
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

function ringFromGmlCoordinates(coordsText: string): [number, number][] | null {
  const pairs = coordsText
    .trim()
    .split(/\s+/)
    .map((chunk) => chunk.split(",").map((x) => Number.parseFloat(x.trim())))
    .filter((p) => p.length >= 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]));
  if (pairs.length < 3) return null;
  const ring: [number, number][] = pairs.map(([a, b]) => paraDoGeoJson(a, b));
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
    if ((lk.endsWith(":coordinates") || lk === "coordinates") && typeof v === "string" && v.includes(",")) {
      out.push(`__GML2__${v}`);
      continue;
    }
    collectPosLists(v, out);
  }
}

function ringFromPosListOrGml2(raw: string): [number, number][] | null {
  if (raw.startsWith("__GML2__")) {
    return ringFromGmlCoordinates(raw.slice("__GML2__".length));
  }
  return ringFromPosList(raw);
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
      const ring = ringFromPosListOrGml2(pl);
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

function poligonyZGeometrii(g: GeoJsonGeometry): [number, number][][][] {
  if (g.type === "Polygon" && Array.isArray(g.coordinates)) {
    return [g.coordinates as [number, number][][]];
  }
  if (g.type === "MultiPolygon" && Array.isArray(g.coordinates)) {
    return g.coordinates as [number, number][][][];
  }
  return [];
}

function powierzchniaPrzyblizona(g: GeoJsonGeometry): number {
  const poligony = poligonyZGeometrii(g);
  let max = 0;
  for (const poly of poligony) {
    const ring = poly[0];
    if (!ring || ring.length < 4) continue;
    let area = 0;
    for (let i = 0; i < ring.length - 1; i++) {
      const [x1, y1] = ring[i];
      const [x2, y2] = ring[i + 1];
      area += x1 * y2 - x2 * y1;
    }
    max = Math.max(max, Math.abs(area) / 2);
  }
  return max;
}

/** Bez punktu GPS: największy fragment obrysu (unikamy gigantycznego MultiPolygon). */
function polaczKandydatowBezPunktu(kandydaci: GeoJsonGeometry[]): GeoJsonGeometry | null {
  if (kandydaci.length === 0) return null;
  if (kandydaci.length === 1) return kandydaci[0] ?? null;
  let najlepszy = kandydaci[0];
  let maxArea = powierzchniaPrzyblizona(najlepszy);
  for (let i = 1; i < kandydaci.length; i++) {
    const k = kandydaci[i];
    if (!k) continue;
    const a = powierzchniaPrzyblizona(k);
    if (a > maxArea) {
      maxArea = a;
      najlepszy = k;
    }
  }
  return najlepszy ?? null;
}

function wybierzGeometrieKandydata(kandydaci: GeoJsonGeometry[], lon?: number, lat?: number): GeoJsonGeometry | null {
  if (kandydaci.length === 0) return null;
  if (Number.isFinite(lon) && Number.isFinite(lat)) {
    const trafiony = kandydaci.find((k) => punktWGeojson(k, lon as number, lat as number));
    if (trafiony) return trafiony;
    /** Przy znanym GPS nie bierz pierwszego obrysu z filtra TERYT — często to inny obręb ewidencyjny. */
    return null;
  }
  return polaczKandydatowBezPunktu(kandydaci);
}

/** Sprawdza, czy punkt WGS84 leży w granicy GeoJSON (do walidacji po sync z PRG). */
export function czyPunktWGranicyGeojson(
  granica: GeoJsonGeometry,
  lon: number,
  lat: number,
): boolean {
  return punktWGeojson(granica, lon, lat);
}

export function zrodloZWarstwyPrg(sourceTypeName: string): string {
  const t = sourceTypeName.toLowerCase();
  if (t.includes("obrys gminy")) return t.includes("a06") ? "prg_a06_gmina" : "prg_a05_gmina";
  if (t.includes("a05")) return t.includes("bbox") ? "prg_a05_bbox" : "prg_a05";
  if (t.includes("a06")) return t.includes("bbox") ? "prg_a06_bbox" : "prg_a06";
  return "prg";
}

export function centroidZGeojson(geo: unknown): { lat: number; lon: number } | null {
  if (!geo || typeof geo !== "object") return null;
  const g = geo as GeoJsonGeometry;
  const pts: [number, number][] = [];
  const walk = (node: unknown): void => {
    if (!Array.isArray(node)) return;
    if (
      node.length >= 2 &&
      typeof node[0] === "number" &&
      typeof node[1] === "number" &&
      !Array.isArray(node[0])
    ) {
      pts.push([node[0], node[1]]);
      return;
    }
    for (const x of node) walk(x);
  };
  if (g.type === "Polygon") walk(g.coordinates);
  else if (g.type === "MultiPolygon") walk(g.coordinates);
  if (pts.length === 0) return null;
  const lon = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const lat = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return { lat, lon };
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

function warstwyPrgDoProby(): { typeName: string; terytField: string }[] {
  const lista = env("GEOPORTAL_PRG_WFS_LAYERS");
  if (lista) {
    const terytField = env("GEOPORTAL_PRG_WFS_TERYT_FIELD") ?? "JPT_KOD_JE";
    return lista
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((typeName) => ({ typeName: normalizujTypeName(typeName), terytField }));
  }
  const typeNameRaw = env("GEOPORTAL_PRG_WFS_TYPENAME");
  const terytField = env("GEOPORTAL_PRG_WFS_TERYT_FIELD") ?? "JPT_KOD_JE";
  const domyslne = [
    { typeName: "A05_Granice_jednostek_ewidencyjnych", terytField },
    { typeName: "A06_Granice_obrebow_ewidencyjnych", terytField },
  ];
  if (typeNameRaw) {
    const typeName = normalizujTypeName(typeNameRaw);
    if (!domyslne.some((w) => w.typeName === typeName)) {
      domyslne.unshift({ typeName, terytField });
    }
  }
  return domyslne;
}

const FORMATY_WFS = ["GML2", "application/json"] as const;

function zbudujParamsGetFeature(opts: {
  wfsVersion: string;
  typeName: string;
  cqlFilter?: string;
  bbox?: [number, number, number, number];
  limit?: number;
  startIndex?: number;
  outputFormat?: string;
}): URLSearchParams {
  const params = new URLSearchParams({
    SERVICE: "WFS",
    VERSION: opts.wfsVersion,
    REQUEST: "GetFeature",
    SRSNAME: "EPSG:4326",
    outputFormat: opts.outputFormat ?? "GML2",
  });
  if (opts.cqlFilter) params.set("CQL_FILTER", opts.cqlFilter);
  if (opts.bbox) params.set("BBOX", `${opts.bbox[0]},${opts.bbox[1]},${opts.bbox[2]},${opts.bbox[3]}`);
  if (opts.wfsVersion.startsWith("1.")) {
    params.set("TYPENAME", opts.typeName);
    params.set("MAXFEATURES", String(opts.limit ?? 10));
    if (opts.startIndex != null && opts.startIndex > 0) {
      params.set("STARTINDEX", String(opts.startIndex));
    }
  } else {
    params.set("TYPENAMES", opts.typeName);
    params.set("COUNT", String(opts.limit ?? 10));
    if (opts.startIndex != null && opts.startIndex > 0) {
      params.set("startIndex", String(opts.startIndex));
    }
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

function parsujKandydatowOdpowiedzi(text: string, contentType: string): {
  kandydaci: GeoJsonGeometry[];
  featureCount: number;
  blad?: string;
} {
  if (text.includes("ExceptionReport")) {
    return { kandydaci: [], featureCount: 0, blad: "ExceptionReport" };
  }
  if (contentType.includes("json")) {
    const jsonOut = kandydaciGeometriiZJson(text);
    if (!jsonOut) return { kandydaci: [], featureCount: 0, blad: "invalid_json" };
    return { kandydaci: jsonOut.candidates, featureCount: jsonOut.featureCount };
  }
  const kandydaci = kandydaciGeometriiZXml(text);
  return { kandydaci, featureCount: kandydaci.length };
}

type WfsKandydaciOk = { kandydaci: GeoJsonGeometry[]; featureCount: number; format: string };
type WfsKandydaciBlad = { blad: string; retryable: boolean };

function czyWfsOk(
  w: WfsKandydaciOk | WfsKandydaciBlad,
): w is WfsKandydaciOk {
  return "kandydaci" in w;
}

async function pobierzKandydatowWfs(
  wfsUrl: string,
  wfsVersion: string,
  typeName: string,
  opts: { cqlFilter?: string; bbox?: [number, number, number, number]; limit?: number; startIndex?: number },
): Promise<WfsKandydaciOk | WfsKandydaciBlad> {
  for (const format of FORMATY_WFS) {
    const params = zbudujParamsGetFeature({
      wfsVersion,
      typeName,
      cqlFilter: opts.cqlFilter,
      bbox: opts.bbox,
      limit: opts.limit,
      startIndex: opts.startIndex,
      outputFormat: format,
    });
    try {
      const res = await pobierzWfs(wfsUrl, params);
      if (res.status < 200 || res.status >= 300) {
        if (format === FORMATY_WFS[FORMATY_WFS.length - 1]) {
          return { blad: `HTTP ${res.status}`, retryable: res.status >= 500 || res.status === 429 };
        }
        continue;
      }
      if (!res.text.trim()) continue;
      const parsed = parsujKandydatowOdpowiedzi(res.text, res.contentType);
      if (parsed.blad === "ExceptionReport") continue;
      if (parsed.kandydaci.length > 0) {
        return { kandydaci: parsed.kandydaci, featureCount: parsed.featureCount, format };
      }
    } catch (e) {
      if (format === FORMATY_WFS[FORMATY_WFS.length - 1]) {
        const msg = e instanceof Error ? e.message : String(e);
        return { blad: msg, retryable: true };
      }
    }
  }
  return { kandydaci: [], featureCount: 0, format: "GML2" };
}

const ROZMIAR_STRONY_CQL = 12;
const MAX_STRON_CQL = 1;

async function pobierzKandydatowCqlPaginacja(
  wfsUrl: string,
  wfsVersion: string,
  typeName: string,
  cqlFilter: string,
): Promise<WfsKandydaciOk | WfsKandydaciBlad> {
  const kandydaci: GeoJsonGeometry[] = [];
  let featureCount = 0;
  let format = "GML2";

  for (let strona = 0; strona < MAX_STRON_CQL; strona += 1) {
    const startIndex = strona * ROZMIAR_STRONY_CQL;
    const wynik = await pobierzKandydatowWfs(wfsUrl, wfsVersion, typeName, {
      cqlFilter,
      limit: ROZMIAR_STRONY_CQL,
      startIndex,
    });
    if (!czyWfsOk(wynik)) {
      return strona === 0 ? wynik : { kandydaci, featureCount, format };
    }
    format = wynik.format;
    kandydaci.push(...wynik.kandydaci);
    featureCount += wynik.featureCount;
    if (wynik.featureCount < ROZMIAR_STRONY_CQL) break;
  }

  return { kandydaci, featureCount, format };
}

async function probujWarstwePrgBbox(
  wfsUrl: string,
  wfsVersion: string,
  typeName: string,
  lat: number,
  lon: number,
): Promise<PrgBoundaryFetchResult | null> {
  const rozmiaryBbox = [0.03, 0.06, 0.12, 0.22] as const;
  for (const dx of rozmiaryBbox) {
    const bbox = [lon - dx, lat - dx, lon + dx, lat + dx] as [number, number, number, number];
    const fallback = await pobierzKandydatowWfs(wfsUrl, wfsVersion, typeName, { bbox, limit: 120 });
    if (!czyWfsOk(fallback)) continue;
    const boundary = wybierzGeometrieKandydata(fallback.kandydaci, lon, lat);
    if (boundary && punktWGeojson(boundary, lon, lat)) {
      return {
        ok: true,
        boundaryGeojson: boundary,
        sourceName: wfsUrl,
        sourceTypeName: `${typeName} (BBOX ${dx}°)`,
        featureCount: fallback.featureCount,
      };
    }
  }
  return null;
}

async function probujWarstwePrgCql(
  wfsUrl: string,
  wfsVersion: string,
  warstwa: { typeName: string; terytField: string },
  kodTeryt: string,
  lat?: number,
  lon?: number,
): Promise<PrgBoundaryFetchResult | null> {
  const { typeName, terytField } = warstwa;
  const cql = `${terytField}='${escapeCqlLiteral(kodTeryt)}'`;
  const pierwszy = await pobierzKandydatowCqlPaginacja(wfsUrl, wfsVersion, typeName, cql);
  if (!czyWfsOk(pierwszy)) {
    return null;
  }
  const kandydaci = pierwszy.kandydaci;
  const featureCount = pierwszy.featureCount;
  const boundary = wybierzGeometrieKandydata(kandydaci, lon, lat);
  const mamyPunkt = Number.isFinite(lon) && Number.isFinite(lat);
  const punktOk = boundary && mamyPunkt ? punktWGeojson(boundary, lon as number, lat as number) : false;
  if (boundary && (!mamyPunkt || punktOk)) {
    return {
      ok: true,
      boundaryGeojson: boundary,
      sourceName: wfsUrl,
      sourceTypeName: !mamyPunkt ? `${typeName} (obrys gminy)` : typeName,
      featureCount,
    };
  }
  if (!mamyPunkt && kandydaci.length > 0) {
    const gmina = polaczKandydatowBezPunktu(kandydaci);
    if (gmina) {
      return {
        ok: true,
        boundaryGeojson: gmina,
        sourceName: wfsUrl,
        sourceTypeName: `${typeName} (obrys gminy)`,
        featureCount,
      };
    }
  }
  if (mamyPunkt) {
    return probujWarstwePrgBbox(wfsUrl, wfsVersion, typeName, lat as number, lon as number);
  }
  return null;
}

/**
 * Bezpieczny klient PRG WFS.
 * Uwaga: różne instancje mogą mieć inną nazwę warstwy i pola TERYT — ustawiane przez env.
 */
export async function pobierzGraniceWsiZPrgWfs(
  terytId: string,
  opts?: { lat?: number | null; lon?: number | null; gminaTerytKod?: string | null },
): Promise<PrgBoundaryFetchResult> {
  const cleanTeryt = terytId.trim();
  if (!cleanTeryt) {
    return { ok: false, reason: "Pusty identyfikator TERYT/SIMC.", retryable: false };
  }

  const wfsUrl = env("GEOPORTAL_PRG_WFS_URL") ?? DEFAULT_WFS_URL;
  const wfsVersion = env("GEOPORTAL_PRG_WFS_VERSION") ?? "1.1.0";
  const lat = typeof opts?.lat === "number" ? opts.lat : undefined;
  const lon = typeof opts?.lon === "number" ? opts.lon : undefined;
  const gminaKod = opts?.gminaTerytKod?.trim() || null;
  const warstwy = warstwyPrgDoProby();
  const bledy: string[] = [];
  const mamyPunkt = Number.isFinite(lat) && Number.isFinite(lon);

  for (const warstwa of warstwy) {
    try {
      if (mamyPunkt) {
        const zBbox = await probujWarstwePrgBbox(wfsUrl, wfsVersion, warstwa.typeName, lat as number, lon as number);
        if (zBbox?.ok) return zBbox;
      }
      if (gminaKod) {
        const zGminy = await probujWarstwePrgCql(wfsUrl, wfsVersion, warstwa, gminaKod, lat, lon);
        if (zGminy?.ok) return zGminy;
      }
      if (mamyPunkt) {
        const wynik = await probujWarstwePrgCql(wfsUrl, wfsVersion, warstwa, cleanTeryt, lat, lon);
        if (wynik?.ok) return wynik;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      bledy.push(`${warstwa.typeName}: ${msg}`);
    }
  }

  if (bledy.length > 0) {
    return {
      ok: false,
      reason: `Błąd połączenia z WFS PRG: ${bledy[0]}`,
      retryable: true,
    };
  }

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return {
      ok: false,
      reason: `Brak granicy dla TERYT=${cleanTeryt} (warstwy: ${warstwy.map((w) => w.typeName).join(", ")}).`,
      retryable: false,
    };
  }

  return {
    ok: false,
    reason:
      "Nie znaleziono granicy zawierającej punkt wsi. Sprawdź, czy źródło WFS zawiera ten poziom podziału (np. sołectwo vs obręb).",
    retryable: false,
  };
}
