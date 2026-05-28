import type { SupabaseClient } from "@supabase/supabase-js";

export type OstrzezenieLowieckie = {
  id: string;
  title: string;
  areaDescription: string;
  safetyNote: string | null;
  contactPhone: string | null;
  contactName: string | null;
  startsAt: string;
  endsAt: string;
  maObszarMapy: boolean;
};

export async function pobierzAktywneOstrzezeniaLowieckie(
  supabase: SupabaseClient,
  villageId: string,
): Promise<OstrzezenieLowieckie[]> {
  const teraz = new Date().toISOString();
  const { data } = await supabase
    .from("village_hunting_notices")
    .select("id, title, area_description, safety_note, contact_phone, contact_name, starts_at, ends_at")
    .eq("village_id", villageId)
    .eq("status", "approved")
    .gte("ends_at", teraz)
    .order("starts_at", { ascending: true });

  return (data ?? []).map((r) => {
    const row = r as typeof r & { area_geojson?: unknown | null };
    return {
      id: row.id as string,
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
