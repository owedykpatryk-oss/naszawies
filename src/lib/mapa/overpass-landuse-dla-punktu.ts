/**
 * Obrysy landuse z OpenStreetMap (zagospodarowanie przestrzenne — orientacyjnie).
 * Dane OSM nie zastępują MPZP gminy — służą jako warstwa pomocnicza na mapie wsi.
 */

import { centroidPolygon } from "@/lib/cmentarz/overpass-cmentarz-obrys";
import { LANDUSE_OSM_WSPOLNE } from "@/lib/mapa/landuse-osm";

const USER_AGENT = "NaszawiesPl/1.0 (+https://naszawies.pl/)";

type OverpassNode = { type: "node"; id: number; lat: number; lon: number };
type OverpassWay = {
  type: "way";
  id: number;
  nodes?: number[];
  geometry?: { lat: number; lon: number }[];
  tags?: Record<string, string>;
};
type OverpassElement = OverpassNode | OverpassWay;

export type ObrysLanduseZOsm = {
  landuse: string;
  name: string | null;
  geojson: GeoJSON.Polygon;
  osmId: number;
  areaApprox: number;
};

function wayDoPolygon(way: OverpassWay): GeoJSON.Polygon | null {
  const geom = way.geometry;
  if (!geom || geom.length < 3) return null;
  const coords: [number, number][] = geom.map((p) => [p.lon, p.lat]);
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (first && last && (first[0] !== last[0] || first[1] !== last[1])) {
    coords.push([first[0], first[1]]);
  }
  if (coords.length < 4) return null;
  return { type: "Polygon", coordinates: [coords] };
}

function polePolygon(poly: GeoJSON.Polygon): number {
  const ring = poly.coordinates[0];
  if (!ring || ring.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const a = ring[i]!;
    const b = ring[i + 1]!;
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return Math.abs(sum / 2);
}

function nazwaZTagow(tags: Record<string, string>): string | null {
  const n =
    tags["name:pl"]?.trim() ||
    tags.name?.trim() ||
    tags["official_name:pl"]?.trim() ||
    tags.official_name?.trim();
  return n ? (n.length > 120 ? `${n.slice(0, 117)}…` : n) : null;
}

function zbudujZapytanieLanduse(lat: number, lon: number, promienM: number): string {
  const r = Math.round(promienM);
  const filtr = LANDUSE_OSM_WSPOLNE.join("|");
  return `[out:json][timeout:45];
(
  way["landuse"~"^(${filtr})$"](around:${r},${lat},${lon});
);
out geom tags;`;
}

export async function pobierzLanduseZOsmWokolPunktu(
  lat: number,
  lon: number,
  promienM: number,
): Promise<{ ok: true; obrysy: ObrysLanduseZOsm[] } | { ok: false; blad: string }> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { ok: false, blad: "Nieprawidłowe współrzędne." };
  }
  const r = Math.min(6000, Math.max(800, Math.round(promienM)));
  const body = zbudujZapytanieLanduse(lat, lon, r);

  let res: Response;
  try {
    res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=UTF-8",
        "User-Agent": USER_AGENT,
      },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(50_000),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, blad: `Overpass niedostępny: ${msg}` };
  }

  if (!res.ok) {
    return { ok: false, blad: `Overpass HTTP ${res.status}` };
  }

  let json: { elements?: OverpassElement[] };
  try {
    json = (await res.json()) as { elements?: OverpassElement[] };
  } catch {
    return { ok: false, blad: "Niepoprawna odpowiedź Overpass." };
  }

  const surowe: ObrysLanduseZOsm[] = [];
  for (const el of json.elements ?? []) {
    if (el.type !== "way") continue;
    const lu = el.tags?.landuse?.trim();
    if (!lu) continue;
    const poly = wayDoPolygon(el);
    if (!poly) continue;
    const area = polePolygon(poly);
    if (area < 0.00000008) continue;
    surowe.push({
      landuse: lu,
      name: nazwaZTagow(el.tags ?? {}),
      geojson: poly,
      osmId: el.id,
      areaApprox: area,
    });
  }

  surowe.sort((a, b) => b.areaApprox - a.areaApprox);
  const obrysy = surowe.slice(0, 28);
  return { ok: true, obrysy };
}

export function centroidObrysuLanduse(poly: GeoJSON.Polygon): { lat: number; lon: number } {
  return centroidPolygon(poly);
}
