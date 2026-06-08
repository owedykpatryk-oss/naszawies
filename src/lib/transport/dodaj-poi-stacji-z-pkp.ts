import type { SupabaseClient } from "@supabase/supabase-js";
import { autoTworzPoiStacjiZKpk } from "@/lib/mapa/konfiguracja-automatyzacji";
import { pobierzStacjeKolejoweZOsmWokolPunktu } from "@/lib/mapa/overpass-poi-dla-punktu";
import { wyszukajStacjePkpPoNazwie } from "@/lib/transport/pkp-plk-api";

const MAX_NOWYCH_NA_WIES = 3;
const DEDUP_METRY = 450;
const PROMIEN_OSM_M = 14_000;

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

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type IstniejacaStacja = {
  name: string;
  latitude: number | string | null;
  longitude: number | string | null;
};

/**
 * Tworzy POI „stacja_kolejowa” na podstawie słownika PKP + współrzędnych OSM.
 * Wymaga dopasowania nazwy stacji PKP do punktu railway=station/halt w okolicy wsi.
 */
export async function utworzBrakujacePoiStacjiZKpk(
  supabase: SupabaseClient,
  args: {
    villageId: string;
    villageName: string;
    commune?: string | null;
    lat: number;
    lon: number;
    istniejace: IstniejacaStacja[];
  },
): Promise<{ utworzono: number; pominietyo: number }> {
  const wynik = { utworzono: 0, pominietyo: 0 };
  if (!autoTworzPoiStacjiZKpk()) return wynik;

  const frazy = Array.from(
    new Set(
      [args.villageName, args.commune?.replace(/^gmina\s+/i, "").trim()]
        .filter((f): f is string => Boolean(f && f.length >= 3))
        .slice(0, 2),
    ),
  );
  if (frazy.length === 0) return wynik;

  const kandydaciPkp = new Map<string, { id: string; name: string }>();
  for (const fraza of frazy) {
    const lista = await wyszukajStacjePkpPoNazwie(fraza);
    for (const s of lista) kandydaciPkp.set(s.id, s);
  }
  if (kandydaciPkp.size === 0) return wynik;

  const osm = await pobierzStacjeKolejoweZOsmWokolPunktu(args.lat, args.lon, PROMIEN_OSM_M);
  if (!osm.ok || osm.punkty.length === 0) return wynik;

  const widziane = new Set<string>();

  for (const pkp of Array.from(kandydaciPkp.values())) {
    if (wynik.utworzono >= MAX_NOWYCH_NA_WIES) break;
    const pkpNorm = norm(pkp.name);

    const osmMatch = osm.punkty.find((p) => {
      const pn = norm(p.name);
      return pn.includes(pkpNorm) || pkpNorm.includes(pn) || pn.split(" ")[0] === pkpNorm.split(" ")[0];
    });
    if (!osmMatch) {
      wynik.pominietyo += 1;
      continue;
    }

    const klucz = `${osmMatch.lat.toFixed(5)},${osmMatch.lon.toFixed(5)}`;
    if (widziane.has(klucz)) continue;
    widziane.add(klucz);

    let zaBlisko = false;
    for (const e of args.istniejace) {
      const plat = Number(e.latitude);
      const plon = Number(e.longitude);
      if (!Number.isFinite(plat) || !Number.isFinite(plon)) continue;
      if (odlegloscM(plat, plon, osmMatch.lat, osmMatch.lon) < DEDUP_METRY) {
        zaBlisko = true;
        break;
      }
    }
    if (zaBlisko) {
      wynik.pominietyo += 1;
      continue;
    }

    const name = pkp.name.trim().slice(0, 200);
    const { error } = await supabase.from("pois").insert({
      village_id: args.villageId,
      category: "stacja_kolejowa",
      name,
      description: `AUTO_PKP_SYNC v1 (PKP id ${pkp.id}, OSM ${osmMatch.osmType} ${osmMatch.osmId}). Zweryfikuj nazwę i lokalizację.`,
      latitude: osmMatch.lat,
      longitude: osmMatch.lon,
      source: "pkp_auto",
      confidence: 0.5,
      verified_at: null,
      is_local_override: false,
    });
    if (error) {
      wynik.pominietyo += 1;
      continue;
    }

    args.istniejace.push({ name, latitude: osmMatch.lat, longitude: osmMatch.lon });
    wynik.utworzono += 1;
  }

  return wynik;
}
