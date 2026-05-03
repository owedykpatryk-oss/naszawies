type Json = Record<string, unknown>;

export type GeoJsonGeometry = {
  type: string;
  coordinates?: unknown;
  geometries?: unknown;
};

export type GeoJsonFeature = {
  type: "Feature";
  id?: string | number;
  geometry: GeoJsonGeometry | null;
  properties?: Json;
};

export type GeoJsonFeatureCollection = {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
};

export function propStr(props: Json | undefined, names: string[]): string | null {
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

function flattenNumbers(node: unknown, out: number[]): void {
  if (Array.isArray(node)) {
    for (const x of node) flattenNumbers(x, out);
    return;
  }
  if (typeof node === "number" && Number.isFinite(node)) out.push(node);
}

export function centroidFromGeometry(geometry: GeoJsonGeometry | null): { lat: number; lon: number } | null {
  if (!geometry) return null;
  if (geometry.type === "Point" && Array.isArray(geometry.coordinates) && geometry.coordinates.length >= 2) {
    const lon = Number(geometry.coordinates[0]);
    const lat = Number(geometry.coordinates[1]);
    if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon };
  }

  const vals: number[] = [];
  flattenNumbers(geometry.coordinates, vals);
  if (vals.length < 4 || vals.length % 2 !== 0) return null;
  let minLon = 180;
  let maxLon = -180;
  let minLat = 90;
  let maxLat = -90;
  for (let i = 0; i < vals.length; i += 2) {
    const lon = vals[i];
    const lat = vals[i + 1];
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }
  if (!Number.isFinite(minLon) || !Number.isFinite(minLat) || !Number.isFinite(maxLon) || !Number.isFinite(maxLat)) {
    return null;
  }
  return { lon: (minLon + maxLon) / 2, lat: (minLat + maxLat) / 2 };
}

export function featureExternalId(feature: GeoJsonFeature): string | null {
  if (typeof feature.id === "string" || typeof feature.id === "number") return String(feature.id);
  const props = feature.properties;
  return (
    propStr(props, ["iip_identy", "IIP_IDENTY", "id", "ID", "jpt_id", "JPT_ID"]) ??
    null
  );
}
