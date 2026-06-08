import { featureExternalId, propStr } from "@/lib/geoportal/geojson-utils";
import { pobierzWfsFeatureCollection } from "@/lib/geoportal/wfs-get-feature";

export type ObrysObwoduLowieckiego = {
  id: string;
  name: string;
  numer: string | null;
  dzierzawca: string | null;
  typ: string | null;
  geojson: unknown;
};

export type ObwodyLowieckieWfsResult =
  | { ok: true; obrysy: ObrysObwoduLowieckiego[]; featureCount: number; wojSlug: string | null }
  | { ok: false; reason: string; retryable: boolean };

const DEFAULT_WFS_URL = "https://gis.openforestdata.pl/geoserver/ows";

/** Slug województwa (jak w URL mapy) → warstwa WFS OpenForestData. */
const WARSTWA_PO_WOJ_SLUG: Record<string, string> = {
  dolnoslaskie: "geonode:obwody_lowieckie_dolnoslaskie_wgs84",
  "kujawsko-pomorskie": "geonode:obwody_lowieckie_kuj_pom_wgs84",
  lubelskie: "geonode:obwody_lowieckie_lubelskie_wgs84",
  lubuskie: "geonode:obwody_lowieckie_lubuskie_wgs84",
  lodzkie: "geonode:obwody_lowieckie_lodzkie_wgs84",
  malopolskie: "geonode:obwody_lowieckie_malopolskie_wgs84",
  mazowieckie: "geonode:obwody_lowieckie_mazowieckie_wgs84",
  opolskie: "geonode:obwody_lowieckie_opolskie_wgs84",
  podkarpackie: "geonode:obwody_lowieckie_podkarpackie_wgs84",
  podlaskie: "geonode:obwody_lowieckie_podlaskie_wgs84",
  pomorskie: "geonode:obwody_lowieckie_pomorskie_wgs84",
  slaskie: "geonode:obwody_lowieckie_slaskie_wgs84",
  swietokrzyskie: "geonode:obwody_lowieckie_swietokrzyskie_wgs84",
  "warminsko-mazurskie": "geonode:obwody_lowieckie_warm_mazurskie_wgs84",
  wielkopolskie: "geonode:obwody_lowieckie_wielkopolskie_wgs84",
  "zachodniopomorskie": "geonode:obwody_lowieckie_zach_pom_wgs84",
};

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

export function warstwaObwodowLowieckichDlaWoj(slug: string | null | undefined): string | null {
  if (!slug) return null;
  return WARSTWA_PO_WOJ_SLUG[slug] ?? null;
}

/** Urzędowe granice obwodów łowieckich (OpenForestData, CC0) w promieniu od punktu. */
export async function pobierzObwodyLowieckieWokolPunktu(
  lat: number,
  lon: number,
  radiusM: number,
  wojSlug: string | null,
): Promise<ObwodyLowieckieWfsResult> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { ok: false, reason: "Nieprawidłowe współrzędne.", retryable: false };
  }

  const typeName = warstwaObwodowLowieckichDlaWoj(wojSlug);
  if (!typeName) {
    return {
      ok: false,
      reason: "Nie rozpoznano województwa dla warstwy obwodów łowieckich.",
      retryable: false,
    };
  }

  const wfsUrl = env("OPENFORESTDATA_WFS_URL") ?? DEFAULT_WFS_URL;
  const wfsVersion = env("OPENFORESTDATA_WFS_VERSION") ?? "1.1.0";
  const promien = Math.max(8000, Math.min(100_000, radiusM));

  const wfs = await pobierzWfsFeatureCollection({
    wfsUrl,
    wfsVersion,
    typeName,
    bbox: bboxWokolPunktu(lat, lon, promien),
    maxFeatures: 120,
    timeoutMs: 50_000,
  });

  if (!wfs.ok) {
    return { ok: false, reason: wfs.reason, retryable: wfs.retryable };
  }

  const obrysy: ObrysObwoduLowieckiego[] = [];
  for (const f of wfs.collection.features) {
    if (!jestPoligon(f.geometry)) continue;
    const extId = featureExternalId(f);
    const numer =
      propStr(f.properties, ["NR_OBWODU", "Numer_", "numer", "NUMER"]) ??
      (typeof f.properties?.NR_OBWODU === "number" ? String(f.properties.NR_OBWODU) : null);
    const dzierzawca = propStr(f.properties, ["DZIERZAWCA", "dzierzawca"]);
    const typ = propStr(f.properties, ["TYP_OBWODU", "typ_obwodu"]);
    const name = numer ? `Obwód nr ${numer}` : "Obwód łowiecki";
    obrysy.push({
      id: extId ?? `obw-${obrysy.length}`,
      name,
      numer,
      dzierzawca,
      typ,
      geojson: f.geometry,
    });
  }

  return { ok: true, obrysy, featureCount: obrysy.length, wojSlug };
}
