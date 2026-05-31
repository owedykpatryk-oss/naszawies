import type { SupabaseClient } from "@supabase/supabase-js";
import { czyPoiWymagaWeryfikacjiSoltysa } from "@/lib/mapa/czy-poi-wymaga-weryfikacji";

export type PoiDoWeryfikacji = {
  id: string;
  village_id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  source: string | null;
  description: string | null;
};

export async function pobierzPoiDoWeryfikacjiWsi(
  supabase: SupabaseClient,
  villageIds: string[],
): Promise<Record<string, PoiDoWeryfikacji[]>> {
  const wynik: Record<string, PoiDoWeryfikacji[]> = {};
  for (const id of villageIds) wynik[id] = [];
  if (villageIds.length === 0) return wynik;

  const { data, error } = await supabase
    .from("pois")
    .select(
      "id, village_id, name, category, latitude, longitude, source, description, verified_at, is_local_override, confidence",
    )
    .in("village_id", villageIds)
    .in("source", ["osm_auto", "geoportal"])
    .is("verified_at", null)
    .eq("is_local_override", false)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[pobierzPoiDoWeryfikacjiWsi]", error.message);
    return wynik;
  }

  for (const row of data ?? []) {
    if (!czyPoiWymagaWeryfikacjiSoltysa(row)) continue;
    const lat = Number(row.latitude);
    const lon = Number(row.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const lista = wynik[row.village_id];
    if (!lista) continue;
    lista.push({
      id: row.id,
      village_id: row.village_id,
      name: row.name,
      category: row.category,
      latitude: lat,
      longitude: lon,
      source: row.source,
      description: row.description,
    });
  }

  return wynik;
}
