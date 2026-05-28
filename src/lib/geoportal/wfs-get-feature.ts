import { featureCollectionFromGml } from "@/lib/geoportal/wfs-gml-to-geojson";
import type { GeoJsonFeatureCollection } from "@/lib/geoportal/geojson-utils";

const FORMATY_WFS = ["GML2", "application/json"] as const;

export function normalizujWfsTypeName(typeName: string): string {
  const t = typeName.trim();
  if (!t) return t;
  const idx = t.indexOf(":");
  return idx >= 0 ? t.slice(idx + 1) : t;
}

export type WfsGetFeatureParams = {
  wfsUrl: string;
  wfsVersion?: string;
  typeName: string;
  bbox?: string;
  cqlFilter?: string;
  maxFeatures?: number;
  timeoutMs?: number;
};

export type WfsGetFeatureResult =
  | { ok: true; collection: GeoJsonFeatureCollection; format: string }
  | { ok: false; reason: string; retryable: boolean };

function komunikatWfsException(text: string): string | null {
  const m = text.match(/<ows:ExceptionText[^>]*>([^<]+)<\/ows:ExceptionText>/i);
  if (m?.[1]) return m[1].trim();
  if (text.includes("ExceptionReport") || text.includes("ServiceException")) {
    return "WFS zwrócił błąd usługi (ExceptionReport).";
  }
  return null;
}

function parsujOdpowiedz(text: string, contentType: string): GeoJsonFeatureCollection | null {
  if (komunikatWfsException(text)) return null;
  if (contentType.includes("json") || text.trimStart().startsWith("{")) {
    try {
      const json = JSON.parse(text) as unknown;
      const fc = json as GeoJsonFeatureCollection;
      if (fc?.type === "FeatureCollection" && Array.isArray(fc.features)) return fc;
    } catch {
      return null;
    }
    return null;
  }
  return featureCollectionFromGml(text);
}

export async function pobierzWfsFeatureCollection(
  params: WfsGetFeatureParams,
): Promise<WfsGetFeatureResult> {
  const wfsVersion = params.wfsVersion ?? "1.1.0";
  const typeName = normalizujWfsTypeName(params.typeName);
  const maxFeatures = params.maxFeatures ?? 300;
  const timeoutMs = params.timeoutMs ?? 45_000;
  const bledy: string[] = [];

  for (const format of FORMATY_WFS) {
    const q = new URLSearchParams({
      SERVICE: "WFS",
      VERSION: wfsVersion,
      REQUEST: "GetFeature",
      SRSNAME: "EPSG:4326",
      outputFormat: format,
    });
    if (wfsVersion.startsWith("1.")) {
      q.set("TYPENAME", typeName);
      q.set("MAXFEATURES", String(maxFeatures));
    } else {
      q.set("TYPENAMES", typeName);
      q.set("COUNT", String(maxFeatures));
    }
    if (params.bbox) q.set("BBOX", params.bbox);
    if (params.cqlFilter) q.set("CQL_FILTER", params.cqlFilter);

    let res: Response;
    try {
      res = await fetch(`${params.wfsUrl}?${q.toString()}`, {
        method: "GET",
        cache: "no-store",
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          Accept: "application/json, application/geo+json, text/xml, application/gml+xml",
          "User-Agent": "NaszawiesPl/1.0 (+https://naszawies.pl/)",
        },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      bledy.push(`${format}: ${msg}`);
      continue;
    }

    if (!res.ok) {
      bledy.push(`${format}: HTTP ${res.status}`);
      continue;
    }

    const text = await res.text();
    if (!text.trim()) {
      bledy.push(`${format}: pusta odpowiedź`);
      continue;
    }

    const contentType = res.headers.get("content-type") ?? "";
    const wfsExc = komunikatWfsException(text);
    if (wfsExc) {
      bledy.push(`${format}: ${wfsExc}`);
      continue;
    }

    const collection = parsujOdpowiedz(text, contentType);
    if (collection) {
      return { ok: true, collection, format };
    }
    bledy.push(`${format}: nieznany format`);
  }

  return {
    ok: false,
    reason: bledy[0] ?? "WFS nie zwrócił danych.",
    retryable: bledy.some((b) => b.includes("HTTP 5") || b.includes("HTTP 429")),
  };
}
