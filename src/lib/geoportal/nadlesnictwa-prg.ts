import { featureExternalId, propStr } from "@/lib/geoportal/geojson-utils";
import { pobierzWfsFeatureCollection } from "@/lib/geoportal/wfs-get-feature";

export type ObrysNadlesnictwaPrg = {
  id: string;
  name: string;
  geojson: unknown;
};

export type NadlesnictwaPrgResult =
  | { ok: true; obrysy: ObrysNadlesnictwaPrg[]; featureCount: number }
  | { ok: false; reason: string; retryable: boolean };

const DEFAULT_WFS_URL = "https://mapy.geoportal.gov.pl/wss/service/PZGIK/PRG/WFS/AdministrativeBoundaries";
const WARSTWA_NADLESNICTWO = "U06_Nadlesnictwo";

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

/** Granice nadleśnictw LP (PRG U06) w promieniu od punktu. */
export async function pobierzNadlesnictwaPrgWokolPunktu(
  lat: number,
  lon: number,
  radiusM: number,
): Promise<NadlesnictwaPrgResult> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { ok: false, reason: "Nieprawidłowe współrzędne.", retryable: false };
  }

  const wfsUrl = env("GEOPORTAL_PRG_INSTITUTIONAL_WFS_URL") ?? DEFAULT_WFS_URL;
  const wfsVersion = env("GEOPORTAL_PRG_INSTITUTIONAL_WFS_VERSION") ?? "1.1.0";
  const typeName = env("GEOPORTAL_PRG_LAYER_NADLESNICTWO") ?? WARSTWA_NADLESNICTWO;
  const promien = Math.max(5000, Math.min(120_000, radiusM));

  const wfs = await pobierzWfsFeatureCollection({
    wfsUrl,
    wfsVersion,
    typeName,
    bbox: bboxWokolPunktu(lat, lon, promien),
    maxFeatures: 80,
    timeoutMs: 40_000,
  });

  if (!wfs.ok) {
    return { ok: false, reason: wfs.reason, retryable: wfs.retryable };
  }

  const obrysy: ObrysNadlesnictwaPrg[] = [];
  for (const f of wfs.collection.features) {
    if (!jestPoligon(f.geometry)) continue;
    const extId = featureExternalId(f);
    const name =
      propStr(f.properties, ["name", "NAZWA", "nazwa", "JPT_NAZWA_", "JPT_NAZWA1"]) ??
      "Nadleśnictwo";
    obrysy.push({
      id: extId ?? `nadl-${obrysy.length}`,
      name,
      geojson: f.geometry,
    });
  }

  return { ok: true, obrysy, featureCount: obrysy.length };
}
