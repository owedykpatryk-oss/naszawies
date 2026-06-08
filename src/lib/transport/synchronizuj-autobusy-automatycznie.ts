import type { SupabaseClient } from "@supabase/supabase-js";
import { czyscStaryCacheTransportu } from "@/lib/transport/czysc-stare-odjazdy";
import { dopasujPoiPrzystanku } from "@/lib/transport/dopasuj-poi-przystanku";
import { epodroznikSkonfigurowany, pobierzOdjazdyEpodroznik } from "@/lib/transport/epodroznik-api";
import { utworzBrakujacePoiPrzystankowZGtfs } from "@/lib/transport/dodaj-poi-przystanki-z-gtfs";
import { gtfsCsvSkonfigurowany, pobierzOdjazdyGtfsDlaPunktu } from "@/lib/transport/gtfs-csv";

export type BusAutoSyncSummary = {
  enabled: boolean;
  villagesProcessed: number;
  departuresUpserted: number;
  przystankiPoiUtworzono: number;
  provider: "gtfs" | "epodroznik" | "none";
  errors: string[];
};

export type OpcjeSynchronizacjiAutobusow = {
  tylkoVillageIds?: string[];
};

function busSyncEnabled(): boolean {
  return String(process.env.TRANSPORT_BUS_SYNC_ENABLED ?? "0") === "1";
}

function provider(): "gtfs" | "epodroznik" | "none" {
  if (gtfsCsvSkonfigurowany()) return "gtfs";
  if (epodroznikSkonfigurowany()) return "epodroznik";
  return "none";
}

export async function synchronizujAutobusyAutomatycznie(
  supabase: SupabaseClient,
  opcje?: OpcjeSynchronizacjiAutobusow,
): Promise<BusAutoSyncSummary> {
  const summary: BusAutoSyncSummary = {
    enabled: busSyncEnabled(),
    villagesProcessed: 0,
    departuresUpserted: 0,
    przystankiPoiUtworzono: 0,
    provider: provider(),
    errors: [],
  };

  if (!summary.enabled || summary.provider === "none") return summary;

  if (opcje?.tylkoVillageIds?.length) {
    await czyscStaryCacheTransportu(supabase, opcje.tylkoVillageIds);
  }

  let zapytanieWsi = supabase
    .from("villages")
    .select("id, name, latitude, longitude")
    .eq("is_active", true)
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  if (opcje?.tylkoVillageIds?.length) {
    zapytanieWsi = zapytanieWsi.in("id", opcje.tylkoVillageIds);
  } else {
    zapytanieWsi = zapytanieWsi.order("updated_at", { ascending: true }).limit(40);
  }

  const { data: wsie, error } = await zapytanieWsi;

  if (error) {
    summary.errors.push(error.message);
    return summary;
  }

  const villageIds = (wsie ?? []).map((v) => v.id);
  const poisByVillage = new Map<string, { id: string; name: string; latitude: number | string | null; longitude: number | string | null }[]>();

  if (villageIds.length > 0) {
    const { data: pois } = await supabase
      .from("pois")
      .select("id, village_id, name, latitude, longitude")
      .in("village_id", villageIds)
      .eq("category", "przystanek");
    for (const p of pois ?? []) {
      const arr = poisByVillage.get(p.village_id) ?? [];
      arr.push(p);
      poisByVillage.set(p.village_id, arr);
    }
  }

  for (const v of wsie ?? []) {
    const lat = Number(v.latitude);
    const lon = Number(v.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    try {
      const przystanki = poisByVillage.get(v.id) ?? [];

      if (summary.provider === "gtfs") {
        const poiGtfs = await utworzBrakujacePoiPrzystankowZGtfs(supabase, {
          villageId: v.id,
          lat,
          lon,
          istniejace: przystanki,
        });
        summary.przystankiPoiUtworzono += poiGtfs.utworzono;
        if (poiGtfs.utworzono > 0) {
          const { data: nowe } = await supabase
            .from("pois")
            .select("id, village_id, name, latitude, longitude")
            .eq("village_id", v.id)
            .eq("category", "przystanek");
          poisByVillage.set(v.id, nowe ?? przystanki);
        }
      }

      let odjazdy: {
        departureUid: string;
        stopId: string;
        stopName: string;
        lineLabel: string;
        destination: string | null;
        plannedWhenIso: string;
      }[] = [];

      if (summary.provider === "gtfs") {
        const gtfs = await pobierzOdjazdyGtfsDlaPunktu({ lat, lon });
        odjazdy = gtfs.map((g) => ({
          departureUid: g.departureUid,
          stopId: g.stopId,
          stopName: g.stopName,
          lineLabel: g.lineLabel,
          destination: g.destination,
          plannedWhenIso: g.plannedWhenIso,
        }));
      } else {
        const ep = await pobierzOdjazdyEpodroznik({ lat, lon });
        odjazdy = ep.map((e) => ({
          departureUid: e.departureUid,
          stopId: e.stopId,
          stopName: e.stopName,
          lineLabel: e.lineLabel,
          destination: e.destination,
          plannedWhenIso: e.plannedWhenIso,
        }));
      }

      if (odjazdy.length === 0) continue;
      summary.villagesProcessed += 1;

      const przystankiPoSync = poisByVillage.get(v.id) ?? przystanki;
      const payload = odjazdy.map((d) => ({
        village_id: v.id,
        poi_id: dopasujPoiPrzystanku(przystankiPoSync, d.stopName, lat, lon),
        stop_id: d.stopId,
        stop_name: d.stopName,
        departure_uid: d.departureUid,
        line_label: d.lineLabel,
        destination: d.destination,
        planned_at: d.plannedWhenIso,
        provider: summary.provider,
        fetched_at: new Date().toISOString(),
      }));

      const { error: upErr } = await supabase
        .from("bus_departures_cache")
        .upsert(payload, { onConflict: "village_id,stop_id,departure_uid" });

      if (upErr) summary.errors.push(`${v.name}: ${upErr.message}`);
      else summary.departuresUpserted += payload.length;

      await supabase.from("transport_sync_state").upsert({
        village_id: v.id,
        last_bus_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      summary.errors.push(`${v.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (!opcje?.tylkoVillageIds?.length && villageIds.length > 0) {
    await czyscStaryCacheTransportu(supabase);
  }

  return summary;
}
