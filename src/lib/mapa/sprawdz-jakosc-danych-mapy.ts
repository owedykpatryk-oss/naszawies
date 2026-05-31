import type { SupabaseClient } from "@supabase/supabase-js";
import { obliczKompletnoscMapyWsi } from "@/lib/mapa/oblicz-kompletnosc-mapy-wsi";

type VillageRow = {
  id: string;
  name: string;
  soltys_user_id: string | null;
  boundary_geojson: unknown | null;
  latitude: number | string | null;
  longitude: number | string | null;
};

export type GeoDataQualitySummary = {
  scannedVillages: number;
  openedAlerts: number;
  resolvedAlerts: number;
  errors: string[];
};

type AlertCode = "no_addresses" | "no_poi" | "unverified_poi" | "low_map_completeness";

async function otworzAlertJesliBrak(
  supabase: SupabaseClient,
  args: {
    village: VillageRow;
    code: AlertCode;
    severity: "warning" | "critical";
    details: Record<string, unknown>;
    title: string;
    body: string;
  },
): Promise<boolean> {
  const { data: istnieje } = await supabase
    .from("geo_data_quality_alerts")
    .select("id")
    .eq("village_id", args.village.id)
    .eq("alert_code", args.code)
    .eq("status", "open")
    .maybeSingle();
  if (istnieje) return false;

  const { error } = await supabase.from("geo_data_quality_alerts").insert({
    village_id: args.village.id,
    alert_code: args.code,
    severity: args.severity,
    status: "open",
    details: args.details,
  });
  if (error) throw new Error(error.message);

  if (args.village.soltys_user_id) {
    await supabase.from("notifications").insert({
      user_id: args.village.soltys_user_id,
      type: "geo_quality_alert",
      title: args.title,
      body: args.body,
      link_url: "/panel/soltys/moja-wies",
      related_id: args.village.id,
      related_type: "village",
      channel: "in_app",
    });
  }
  return true;
}

