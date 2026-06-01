import type { ZnacznikPoi } from "@/components/mapa/mapa-wsi-leaflet";

export type WierszPoiMapy = {
  id: string;
  village_id: string;
  category: string;
  name: string;
  description: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  source: string | null;
  confidence: number | string | null;
  verified_at: string | null;
  is_local_override: boolean | null;
  phone: string | null;
  opening_hours: unknown;
  linked_entity_id: string | null;
  osp_water_source_type: string | null;
  osp_water_capacity_lpm: number | null;
  osp_winter_access: boolean | null;
  osp_heavy_truck_access: boolean | null;
  osp_note: string | null;
  photo_url: string | null;
  photo_caption: string | null;
  investment_status: string | null;
  planned_completion_at: string | null;
  document_url: string | null;
};

const KATEGORIE_WYMAGAJACE_WERYFIKACJI = new Set(["szkola", "kosciol"]);

function doLiczby(v: string | number | null | undefined): number {
  if (v == null) return NaN;
  return typeof v === "number" ? v : Number.parseFloat(String(v));
}

export function czyPoiPubliczny(r: WierszPoiMapy): boolean {
  const kat = r.category.trim().toLowerCase();
  if (!KATEGORIE_WYMAGAJACE_WERYFIKACJI.has(kat)) return true;
  if (r.is_local_override === true) return true;
  if (
    r.source === "manual" ||
    r.source === "local_corrected" ||
    r.source === "osm_manual" ||
    r.source === "osm_auto"
  )
    return true;
  if (r.verified_at) return true;
  const confidence = r.confidence != null ? Number(r.confidence) : 0;
  return Number.isFinite(confidence) && confidence >= 0.8;
}

export const POLE_SELECT_POI_MAPY =
  "id, village_id, category, name, description, latitude, longitude, source, confidence, verified_at, is_local_override, phone, opening_hours, linked_entity_id, osp_water_source_type, osp_water_capacity_lpm, osp_winter_access, osp_heavy_truck_access, osp_note, photo_url, photo_caption, investment_status, planned_completion_at, document_url";

export function mapujPoiDlaMapy(
  wiersze: WierszPoiMapy[] | null,
  wiesPoId: Map<string, { name: string; sciezka: string }>,
): ZnacznikPoi[] {
  if (!wiersze?.length) return [];
  const out: ZnacznikPoi[] = [];
  for (const r of wiersze) {
    if (!czyPoiPubliczny(r)) continue;
    const w = wiesPoId.get(r.village_id);
    if (!w) continue;
    const lat = doLiczby(r.latitude);
    const lon = doLiczby(r.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lon)) continue;
    out.push({
      id: r.id,
      villageId: r.village_id,
      villageName: w.name,
      sciezkaWsi: w.sciezka,
      category: r.category,
      name: r.name,
      description: r.description,
      lat,
      lon,
      phone: r.phone,
      openingHours: r.opening_hours,
      linkedEntityId: r.linked_entity_id,
      ospWaterSourceType: r.osp_water_source_type,
      ospWaterCapacityLpm: r.osp_water_capacity_lpm,
      ospWinterAccess: r.osp_winter_access,
      ospHeavyTruckAccess: r.osp_heavy_truck_access,
      ospNote: r.osp_note,
      photoUrl: r.photo_url,
      photoCaption: r.photo_caption,
      investmentStatus: r.investment_status,
      plannedCompletionAt: r.planned_completion_at,
      documentUrl: r.document_url,
    });
  }
  return out;
}
