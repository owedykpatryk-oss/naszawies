import type { SupabaseClient } from "@supabase/supabase-js";
import { parsujPlanCmentarza, type PlanCmentarzaJson } from "@/lib/cmentarz/plan-cmentarza";
import { urlPodkladuOrtofoto } from "@/lib/cmentarz/overpass-cmentarz-obrys";

export type RekordGrobuPubliczny = {
  id: string;
  nazwisko: string;
  imie: string | null;
  kwatera: string | null;
  rzad: string | null;
  numer_gravu: string | null;
  rok_urodzenia: number | null;
  rok_smierci: number | null;
  notatka: string | null;
  plan_element_id: string | null;
};

export type PlanCmentarzaPubliczny = {
  id: string;
  name: string;
  plan_data: PlanCmentarzaJson;
  boundary_geojson: unknown;
  orthophoto_enabled: boolean;
  virtual_candles_enabled: boolean;
  podkladUrl: string | null;
  groby: RekordGrobuPubliczny[];
  liczbaZniczy: number;
};

export async function pobierzPlanCmentarzaPubliczny(
  supabase: SupabaseClient,
  villageId: string,
): Promise<PlanCmentarzaPubliczny | null> {
  const { data: plan } = await supabase
    .from("village_cemetery_plans")
    .select("id, name, plan_data, boundary_geojson, orthophoto_enabled, virtual_candles_enabled, is_published")
    .eq("village_id", villageId)
    .eq("is_published", true)
    .maybeSingle();

  if (!plan) return null;

  const { data: groby } = await supabase
    .from("cemetery_grave_records")
    .select("id, nazwisko, imie, kwatera, rzad, numer_gravu, rok_urodzenia, rok_smierci, notatka, plan_element_id")
    .eq("cemetery_plan_id", plan.id)
    .eq("status", "approved")
    .order("nazwisko", { ascending: true })
    .limit(2000);

  const { count } = await supabase
    .from("cemetery_virtual_candles")
    .select("id", { count: "exact", head: true })
    .eq("cemetery_plan_id", plan.id);

  let podkladUrl: string | null = null;
  if (plan.orthophoto_enabled && plan.boundary_geojson) {
    const gj = plan.boundary_geojson as GeoJSON.Polygon | GeoJSON.MultiPolygon;
    const ring = gj.type === "Polygon" ? gj.coordinates[0] : gj.coordinates[0]?.[0];
    if (ring?.length) {
      let sumLat = 0;
      let sumLon = 0;
      const n = ring.length - 1;
      for (let i = 0; i < n; i++) {
        sumLon += ring[i]![0];
        sumLat += ring[i]![1];
      }
      podkladUrl = urlPodkladuOrtofoto(sumLat / n, sumLon / n);
    }
  }

  return {
    id: plan.id,
    name: plan.name,
    plan_data: parsujPlanCmentarza(plan.plan_data),
    boundary_geojson: plan.boundary_geojson,
    orthophoto_enabled: plan.orthophoto_enabled,
    virtual_candles_enabled: plan.virtual_candles_enabled,
    podkladUrl,
    groby: (groby ?? []) as RekordGrobuPubliczny[],
    liczbaZniczy: count ?? 0,
  };
}

export function filtrujGroby(
  groby: RekordGrobuPubliczny[],
  q: string,
): RekordGrobuPubliczny[] {
  const s = q.trim().toLowerCase();
  if (!s) return groby;
  return groby.filter((g) => {
    const blob = [
      g.nazwisko,
      g.imie,
      g.kwatera,
      g.rzad,
      g.numer_gravu,
      g.rok_urodzenia?.toString(),
      g.rok_smierci?.toString(),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return blob.includes(s);
  });
}
