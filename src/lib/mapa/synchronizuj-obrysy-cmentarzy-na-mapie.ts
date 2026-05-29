import type { SupabaseClient } from "@supabase/supabase-js";
import { pobierzObrysyCmentarzyZOsm } from "@/lib/cmentarz/overpass-cmentarz-obrys";
import { szablonPlanuCmentarzaStartowy } from "@/lib/cmentarz/plan-cmentarza";

type VillageRow = {
  id: string;
  name: string;
  latitude: number | string | null;
  longitude: number | string | null;
  population: number | null;
};

export type SyncObrysyCmentarzySummary = {
  scannedPlans: number;
  processedPlans: number;
  updatedBoundaries: number;
  createdPlans: number;
  addedPoi: number;
  errors: string[];
};

function promienDlaWsi(population: number | null): number {
  if (!population || population <= 0) return 3500;
  return Math.min(6000, Math.max(2000, 1600 + Math.sqrt(population) * 40));
}

function odlegloscMetry(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function synchronizujObrysyCmentarzyNaMapie(
  supabase: SupabaseClient,
  opts?: { maxPerRun?: number },
): Promise<SyncObrysyCmentarzySummary> {
  const maxPerRun = Math.max(1, opts?.maxPerRun ?? 4);
  const summary: SyncObrysyCmentarzySummary = {
    scannedPlans: 0,
    processedPlans: 0,
    updatedBoundaries: 0,
    createdPlans: 0,
    addedPoi: 0,
    errors: [],
  };

  const { data: wsieZCmentarzem } = await supabase
    .from("pois")
    .select("village_id")
    .eq("category", "cmentarz");
  const villageIdsZCmentarzem = Array.from(new Set((wsieZCmentarzem ?? []).map((r) => r.village_id as string)));

  const { data: plany } = await supabase
    .from("village_cemetery_plans")
    .select("id, village_id, boundary_geojson, villages(id, name, latitude, longitude, population)")
    .is("boundary_geojson", null)
    .limit(maxPerRun * 3);

  type PlanRow = {
    id: string;
    village_id: string;
    boundary_geojson: unknown;
    villages: VillageRow | VillageRow[] | null;
  };

  const kandydaci: { planId: string; village: VillageRow }[] = [];
  for (const p of (plany ?? []) as PlanRow[]) {
    const v = Array.isArray(p.villages) ? p.villages[0] : p.villages;
    if (!v) continue;
    const lat = Number(v.latitude);
    const lon = Number(v.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    kandydaci.push({ planId: p.id, village: v });
  }
  summary.scannedPlans = kandydaci.length;

  for (const { planId, village } of kandydaci.slice(0, maxPerRun)) {
    const lat = Number(village.latitude);
    const lon = Number(village.longitude);
    const osm = await pobierzObrysyCmentarzyZOsm(lat, lon, promienDlaWsi(village.population));
    if (!osm.ok) {
      summary.errors.push(`${village.name}: ${osm.blad}`);
      continue;
    }
    if (!osm.obrysy.length) continue;

    const pierwszy = osm.obrysy[0]!;
    const { error } = await supabase
      .from("village_cemetery_plans")
      .update({ boundary_geojson: pierwszy.geojson, name: pierwszy.name })
      .eq("id", planId);
    if (error) {
      summary.errors.push(`${village.name}: zapis obrysu — ${error.message}`);
      continue;
    }
    summary.processedPlans += 1;
    summary.updatedBoundaries += 1;
  }

  const { data: wszystkiePlanyIds } = await supabase
    .from("village_cemetery_plans")
    .select("village_id")
    .in("village_id", villageIdsZCmentarzem.length ? villageIdsZCmentarzem : ["00000000-0000-0000-0000-000000000000"]);
  const maPlanSet = new Set((wszystkiePlanyIds ?? []).map((p) => p.village_id as string));
  const brakPlanu2 = villageIdsZCmentarzem.filter((vid) => !maPlanSet.has(vid));

  if (brakPlanu2.length > 0 && summary.processedPlans < maxPerRun) {
    const { data: wsie } = await supabase
      .from("villages")
      .select("id, name, latitude, longitude, population")
      .in("id", brakPlanu2.slice(0, 2));
    for (const w of (wsie ?? []) as VillageRow[]) {
      const lat = Number(w.latitude);
      const lon = Number(w.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

      const { data: istnieje } = await supabase
        .from("village_cemetery_plans")
        .select("id")
        .eq("village_id", w.id)
        .maybeSingle();
      if (istnieje) continue;

      const osm = await pobierzObrysyCmentarzyZOsm(lat, lon, promienDlaWsi(w.population));
      const obrys = osm.ok && osm.obrysy[0] ? osm.obrysy[0] : null;

      const { error: insErr } = await supabase.from("village_cemetery_plans").insert({
        village_id: w.id,
        name: obrys?.name ?? `Cmentarz — ${w.name}`,
        boundary_geojson: obrys?.geojson ?? null,
        plan_data: szablonPlanuCmentarzaStartowy(),
        gate_slug: `cmentarz-${w.id.slice(0, 8)}`,
        is_published: false,
      });
      if (!insErr) {
        summary.createdPlans += 1;
        if (obrys) summary.updatedBoundaries += 1;
      }
    }
  }

  const { data: wsieBezCmentarza } = await supabase
    .from("villages")
    .select("id, name, latitude, longitude, population")
    .eq("is_active", true)
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .order("updated_at", { ascending: true })
    .limit(15);

  for (const w of (wsieBezCmentarza ?? []) as VillageRow[]) {
    if (summary.addedPoi >= 3) break;
    const lat = Number(w.latitude);
    const lon = Number(w.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    const { count } = await supabase
      .from("pois")
      .select("id", { count: "exact", head: true })
      .eq("village_id", w.id)
      .eq("category", "cmentarz");
    if ((count ?? 0) > 0) continue;

    const osm = await pobierzObrysyCmentarzyZOsm(lat, lon, promienDlaWsi(w.population));
    if (!osm.ok || !osm.obrysy.length) continue;
    const c = osm.obrysy[0]!;

    const { data: pois } = await supabase
      .from("pois")
      .select("category, latitude, longitude")
      .eq("village_id", w.id);
    const zaBlisko = (pois ?? []).some((p) => {
      if (p.category !== "cmentarz") return false;
      const plat = Number(p.latitude);
      const plon = Number(p.longitude);
      if (!Number.isFinite(plat) || !Number.isFinite(plon)) return false;
      return odlegloscMetry(plat, plon, c.centroidLat, c.centroidLng) < 150;
    });
    if (zaBlisko) continue;

    const { error: poiErr } = await supabase.from("pois").insert({
      village_id: w.id,
      category: "cmentarz",
      name: c.name,
      description: `AUTO_OSM_SYNC cemetery polygon (way/relation). Zweryfikuj lokalnie.`,
      latitude: c.centroidLat,
      longitude: c.centroidLng,
      source: "osm_auto",
      confidence: 0.5,
      is_local_override: false,
    });
    if (!poiErr) summary.addedPoi += 1;
  }

  return summary;
}
