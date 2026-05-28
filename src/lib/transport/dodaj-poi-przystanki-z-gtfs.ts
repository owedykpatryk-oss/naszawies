import type { SupabaseClient } from "@supabase/supabase-js";
import { autoTworzPoiPrzystankowZGtfs } from "@/lib/mapa/konfiguracja-automatyzacji";
import { gtfsCsvSkonfigurowany, pobierzPrzystankiGtfsWokolPunktu } from "@/lib/transport/gtfs-csv";

const MAX_NOWYCH_NA_WIES = 12;
const DEDUP_METRY = 120;

function odlegloscM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type IstniejacyPrzystanek = {
  name: string;
  latitude: number | string | null;
  longitude: number | string | null;
};

/**
 * Dopisuje POI kategorii „przystanek” z GTFS (stops.txt) w promieniu wsi,
 * gdy brak pinezki w ~120 m — ułatwia mapowanie odjazdów PKS/autobusów.
 */
export async function utworzBrakujacePoiPrzystankowZGtfs(
  supabase: SupabaseClient,
  args: {
    villageId: string;
    lat: number;
    lon: number;
    istniejace: IstniejacyPrzystanek[];
    promienM?: number;
  },
): Promise<{ utworzono: number; pominietyo: number }> {
  const wynik = { utworzono: 0, pominietyo: 0 };
  if (!autoTworzPoiPrzystankowZGtfs() || !gtfsCsvSkonfigurowany()) return wynik;

  const stops = await pobierzPrzystankiGtfsWokolPunktu({
    lat: args.lat,
    lon: args.lon,
    radiusM: args.promienM ?? 8000,
  });
  if (stops.length === 0) return wynik;

  const widziane = new Set<string>();

  for (const stop of stops) {
    if (wynik.utworzono >= MAX_NOWYCH_NA_WIES) break;
    const klucz = `${stop.lat.toFixed(5)},${stop.lon.toFixed(5)}`;
    if (widziane.has(klucz)) continue;
    widziane.add(klucz);

    let zaBlisko = false;
    for (const p of args.istniejace) {
      const plat = Number(p.latitude);
      const plon = Number(p.longitude);
      if (!Number.isFinite(plat) || !Number.isFinite(plon)) continue;
      if (odlegloscM(plat, plon, stop.lat, stop.lon) < DEDUP_METRY) {
        zaBlisko = true;
        break;
      }
    }
    if (zaBlisko) {
      wynik.pominietyo += 1;
      continue;
    }

    const name =
      stop.name.trim().length >= 2
        ? stop.name.trim().slice(0, 200)
        : "Przystanek autobusowy (GTFS)";

    const { error } = await supabase.from("pois").insert({
      village_id: args.villageId,
      category: "przystanek",
      name,
      description:
        "Przystanek z rozkładu GTFS (automatycznie). Zweryfikuj lokalizację i nazwę na miejscu.",
      latitude: stop.lat,
      longitude: stop.lon,
      source: "osm_auto",
      confidence: 0.75,
    });

    if (error) continue;

    wynik.utworzono += 1;
    args.istniejace.push({
      name,
      latitude: stop.lat,
      longitude: stop.lon,
    });
  }

  return wynik;
}
