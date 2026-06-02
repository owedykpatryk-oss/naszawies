import type { SupabaseClient } from "@supabase/supabase-js";

const URL_STATS = "https://benzynamapa.pl/data/stats_latest.json";
const URL_STATIONS = "https://benzynamapa.pl/data/stations_latest.json";
const URL_PRICES = "https://benzynamapa.pl/data/prices_latest.json";
const BATCH = 250;
const MIN_INTERVAL_MS = 3 * 60 * 60 * 1000;

type StatsJson = {
  last_updated?: string;
  averages?: { pb95?: number; pb98?: number; on?: number; lpg?: number };
  trend_7d?: { pb95?: number; on?: number; lpg?: number };
  total_stations?: number;
};

type StationJson = {
  id: string;
  name?: string;
  brand?: string;
  lat?: number;
  lng?: number;
  city?: string;
  address?: string;
};

type PriceJson = {
  station_id: string;
  pb95?: number | null;
  pb98?: number | null;
  on?: number | null;
  lpg?: number | null;
  source?: string;
  reported_at?: string;
};

export type WynikSyncPaliw = {
  ok: boolean;
  skippedRecent?: boolean;
  statsUpdated: boolean;
  stationsUpserted: number;
  errors: string[];
};

function czySyncWlaczony(): boolean {
  const v = process.env.FUEL_PRICES_SYNC_ENABLED?.trim().toLowerCase();
  return v !== "0" && v !== "false" && v !== "off";
}

async function ostatniFetchAt(supabase: SupabaseClient): Promise<Date | null> {
  const { data } = await supabase
    .from("fuel_prices_stats")
    .select("fetched_at")
    .eq("id", "latest")
    .maybeSingle();
  if (!data?.fetched_at) return null;
  const d = new Date(data.fetched_at as string);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function synchronizujCenyPaliw(supabase: SupabaseClient): Promise<WynikSyncPaliw> {
  const errors: string[] = [];
  if (!czySyncWlaczony()) {
    return { ok: true, skippedRecent: true, statsUpdated: false, stationsUpserted: 0, errors: [] };
  }

  const ostatni = await ostatniFetchAt(supabase);
  if (ostatni && Date.now() - ostatni.getTime() < MIN_INTERVAL_MS) {
    return { ok: true, skippedRecent: true, statsUpdated: false, stationsUpserted: 0, errors: [] };
  }

  let statsUpdated = false;
  let stationsUpserted = 0;

  try {
    const statsRes = await fetch(URL_STATS, {
      next: { revalidate: 0 },
      headers: { Accept: "application/json" },
    });
    if (!statsRes.ok) {
      errors.push(`stats HTTP ${statsRes.status}`);
    } else {
      const stats = (await statsRes.json()) as StatsJson;
      const { error } = await supabase.from("fuel_prices_stats").upsert({
        id: "latest",
        last_updated: stats.last_updated ?? null,
        pb95_avg: stats.averages?.pb95 ?? null,
        pb98_avg: stats.averages?.pb98 ?? null,
        on_avg: stats.averages?.on ?? null,
        lpg_avg: stats.averages?.lpg ?? null,
        trend_pb95_7d: stats.trend_7d?.pb95 ?? null,
        trend_on_7d: stats.trend_7d?.on ?? null,
        trend_lpg_7d: stats.trend_7d?.lpg ?? null,
        total_stations: stats.total_stations ?? null,
        fetched_at: new Date().toISOString(),
      });
      if (error) errors.push(`stats upsert: ${error.message}`);
      else statsUpdated = true;
    }
  } catch (e) {
    errors.push(`stats fetch: ${e instanceof Error ? e.message : String(e)}`);
  }

  try {
    const [stationsRes, pricesRes] = await Promise.all([
      fetch(URL_STATIONS, { next: { revalidate: 0 }, headers: { Accept: "application/json" } }),
      fetch(URL_PRICES, { next: { revalidate: 0 }, headers: { Accept: "application/json" } }),
    ]);

    if (!stationsRes.ok || !pricesRes.ok) {
      errors.push(`stations/prices HTTP ${stationsRes.status}/${pricesRes.status}`);
      return { ok: errors.length === 0, statsUpdated, stationsUpserted, errors };
    }

    const stationsRaw = (await stationsRes.json()) as { stations?: StationJson[] } | StationJson[];
    const pricesRaw = (await pricesRes.json()) as { prices?: PriceJson[] } | PriceJson[];

    const stations = Array.isArray(stationsRaw) ? stationsRaw : (stationsRaw.stations ?? []);
    const prices = Array.isArray(pricesRaw) ? pricesRaw : (pricesRaw.prices ?? []);

    const mapaCen = new Map<string, PriceJson>();
    for (const p of prices) {
      if (p.station_id) mapaCen.set(p.station_id, p);
    }

    const syncStart = new Date().toISOString();
    const wiersze: Record<string, unknown>[] = [];

    for (const s of stations) {
      if (!s.id || s.lat == null || s.lng == null) continue;
      const c = mapaCen.get(s.id);
      wiersze.push({
        external_id: s.id,
        name: (s.name ?? "Stacja paliw").slice(0, 200),
        brand: s.brand?.slice(0, 80) ?? null,
        lat: s.lat,
        lng: s.lng,
        city: s.city?.slice(0, 120) ?? null,
        address: s.address?.slice(0, 200) ?? null,
        pb95: c?.pb95 ?? null,
        pb98: c?.pb98 ?? null,
        on: c?.on ?? null,
        lpg: c?.lpg ?? null,
        price_source: c?.source ?? null,
        reported_at: c?.reported_at ?? null,
        updated_at: syncStart,
      });
    }

    for (let i = 0; i < wiersze.length; i += BATCH) {
      const partia = wiersze.slice(i, i + BATCH);
      const { error } = await supabase.from("fuel_stations_cache").upsert(partia, {
        onConflict: "external_id",
      });
      if (error) {
        errors.push(`stations batch ${i}: ${error.message}`);
      } else {
        stationsUpserted += partia.length;
      }
    }

    await supabase
      .from("fuel_stations_cache")
      .delete()
      .lt("updated_at", syncStart);
  } catch (e) {
    errors.push(`stations sync: ${e instanceof Error ? e.message : String(e)}`);
  }

  return {
    ok: errors.length === 0,
    statsUpdated,
    stationsUpserted,
    errors,
  };
}
