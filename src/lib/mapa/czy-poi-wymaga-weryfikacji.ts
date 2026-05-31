/** POI dodane automatycznie (OSM / Geoportal), jeszcze nie zatwierdzone przez sołtysa. */
export type WierszPoiWeryfikacji = {
  verified_at: string | null;
  is_local_override: boolean | null;
  source: string | null;
  confidence: number | string | null;
};

const ZRODLA_AUTOMATYCZNE = new Set(["osm_auto", "geoportal"]);

export function czyPoiWymagaWeryfikacjiSoltysa(r: WierszPoiWeryfikacji): boolean {
  if (r.is_local_override === true) return false;
  if (r.verified_at) return false;
  const src = (r.source ?? "").trim();
  if (ZRODLA_AUTOMATYCZNE.has(src)) return true;
  const confidence = r.confidence != null ? Number(r.confidence) : 0;
  return Number.isFinite(confidence) && confidence < 0.8;
}
