import type { SupabaseClient } from "@supabase/supabase-js";
import { czyRodzajOstrzezeniaLesnego } from "@/lib/lesnictwo/kategorie-ostrzezen";

export type OstrzezenieLesne = {
  id: string;
  noticeKind: string;
  title: string;
  areaDescription: string;
  safetyNote: string | null;
  contactPhone: string | null;
  contactName: string | null;
  startsAt: string;
  endsAt: string;
  maObszarMapy: boolean;
};

export async function pobierzAktywneOstrzezeniaLesne(
  supabase: SupabaseClient,
  villageId: string,
): Promise<OstrzezenieLesne[]> {
  const teraz = new Date().toISOString();
  const { data } = await supabase
    .from("village_forestry_notices")
    .select(
      "id, notice_kind, title, area_description, safety_note, contact_phone, contact_name, starts_at, ends_at, area_geojson",
    )
    .eq("village_id", villageId)
    .eq("status", "approved")
    .gte("ends_at", teraz)
    .order("starts_at", { ascending: true });

  return (data ?? []).map((r) => {
    const row = r as typeof r & { area_geojson?: unknown | null };
    const kind = String(row.notice_kind ?? "inne");
    return {
      id: row.id as string,
      noticeKind: czyRodzajOstrzezeniaLesnego(kind) ? kind : "inne",
      title: row.title as string,
      areaDescription: row.area_description as string,
      safetyNote: (row.safety_note as string | null) ?? null,
      contactPhone: (row.contact_phone as string | null) ?? null,
      contactName: (row.contact_name as string | null) ?? null,
      startsAt: row.starts_at as string,
      endsAt: row.ends_at as string,
      maObszarMapy: row.area_geojson != null,
    };
  });
}