async function zamknijAlertJesliOtwarty(
  supabase: SupabaseClient,
  villageId: string,
  code: AlertCode,
): Promise<boolean> {
  const { data: openRow } = await supabase
    .from("geo_data_quality_alerts")
    .select("id")
    .eq("village_id", villageId)
    .eq("alert_code", code)
    .eq("status", "open")
    .maybeSingle();
  if (!openRow) return false;

  const { error } = await supabase
    .from("geo_data_quality_alerts")
    .update({
      status: "resolved",
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", openRow.id);
  if (error) throw new Error(error.message);
  return true;
}

function liczbaNiezweryfikowanych(
  pois: { source: string | null; verified_at: string | null; is_local_override: boolean | null }[],
): number {
  return pois.filter((p) => {
    const src = (p.source ?? "").trim();
    return (
      (src === "osm_auto" || src === "geoportal") &&
      !p.verified_at &&
      p.is_local_override !== true
    );
  }).length;
}

export async function sprawdzJakoscDanychMapy(
  supabase: SupabaseClient,
): Promise<GeoDataQualitySummary> {
  const summary: GeoDataQualitySummary = {
    scannedVillages: 0,
    openedAlerts: 0,
    resolvedAlerts: 0,
    errors: [],
  };

  const maxVillages = Math.max(10, Number.parseInt(process.env.GEO_QUALITY_CHECK_VILLAGES ?? "", 10) || 150);
  const { data: wsie, error: wErr } = await supabase
    .from("villages")
    .select("id, name, soltys_user_id, boundary_geojson, latitude, longitude")
    .eq("is_active", true)
    .limit(maxVillages);
  if (wErr) throw new Error(`Geo quality: villages: ${wErr.message}`);

  const villages = (wsie ?? []) as VillageRow[];
  summary.scannedVillages = villages.length;
  if (villages.length === 0) return summary;
  const villageIds = villages.map((v) => v.id);

  const [{ data: addrCounts, error: aErr }, { data: poiRows, error: pErr }, { data: propRows, error: prErr }] =
    await Promise.all([
      supabase.from("address_points").select("village_id, id").in("village_id", villageIds),
      supabase
        .from("pois")
        .select("village_id, id, category, source, verified_at, is_local_override")
        .in("village_id", villageIds),
      supabase
        .from("poi_proposals")
        .select("village_id, id")
        .in("village_id", villageIds)
        .eq("status", "pending"),
    ]);
  if (aErr) throw new Error(`Geo quality: address points: ${aErr.message}`);
  if (pErr) throw new Error(`Geo quality: pois: ${pErr.message}`);
  if (prErr) throw new Error(`Geo quality: poi proposals: ${prErr.message}`);

  const mapAddr = new Map<string, number>();
  const mapPoi = new Map<string, number>();
  const mapKategorie = new Map<string, string[]>();
  const mapPoiMeta = new Map<string, { source: string | null; verified_at: string | null; is_local_override: boolean | null }[]>();
  const mapPropozycje = new Map<string, number>();

  for (const id of villageIds) {
    mapAddr.set(id, 0);
    mapPoi.set(id, 0);
    mapKategorie.set(id, []);
    mapPoiMeta.set(id, []);
    mapPropozycje.set(id, 0);
  }

  for (const r of (addrCounts ?? []) as { village_id: string }[]) {
    mapAddr.set(r.village_id, (mapAddr.get(r.village_id) ?? 0) + 1);
  }

  for (const r of (poiRows ?? []) as {
    village_id: string;
    category: string;
    source: string | null;
    verified_at: string | null;
    is_local_override: boolean | null;
  }[]) {
    mapPoi.set(r.village_id, (mapPoi.get(r.village_id) ?? 0) + 1);
    const kat = mapKategorie.get(r.village_id) ?? [];
    kat.push(r.category);
    mapKategorie.set(r.village_id, kat);
    const meta = mapPoiMeta.get(r.village_id) ?? [];
    meta.push({
      source: r.source,
      verified_at: r.verified_at,
      is_local_override: r.is_local_override,
    });
    mapPoiMeta.set(r.village_id, meta);
  }

  for (const r of (propRows ?? []) as { village_id: string }[]) {
    mapPropozycje.set(r.village_id, (mapPropozycje.get(r.village_id) ?? 0) + 1);
  }

  for (const v of villages) {
    try {
      const aCount = mapAddr.get(v.id) ?? 0;
      const pCount = mapPoi.get(v.id) ?? 0;
      const niezweryfikowane = liczbaNiezweryfikowanych(mapPoiMeta.get(v.id) ?? []);
      const oczekujacePropozycje = mapPropozycje.get(v.id) ?? 0;

      const lat = v.latitude != null ? Number(v.latitude) : null;
      const lon = v.longitude != null ? Number(v.longitude) : null;
      const kompletnosc = obliczKompletnoscMapyWsi({
        boundary_geojson: v.boundary_geojson,
        latitude: lat,
        longitude: lon,
        kategoriePoi: mapKategorie.get(v.id) ?? [],
        doWeryfikacji: niezweryfikowane,
        oczekujacePropozycje,
      });

      if (aCount === 0) {
        const opened = await otworzAlertJesliBrak(supabase, {
          village: v,
          code: "no_addresses",
          severity: "critical",
          details: { address_points: 0 },
          title: "Brak punktów adresowych na mapie",
          body: `Wieś ${v.name} nie ma jeszcze punktów adresowych po syncu KIN/PRG.`,
        });
        if (opened) summary.openedAlerts += 1;
      } else {
        const resolved = await zamknijAlertJesliOtwarty(supabase, v.id, "no_addresses");
        if (resolved) summary.resolvedAlerts += 1;
      }

      if (pCount === 0) {
        const opened = await otworzAlertJesliBrak(supabase, {
          village: v,
          code: "no_poi",
          severity: "warning",
          details: { pois: 0 },
          title: "Brak POI na mapie wsi",
          body: `Wieś ${v.name} nie ma jeszcze punktów POI po synchronizacji danych.`,
        });
        if (opened) summary.openedAlerts += 1;
      } else {
        const resolved = await zamknijAlertJesliOtwarty(supabase, v.id, "no_poi");
        if (resolved) summary.resolvedAlerts += 1;
      }

      if (niezweryfikowane >= 3) {
        const opened = await otworzAlertJesliBrak(supabase, {
          village: v,
          code: "unverified_poi",
          severity: "warning",
          details: { unverified: niezweryfikowane },
          title: "Punkty mapy czekają na weryfikację",
          body: `Wieś ${v.name}: ${niezweryfikowane} punktów z OSM/Geoportal wymaga zatwierdzenia w panelu Moja wieś.`,
        });
        if (opened) summary.openedAlerts += 1;
      } else {
        const resolved = await zamknijAlertJesliOtwarty(supabase, v.id, "unverified_poi");
        if (resolved) summary.resolvedAlerts += 1;
      }

      if (kompletnosc.procent < 45 && pCount > 0) {
        const opened = await otworzAlertJesliBrak(supabase, {
          village: v,
          code: "low_map_completeness",
          severity: "warning",
          details: {
            procent: kompletnosc.procent,
            brakujace: kompletnosc.brakujace.map((b) => b.klucz),
          },
          title: "Niska kompletność mapy wsi",
          body: `Mapa ${v.name} jest uzupełniona w ${kompletnosc.procent}% — brakuje kluczowych kategorii POI.`,
        });
        if (opened) summary.openedAlerts += 1;
      } else {
        const resolved = await zamknijAlertJesliOtwarty(supabase, v.id, "low_map_completeness");
        if (resolved) summary.resolvedAlerts += 1;
      }
    } catch (e) {
      summary.errors.push(`${v.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return summary;
}
