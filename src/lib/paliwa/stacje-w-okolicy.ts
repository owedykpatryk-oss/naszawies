import type { SupabaseClient } from "@supabase/supabase-js";
import { bboxDlaPromieniaKm, odlegloscKm } from "@/lib/paliwa/odleglosc-km";

export type RodzajPaliwa = "pb95" | "on" | "lpg";

export type StacjaPaliwWOkolicy = {
  externalId: string;
  name: string;
  brand: string | null;
  city: string | null;
  lat: number;
  lng: number;
  pb95: number | null;
  on: number | null;
  lpg: number | null;
  odlegloscKm: number;
  priceSource: string | null;
  reportedAt: string | null;
};

export type StatystykiPaliwKraj = {
  lastUpdated: string | null;
  pb95: number | null;
  on: number | null;
  lpg: number | null;
  trendPb95_7d: number | null;
  trendOn_7d: number | null;
  trendLpg_7d: number | null;
  totalStations: number | null;
  fetchedAt: string | null;
};

type WierszStacji = {
  external_id: string;
  name: string;
  brand: string | null;
  city: string | null;
  lat: number | string;
  lng: number | string;
  pb95: number | null;
  on: number | null;
  lpg: number | null;
  price_source: string | null;
  reported_at: string | null;
};

const DOMYSLNY_PROMIEN_KM = 25;
const MAX_STACJI = 80;

export async function pobierzStatystykiPaliwKraj(
  supabase: SupabaseClient,
): Promise<StatystykiPaliwKraj | null> {
  const { data } = await supabase
    .from("fuel_prices_stats")
    .select(
      "last_updated, pb95_avg, on_avg, lpg_avg, trend_pb95_7d, trend_on_7d, trend_lpg_7d, total_stations, fetched_at",
    )
    .eq("id", "latest")
    .maybeSingle();

  if (!data) return null;

  return {
    lastUpdated: (data.last_updated as string | null) ?? null,
    pb95: data.pb95_avg != null ? Number(data.pb95_avg) : null,
    on: data.on_avg != null ? Number(data.on_avg) : null,
    lpg: data.lpg_avg != null ? Number(data.lpg_avg) : null,
    trendPb95_7d: data.trend_pb95_7d != null ? Number(data.trend_pb95_7d) : null,
    trendOn_7d: data.trend_on_7d != null ? Number(data.trend_on_7d) : null,
    trendLpg_7d: data.trend_lpg_7d != null ? Number(data.trend_lpg_7d) : null,
    totalStations: data.total_stations != null ? Number(data.total_stations) : null,
    fetchedAt: (data.fetched_at as string | null) ?? null,
  };
}

export async function stacjePaliwWOkolicy(
  supabase: SupabaseClient,
  lat: number,
  lon: number,
  promienKm = DOMYSLNY_PROMIEN_KM,
): Promise<StacjaPaliwWOkolicy[]> {
  const bbox = bboxDlaPromieniaKm(lat, promienKm);

  const { data, error } = await supabase
    .from("fuel_stations_cache")
    .select(
      "external_id, name, brand, city, lat, lng, pb95, on, lpg, price_source, reported_at",
    )
    .gte("lat", bbox.minLat)
    .lte("lat", bbox.maxLat)
    .gte("lng", lon - promienKm / (111 * Math.max(Math.cos((lat * Math.PI) / 180), 0.15)))
    .lte("lng", lon + promienKm / (111 * Math.max(Math.cos((lat * Math.PI) / 180), 0.15)))
    .limit(500);

  if (error || !data?.length) return [];

  const wynik: StacjaPaliwWOkolicy[] = [];

  for (const row of data as WierszStacji[]) {
    const sLat = Number(row.lat);
    const sLng = Number(row.lng);
    if (!Number.isFinite(sLat) || !Number.isFinite(sLng)) continue;
    const km = odlegloscKm(lat, lon, sLat, sLng);
    if (km > promienKm) continue;
    if (row.pb95 == null && row.on == null && row.lpg == null) continue;

    wynik.push({
      externalId: row.external_id,
      name: row.name,
      brand: row.brand,
      city: row.city,
      lat: sLat,
      lng: sLng,
      pb95: row.pb95 != null ? Number(row.pb95) : null,
      on: row.on != null ? Number(row.on) : null,
      lpg: row.lpg != null ? Number(row.lpg) : null,
      odlegloscKm: Math.round(km * 10) / 10,
      priceSource: row.price_source,
      reportedAt: row.reported_at,
    });
  }

  wynik.sort((a, b) => a.odlegloscKm - b.odlegloscKm);
  return wynik.slice(0, MAX_STACJI);
}

export function najtanszeStacje(
  stacje: StacjaPaliwWOkolicy[],
  rodzaj: RodzajPaliwa,
  limit = 5,
): StacjaPaliwWOkolicy[] {
  const pole = rodzaj === "pb95" ? "pb95" : rodzaj === "on" ? "on" : "lpg";
  return [...stacje]
    .filter((s) => s[pole] != null && s[pole]! > 0)
    .sort((a, b) => a[pole]! - b[pole]! || a.odlegloscKm - b.odlegloscKm)
    .slice(0, limit);
}

export function formatujTrend(trend: number | null): string | null {
  if (trend == null || !Number.isFinite(trend)) return null;
  const znak = trend > 0 ? "+" : "";
  return `${znak}${trend.toFixed(2)} zł/l (7 dni)`;
}
