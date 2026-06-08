import { featureExternalId, propStr } from "@/lib/geoportal/geojson-utils";
import { pobierzWfsFeatureCollection } from "@/lib/geoportal/wfs-get-feature";

export type ObrysLesnictwaBdl = {
  id: string;
  name: string;
  nadlesnictwo: string | null;
  geojson: unknown;
};

export type LesnictwaBdlResult =
  | { ok: true; obrysy: ObrysLesnictwaBdl[]; featureCount: number }
  | { ok: false; reason: string; retryable: boolean };

const DEFAULT_WFS_URL = "https://wfs.bdl.lasy.gov.pl/geoserver/BDL/ows";
const WARSTWA_LESNICTWA = "BDL:Leśnictwa";

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v && v.length > 0 ? v : null;
}

function bboxWokolPunktu(lat: number, lon: number, radiusM: number): string {
  const dLat = radiusM / 111_320;
  const dLon = radiusM / (111_320 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
  return `${lon - dLon},${lat - dLat},${lon + dLon},${lat + dLat},EPSG:4326`;
}

function jestPoligon(g: unknown): boolean {
  if (!g || typeof g !== "object") return false;
  const t = (g as { type?: string }).type;
  return t === "Polygon" || t === "MultiPolygon";
}

/** Granice leśnictw LP (BDL WFS) w promieniu od punktu. */
export async function pobierzLesnictwaBdlWokolPunktu(
  lat: number,
  lon: number,
  radiusM: number,
): Promise<LesnictwaBdlResult> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { ok: false, reason: "Nieprawidłowe współrzędne.", retryable: false };
  }

  const wfsUrl = env("BDL_LASY_WFS_URL") ?? DEFAULT_WFS_URL;
  const wfsVersion = env("BDL_LASY_WFS_VERSION") ?? "1.1.0";
  const typeName = env("BDL_LASY_WFS_LAYER_LESNICTWA") ?? WARSTWA_LESNICTWA;
  const promien = Math.max(5000, Math.min(80_000, radiusM));

  const wfs = await pobierzWfsFeatureCollection({
    wfsUrl,
    wfsVersion,
    typeName,
    bbox: bboxWokolPunktu(lat, lon, promien),
    maxFeatures: 60,
    timeoutMs: 45_000,
  });

  if (!wfs.ok) {
    return { ok: false, reason: wfs.reason, retryable: wfs.retryable };
  }

  const obrysy: ObrysLesnictwaBdl[] = [];
  for (const f of wfs.collection.features) {
    if (!jestPoligon(f.geometry)) continue;
    const extId = featureExternalId(f);
    const name =
      propStr(f.properties, ["forest_range_name", "name", "NAZWA", "nazwa"]) ?? "Leśnictwo";
    const nadlesnictwo = propStr(f.properties, [
      "adress_forest",
      "inspectorate_name",
      "nadleśnictwo",
      "nadlesnictwo",
    ]);
    obrysy.push({
      id: extId ?? `les-${obrysy.length}`,
      name,
      nadlesnictwo,
      geojson: f.geometry,
    });
  }

  return { ok: true, obrysy, featureCount: obrysy.length };
}
