import { XMLParser } from "fast-xml-parser";
import type { GeoJsonFeature, GeoJsonFeatureCollection, GeoJsonGeometry } from "@/lib/geoportal/geojson-utils";

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

function collectGmlCoordinateStrings(node: unknown, out: string[]): void {
  if (!node) return;
  if (Array.isArray(node)) {
    for (const x of node) collectGmlCoordinateStrings(x, out);
    return;
  }
  if (typeof node !== "object") return;
  const obj = node as Record<string, unknown>;
  for (const [k, v] of Object.entries(obj)) {
    const lk = k.toLowerCase();
    if ((lk.endsWith(":coordinates") || lk === "coordinates") && typeof v === "string" && v.includes(",")) {
      out.push(v);
      continue;
    }
    collectGmlCoordinateStrings(v, out);
  }
}

function punktZGml(node: unknown): GeoJsonGeometry | null {
  const coords: string[] = [];
  collectGmlCoordinateStrings(node, coords);
  for (const raw of coords) {
    const parts = raw
      .trim()
      .split(/\s*,\s*/)
      .map((x) => Number.parseFloat(x.trim()))
      .filter((x) => Number.isFinite(x));
    if (parts.length < 2) continue;
    const [lon, lat] = paraDoGeoJson(parts[0], parts[1]);
    return { type: "Point", coordinates: [lon, lat] };
  }
  const posLists: string[] = [];
  collectPosLists(node, posLists);
  for (const pl of posLists) {
    const nums = liczbyZPosList(pl.startsWith("__GML2__") ? pl.slice("__GML2__".length) : pl);
    if (nums.length >= 2) {
      const [lon, lat] = paraDoGeoJson(nums[0], nums[1]);
      return { type: "Point", coordinates: [lon, lat] };
    }
  }
  return null;
}

function geometriaZWezla(node: unknown): GeoJsonGeometry | null {
  const punkt = punktZGml(node);
  if (punkt) return punkt;

  const posLists: string[] = [];
  collectPosLists(node, posLists);
  const rings: [number, number][][] = [];
  for (const pl of posLists) {
    const ring = ringFromPosListOrGml2(pl);
    if (ring) rings.push(ring);
  }
  if (rings.length === 1) return { type: "Polygon", coordinates: [rings[0]] };
  if (rings.length > 1) return { type: "MultiPolygon", coordinates: rings.map((r) => [r]) };
  return null;
}

const GEOMETRY_KEY_RE =
  /poslist|coordinates|boundedby|geometry|shape|the_geom|geom|multi(surface|polygon|line|point)/i;

function flattenGmlProperties(node: unknown, prefix = "", out: Record<string, unknown> = {}): Record<string, unknown> {
  if (!node) return out;
  if (Array.isArray(node)) {
    for (const x of node) flattenGmlProperties(x, prefix, out);
    return out;
  }
  if (typeof node !== "object") return out;
  const obj = node as Record<string, unknown>;
  for (const [k, v] of Object.entries(obj)) {
    const local = k.includes(":") ? k.split(":").pop()! : k;
    if (GEOMETRY_KEY_RE.test(local)) continue;
    const fullKey = prefix ? `${prefix}_${local}` : local;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      const s = String(v).trim();
      if (s) out[fullKey] = v;
    } else if (typeof v === "object") {
      flattenGmlProperties(v, fullKey, out);
    }
  }
  return out;
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

export function featureCollectionFromGml(xmlText: string): GeoJsonFeatureCollection | null {
  if (!xmlText.includes("FeatureCollection") && !xmlText.includes("featureMember")) return null;
  const fc = wyciagnijFeatureCollectionZXml(xmlText);
  if (!fc) return null;
  const members = asArray(
    (fc["wfs:member"] as unknown) ??
      (fc.member as unknown) ??
      (fc["gml:featureMember"] as unknown) ??
      (fc.featureMember as unknown),
  );
  if (members.length === 0) {
    return { type: "FeatureCollection", features: [] };
  }

  const features: GeoJsonFeature[] = [];
  for (const m of members) {
    const mo = m as Record<string, unknown>;
    const featureObj =
      Object.values(mo).find((v) => typeof v === "object" && v !== null) ?? m;
    const geometry = geometriaZWezla(featureObj);
    const properties = flattenGmlProperties(featureObj);
    features.push({
      type: "Feature",
      geometry,
      properties: Object.keys(properties).length > 0 ? properties : undefined,
    });
  }
  return { type: "FeatureCollection", features };
}
