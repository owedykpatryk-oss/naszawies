import type { SupabaseClient } from "@supabase/supabase-js";
import { pobierzOdjazdyDlaStacjiPkp, wyszukajStacjePkpPoNazwie } from "@/lib/transport/pkp-plk-api";
import { wyslijWebPushDlaUzytkownika } from "@/lib/pwa/wyslij-web-push";

type VillageRow = {
  id: string;
  name: string;
  latitude: number | string | null;
  longitude: number | string | null;
};

type StationPoiRow = {
  id: string;
  village_id: string;
  name: string;
  latitude: number | string | null;
  longitude: number | string | null;
};

export type TransportAutoSyncSummary = {
  enabled: boolean;
  villagesProcessed: number;
  stationsObserved: number;
  departuresUpserted: number;
  statusGreen: number;
  statusOrange: number;
  statusRed: number;
  fallbackVillages: number;
  errors: string[];
};

function odlegloscMetry(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function syncEnabled(): boolean {
  return String(process.env.TRANSPORT_SYNC_ENABLED ?? "0") === "1";
}

function realtimeDelayThreshold(): number {
  const v = Number.parseInt(process.env.TRANSPORT_ALERT_DELAY_MIN ?? "", 10);
  return Number.isFinite(v) && v > 0 ? v : 15;
}

function plannedSyncHours(): number {
  const v = Number.parseInt(process.env.TRANSPORT_PLANNED_SYNC_HOURS ?? "", 10);
  if (!Number.isFinite(v) || v <= 0) return 24;
  return Math.min(72, Math.max(1, v));
}

function realtimeMinutes(): number {
  const v = Number.parseInt(process.env.TRANSPORT_REALTIME_CRON_MINUTES ?? "", 10);
  if (!Number.isFinite(v) || v <= 0) return 3;
  return Math.min(30, Math.max(2, v));
}

async function wyslijAlertyTransportowe(
  supabase: SupabaseClient,
  args: {
    villageId: string;
    villageName: string;
    delayedCount: number;
    cancelledCount: number;
    delayThreshold: number;
  },
) {
  const { data: favRaw, error: favErr } = await supabase
    .from("user_transport_favorite_relations")
    .select("user_id, notify_delay_min, notify_cancelled, notify_disruptions")
    .eq("village_id", args.villageId)
    .eq("is_active", true);
  if (favErr) return;

  const favorites = (favRaw ?? []) as {
    user_id: string;
    notify_delay_min: number;
    notify_cancelled: boolean;
    notify_disruptions: boolean;
  }[];
  if (favorites.length === 0) return;

  const recentSince = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const { data: recentRaw } = await supabase
    .from("notifications")
    .select("user_id, type")
    .eq("related_id", args.villageId)
    .gte("created_at", recentSince)
    .in("type", ["transport_delay_alert", "transport_cancelled_alert"]);

  const recentSet = new Set(
    ((recentRaw ?? []) as { user_id: string; type: string }[]).map((r) => `${r.user_id}|${r.type}`),
  );

  for (const fav of favorites) {
    const shouldDelay =
      args.delayedCount > 0 &&
      fav.notify_disruptions &&
      (fav.notify_delay_min ?? args.delayThreshold) <= args.delayThreshold;
    const shouldCancelled = args.cancelledCount > 0 && fav.notify_cancelled;

    if (shouldCancelled && !recentSet.has(`${fav.user_id}|transport_cancelled_alert`)) {
      await supabase.from("notifications").insert({
        user_id: fav.user_id,
        type: "transport_cancelled_alert",
        title: "Odwołane połączenia",
        body: `${args.villageName}: wykryto odwołane kursy kolejowe.`,
        link_url: "/panel/powiadomienia",
        related_id: args.villageId,
        related_type: "village",
        channel: "in_app",
      });
      await wyslijWebPushDlaUzytkownika(supabase, {
        userId: fav.user_id,
        title: "Transport: odwołane połączenia",
        body: `${args.villageName}: sprawdź najbliższe odjazdy.`,
        linkUrl: "/panel/powiadomienia",
        tag: `transport-cancelled-${args.villageId}`,
      });
    }

    if (shouldDelay && !recentSet.has(`${fav.user_id}|transport_delay_alert`)) {
      await supabase.from("notifications").insert({
        user_id: fav.user_id,
        type: "transport_delay_alert",
        title: "Opóźnienia w odjazdach",
        body: `${args.villageName}: opóźnienie przekracza ${args.delayThreshold} min.`,
        link_url: "/panel/powiadomienia",
        related_id: args.villageId,
        related_type: "village",
        channel: "in_app",
      });
      await wyslijWebPushDlaUzytkownika(supabase, {
        userId: fav.user_id,
        title: "Transport: opóźnienia",
        body: `${args.villageName}: są opóźnione kursy.`,
        linkUrl: "/panel/powiadomienia",
        tag: `transport-delay-${args.villageId}`,
      });
    }
  }
}

export async function synchronizujTransportAutomatycznie(
  supabase: SupabaseClient,
): Promise<TransportAutoSyncSummary> {
  const summary: TransportAutoSyncSummary = {
    enabled: syncEnabled(),
    villagesProcessed: 0,
    stationsObserved: 0,
    departuresUpserted: 0,
    statusGreen: 0,
    statusOrange: 0,
    statusRed: 0,
    fallbackVillages: 0,
    errors: [],
  };

  if (!summary.enabled) return summary;

  const delayThreshold = realtimeDelayThreshold();
  const plannedCooldownMs = plannedSyncHours() * 60 * 60 * 1000;
  const realtimeCooldownMs = realtimeMinutes() * 60 * 1000;

  const { data: wsie, error: wErr } = await supabase
    .from("villages")
    .select("id, name, latitude, longitude")
    .eq("is_active", true)
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .limit(40);
  if (wErr) throw new Error(`Transport sync: villages: ${wErr.message}`);

  const villages = (wsie ?? []) as VillageRow[];
  if (villages.length === 0) return summary;
  const villageIds = villages.map((v) => v.id);

  const [{ data: poiRows, error: poiErr }, { data: syncRows, error: syncErr }] = await Promise.all([
    supabase
      .from("pois")
      .select("id, village_id, name, latitude, longitude")
      .eq("category", "stacja_kolejowa")
      .in("village_id", villageIds),
    supabase
      .from("transport_sync_state")
      .select("village_id, last_planned_sync_at, last_realtime_sync_at")
      .in("village_id", villageIds),
  ]);
  if (poiErr) throw new Error(`Transport sync: poi: ${poiErr.message}`);
  if (syncErr) throw new Error(`Transport sync: sync state: ${syncErr.message}`);

  const poiByVillage = new Map<string, StationPoiRow[]>();
  for (const row of (poiRows ?? []) as StationPoiRow[]) {
    const arr = poiByVillage.get(row.village_id) ?? [];
    arr.push(row);
    poiByVillage.set(row.village_id, arr);
  }

  const syncByVillage = new Map<
    string,
    { last_planned_sync_at: string | null; last_realtime_sync_at: string | null }
  >();
  for (const row of (syncRows ?? []) as { village_id: string; last_planned_sync_at: string | null; last_realtime_sync_at: string | null }[]) {
    syncByVillage.set(row.village_id, {
      last_planned_sync_at: row.last_planned_sync_at,
      last_realtime_sync_at: row.last_realtime_sync_at,
    });
  }

  for (const v of villages) {
    const lat = Number(v.latitude);
    const lon = Number(v.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    const sync = syncByVillage.get(v.id);
    const now = Date.now();
    const lastPlanned = sync?.last_planned_sync_at ? Date.parse(sync.last_planned_sync_at) : 0;
    const lastRealtime = sync?.last_realtime_sync_at ? Date.parse(sync.last_realtime_sync_at) : 0;
    const plannedDue = !Number.isFinite(lastPlanned) || now - lastPlanned >= plannedCooldownMs;
    const realtimeDue = !Number.isFinite(lastRealtime) || now - lastRealtime >= realtimeCooldownMs;
    if (!plannedDue && !realtimeDue) continue;

    const candidates = (poiByVillage.get(v.id) ?? [])
      .map((p) => {
        const plat = Number(p.latitude);
        const plon = Number(p.longitude);
        const distKm =
          Number.isFinite(plat) && Number.isFinite(plon)
            ? odlegloscMetry(lat, lon, plat, plon) / 1000
            : Number.POSITIVE_INFINITY;
        return { poi: p, distKm };
      })
      .sort((a, b) => a.distKm - b.distKm)
      .slice(0, 5);

    if (candidates.length === 0) continue;
    summary.villagesProcessed += 1;

    let allDepartures: Awaited<ReturnType<typeof pobierzOdjazdyDlaStacjiPkp>> = [];

    for (const c of candidates) {
      const stationNameGuess = c.poi.name?.trim();
      if (!stationNameGuess) continue;
      try {
        const stationCandidates = await wyszukajStacjePkpPoNazwie(stationNameGuess);
        const station = stationCandidates[0];
        if (!station) continue;

        summary.stationsObserved += 1;
        await supabase.from("village_transport_stations").upsert(
          {
            village_id: v.id,
            poi_id: c.poi.id,
            station_id: station.id,
            station_name: station.name,
            station_name_source: stationNameGuess,
            distance_km: Number.isFinite(c.distKm) ? Number(c.distKm.toFixed(3)) : null,
            is_active: true,
            synced_at: new Date().toISOString(),
          },
          { onConflict: "village_id,station_id" },
        );

        const departures = await pobierzOdjazdyDlaStacjiPkp(station.id, { hoursAhead: 24 });
        allDepartures = allDepartures.concat(departures);

        if (departures.length > 0) {
          const payload = departures.map((d) => ({
            village_id: v.id,
            station_id: station.id,
            station_name: station.name,
            departure_uid: d.departureUid,
            train_label: d.trainLabel,
            destination: d.destination,
            carrier: d.carrier,
            platform: d.platform,
            planned_at: d.plannedWhenIso,
            realtime_at: d.realtimeWhenIso,
            delay_min: d.delayMinutes,
            status: d.status,
            is_cancelled: d.isCancelled,
            source_updated_at: d.sourceUpdatedAtIso,
            fetched_at: new Date().toISOString(),
            raw: d,
          }));
          const { error: depErr } = await supabase
            .from("transport_departures_cache")
            .upsert(payload, { onConflict: "village_id,station_id,departure_uid" });
          if (depErr) {
            summary.errors.push(`${v.name}: departures ${depErr.message}`);
          } else {
            summary.departuresUpserted += payload.length;
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        summary.errors.push(`${v.name}: ${msg}`);
      }
    }

    const upcoming = allDepartures
      .filter((d) => Date.parse(d.plannedWhenIso) >= Date.now() - 5 * 60 * 1000)
      .sort((a, b) => Date.parse(a.whenIso) - Date.parse(b.whenIso))
      .slice(0, 10);

    const cancelledCount = upcoming.filter((d) => d.isCancelled).length;
    const delayedCount = upcoming.filter((d) => (d.delayMinutes ?? 0) >= delayThreshold).length;
    const observed = upcoming.length;
    const maxRealtimeAgeMs = Math.max(
      ...upcoming.map((d) => {
        if (!d.sourceUpdatedAtIso) return Number.POSITIVE_INFINITY;
        const t = Date.parse(d.sourceUpdatedAtIso);
        if (!Number.isFinite(t)) return Number.POSITIVE_INFINITY;
        return Date.now() - t;
      }),
    );
    const fallbackMode = !Number.isFinite(maxRealtimeAgeMs) || maxRealtimeAgeMs > 20 * 60 * 1000;

    let statusColor = "green";
    let statusLabel = "Ruch bez większych zakłóceń";
    if (cancelledCount > 0) {
      statusColor = "red";
      statusLabel = "Są odwołane połączenia";
      summary.statusRed += 1;
    } else if (delayedCount > 0) {
      statusColor = "orange";
      statusLabel = "Występują opóźnienia";
      summary.statusOrange += 1;
    } else {
      summary.statusGreen += 1;
    }
    if (fallbackMode) summary.fallbackVillages += 1;

    await supabase.from("village_transport_line_status").upsert({
      village_id: v.id,
      status_color: statusColor,
      status_label: statusLabel,
      delayed_count: delayedCount,
      cancelled_count: cancelledCount,
      observed_departures: observed,
      last_realtime_at: upcoming[0]?.sourceUpdatedAtIso ?? null,
      fallback_mode: fallbackMode,
      updated_at: new Date().toISOString(),
    });

    await supabase.from("transport_sync_state").upsert({
      village_id: v.id,
      last_planned_sync_at: plannedDue ? new Date().toISOString() : sync?.last_planned_sync_at ?? null,
      last_realtime_sync_at: realtimeDue ? new Date().toISOString() : sync?.last_realtime_sync_at ?? null,
      last_error: null,
      updated_at: new Date().toISOString(),
    });

    await wyslijAlertyTransportowe(supabase, {
      villageId: v.id,
      villageName: v.name,
      delayedCount,
      cancelledCount,
      delayThreshold,
    });
  }

  return summary;
}
