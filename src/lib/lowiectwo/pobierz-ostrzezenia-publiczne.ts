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

  return (data ?? []).map((r) => ({
    id: r.id as string,
    title: r.title as string,
    areaDescription: r.area_description as string,
    safetyNote: (r.safety_note as string | null) ?? null,
    contactPhone: (r.contact_phone as string | null) ?? null,
    contactName: (r.contact_name as string | null) ?? null,
    startsAt: r.starts_at as string,
    endsAt: r.ends_at as string,
  }));
}
