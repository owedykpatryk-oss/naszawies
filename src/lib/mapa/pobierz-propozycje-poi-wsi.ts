import type { SupabaseClient } from "@supabase/supabase-js";

export type PropozycjaPoiDoReview = {
  id: string;
  village_id: string;
  category: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  created_at: string;
  proposed_by: string | null;
};

export async function pobierzPropozycjePoiWsi(
  supabase: SupabaseClient,
  villageIds: string[],
): Promise<Record<string, PropozycjaPoiDoReview[]>> {
  const wynik: Record<string, PropozycjaPoiDoReview[]> = {};
  for (const id of villageIds) wynik[id] = [];
  if (villageIds.length === 0) return wynik;

  const { data, error } = await supabase
    .from("poi_proposals")
    .select("id, village_id, category, name, description, latitude, longitude, created_at, proposed_by")
    .in("village_id", villageIds)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[pobierzPropozycjePoiWsi]", error.message);
    return wynik;
  }

  for (const row of data ?? []) {
    const lat = Number(row.latitude);
    const lon = Number(row.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const lista = wynik[row.village_id];
    if (!lista) continue;
    lista.push({
      id: row.id,
      village_id: row.village_id,
      category: row.category,
      name: row.name,
      description: row.description,
      latitude: lat,
      longitude: lon,
      created_at: row.created_at,
      proposed_by: row.proposed_by,
    });
  }

  return wynik;
}
