import type { GeoJsonObject } from "geojson";

/** Zamknięty pierścień jako LineString → Polygon (czasem eksport PRG/OSM). */
function lineStringZamknietyJakoPolygon(raw: object): GeoJsonObject | null {
  const o = raw as { type?: string; coordinates?: unknown };
  if (o.type !== "LineString" || !Array.isArray(o.coordinates)) return null;
  const ring = o.coordinates as [number, number][];
  if (ring.length < 4) return null;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (
    !first ||
    !last ||
    typeof first[0] !== "number" ||
    typeof first[1] !== "number" ||
    first[0] !== last[0] ||
    first[1] !== last[1]
  ) {
    return null;
  }
  return { type: "Polygon", coordinates: [ring] } as GeoJsonObject;
}

/** Normalizuje zapis granicy z bazy (string JSON, Feature, Polygon…) do GeoJSON dla Leaflet. */
export function granicaJakoGeoJson(raw: unknown): GeoJsonObject | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return null;
    try {
      return granicaJakoGeoJson(JSON.parse(t) as unknown);
    } catch {
      return null;
    }
  }
  if (typeof raw !== "object") return null;
  const o = raw as { type?: string; features?: unknown[]; geometry?: unknown };
  if (o.type === "FeatureCollection" && Array.isArray(o.features) && o.features.length === 0) {
    return null;
  }
  const jakoLinia = lineStringZamknietyJakoPolygon(raw);
  if (jakoLinia) return jakoLinia;
  if (o.type === "Feature" && o.geometry != null && typeof o.geometry === "object") {
    const polyZLinii = lineStringZamknietyJakoPolygon(o.geometry as object);
    if (polyZLinii) return { ...o, geometry: polyZLinii } as GeoJsonObject;
  }
  if (
    o.type === "Polygon" ||
    o.type === "MultiPolygon" ||
    o.type === "GeometryCollection" ||
    o.type === "Feature" ||
    o.type === "FeatureCollection"
  ) {
    return raw as GeoJsonObject;
  }
  return null;
}

function flattenLonLat(node: unknown, out: [number, number][]): void {
  if (Array.isArray(node)) {
    if (
      node.length >= 2 &&
      typeof node[0] === "number" &&
      typeof node[1] === "number" &&
      Number.isFinite(node[0]) &&
      Number.isFinite(node[1])
    ) {
      const maybeRing = node[0];
      if (Array.isArray(maybeRing) && typeof maybeRing[0] === "number") {
        for (const item of node) flattenLonLat(item, out);
        return;
      }
      out.push([node[0], node[1]]);
      return;
    }
    for (const x of node) flattenLonLat(x, out);
  }
}

/** Wyciąga wierzchołki [lon, lat] z dowolnego GeoJSON. */
export function wierzcholkiZGeoJson(gj: GeoJsonObject): [number, number][] {
  const out: [number, number][] = [];
  const o = gj as { type?: string; geometry?: unknown; coordinates?: unknown; features?: unknown[] };
  if (o.type === "Feature" && o.geometry) flattenLonLat(o.geometry, out);
  else if (o.type === "FeatureCollection" && Array.isArray(o.features)) {
    for (const f of o.features) {
      if (f && typeof f === "object") wierzcholkiZGeoJson(f as GeoJsonObject).forEach((p) => out.push(p));
    }
  } else flattenLonLat(gj, out);
  return out;
}
