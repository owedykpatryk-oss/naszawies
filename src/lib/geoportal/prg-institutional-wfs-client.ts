import {
  centroidFromGeometry,
  featureExternalId,
  propStr,
  type GeoJsonFeatureCollection,
} from "@/lib/geoportal/geojson-utils";
import { pobierzWfsFeatureCollection } from "@/lib/geoportal/wfs-get-feature";

export type InstitutionalFeature = {
  layerName: string;
  sourceExternalId: string;
  featureName: string | null;
  featureCategory: string | null;
  latitude: number | null;
  longitude: number | null;
  geometry: unknown;
  rawPayload: Record<string, unknown> | null;
};

export type InstitutionalFetchResult =
  | {
      ok: true;
      features: InstitutionalFeature[];
      sourceName: string;
      sourceTypeName: string;
      featureCount: number;
      layerErrors: string[];
    }
  | {
      ok: false;
      reason: string;
      retryable: boolean;
    };

const DEFAULT_PRG_WFS_URL = "https://mapy.geoportal.gov.pl/wss/service/PZGIK/PRG/WFS/AdministrativeBoundaries";

/** Nazwy warstw z GetCapabilities usługi PRG AdministrativeBoundaries (bez szkół/poczty — ich tu nie ma). */
const DOMYSLNE_WARSTWY =
  "K07_Komenda_powiatowa_strazy_pozarnej,K06_Komenda_wojewodzka_strazy_pozarnej,K01_Komenda_wojewodzka_policji,K02_Komenda_powiatowa_policji,K04_Komenda_rejonowa_policji,K05_Komisariat_policji,P03_Prokuratura_rejonowa,U06_Nadlesnictwo,U07_Regionalna_dyrekcja_lasow_panstwowych,U02_Urzad_skarbowy,U08_Zarzad_zlewni_PGWWP,U09_Regionalny_zarzad_gospodarki_wodnej_PGWWP,S03_Sad_rejonowy,K13_Obszar_dzialania_szefa_obrony_cywilnej_gminy";

function env(name: string): string | null {
  const v = process.env[name]?.trim();
  return v && v.length > 0 ? v : null;
}

function makeBbox(lat: number, lon: number, radiusM: number): string {
  const dLat = radiusM / 111_320;
  const dLon = radiusM / (111_320 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
  return `${lon - dLon},${lat - dLat},${lon + dLon},${lat + dLat},EPSG:4326`;
}

async function fetchLayer(
  wfsUrl: string,
  wfsVersion: string,
  typeName: string,
  bbox: string,
): Promise<{ ok: true; features: InstitutionalFeature[]; count: number } | { ok: false; reason: string }> {
  const wfs = await pobierzWfsFeatureCollection({
    wfsUrl,
    wfsVersion,
    typeName,
    bbox,
    maxFeatures: 150,
    timeoutMs: 40_000,
  });

  if (!wfs.ok) {
    return { ok: false, reason: `${typeName}: ${wfs.reason}` };
  }

  const fc = wfs.collection as GeoJsonFeatureCollection;
  const out: InstitutionalFeature[] = [];
  for (const f of fc.features) {
    const extId = featureExternalId(f);
    const c = centroidFromGeometry(f.geometry);
    const nm = propStr(f.properties, ["name", "NAZWA", "nazwa", "JPT_NAZWA_", "JPT_NAZWA1"]);
    out.push({
      layerName: typeName,
      sourceExternalId: extId ?? `${typeName}:${out.length}`,
      featureName: nm,
      featureCategory: null,
      latitude: c?.lat ?? null,
      longitude: c?.lon ?? null,
      geometry: f.geometry,
      rawPayload: f.properties ?? null,
    });
  }

  return { ok: true, features: out, count: fc.features.length };
}

export async function pobierzWarstwyInstytucjonalnePrgWokolWsi(
  lat: number,
  lon: number,
  radiusM: number,
): Promise<InstitutionalFetchResult> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { ok: false, reason: "Nieprawidłowe współrzędne wejściowe.", retryable: false };
  }
  const typenamesRaw = env("GEOPORTAL_PRG_INSTITUTIONAL_TYPENAMES") ?? DOMYSLNE_WARSTWY;
  const typeNames = typenamesRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 24);
  if (typeNames.length === 0) {
    return { ok: false, reason: "Pusta lista warstw GEOPORTAL_PRG_INSTITUTIONAL_TYPENAMES.", retryable: false };
  }

  const wfsUrl = env("GEOPORTAL_PRG_INSTITUTIONAL_WFS_URL") ?? DEFAULT_PRG_WFS_URL;
  const wfsVersion = env("GEOPORTAL_PRG_INSTITUTIONAL_WFS_VERSION") ?? "1.1.0";
  const bbox = makeBbox(lat, lon, Math.max(2000, Math.min(35_000, radiusM)));

  const merged: InstitutionalFeature[] = [];
  const layerErrors: string[] = [];
  let sourceType = "";
  let count = 0;

  for (const tn of typeNames) {
    const one = await fetchLayer(wfsUrl, wfsVersion, tn, bbox);
    if (!one.ok) {
      layerErrors.push(one.reason);
      continue;
    }
    sourceType = sourceType ? `${sourceType},${tn}` : tn;
    count += one.count;
    merged.push(...one.features);
  }

  if (merged.length === 0 && layerErrors.length > 0) {
    return {
      ok: false,
      reason: layerErrors.slice(0, 3).join("; "),
      retryable: false,
    };
  }

  return {
    ok: true,
    features: merged,
    sourceName: wfsUrl,
    sourceTypeName: sourceType || typeNames.join(","),
    featureCount: count,
    layerErrors,
  };
}
