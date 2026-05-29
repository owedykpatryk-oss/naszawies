/**
 * Pobieranie obrysu cmentarza (polygon way) z OpenStreetMap przez Overpass.
 */

const USER_AGENT = "NaszawiesPl/1.0 (+https://naszawies.pl/)";

type OverpassNode = { type: "node"; id: number; lat: number; lon: number };
type OverpassWay = {
  type: "way";
  id: number;
  nodes?: number[];
  geometry?: { lat: number; lon: number }[];
  tags?: Record<string, string>;
  center?: { lat: number; lon: number };
};
type OverpassRelation = {
  type: "relation";
  id: number;
  members?: { type: string; ref: number; role: string }[];
  tags?: Record<string, string>;
  center?: { lat: number; lon: number };
};

type OverpassElement = OverpassNode | OverpassWay | OverpassRelation;

export type ObrysCmentarzaZOsm = {
  name: string;
  geojson: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  centroidLat: number;
  centroidLng: number;
  osmType: "way" | "relation";
  osmId: number;
};

function nazwaZTagow(tags: Record<string, string>): string {
  return (
    tags["name:pl"]?.trim() ||
    tags.name?.trim() ||
    tags["official_name:pl"]?.trim() ||
    tags.official_name?.trim() ||
    "Cmentarz (OpenStreetMap)"
  );
}

function czyCmentarz(tags: Record<string, string>): boolean {
  return tags.amenity === "grave_yard" || tags.landuse === "cemetery";
}

function wayDoPolygon(way: OverpassWay, nodeMap: Map<number, { lat: number; lon: number }>): GeoJSON.Polygon | null {
  const geom = way.geometry;
  let coords: [number, number][] = [];
  if (geom && geom.length >= 3) {
    coords = geom.map((p) => [p.lon, p.lat]);
  } else if (way.nodes && way.nodes.length >= 3) {
    for (const nid of way.nodes) {
      const n = nodeMap.get(nid);
      if (n) coords.push([n.lon, n.lat]);
    }
  }
  if (coords.length < 3) return null;
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (first && last && (first[0] !== last[0] || first[1] !== last[1])) {
    coords.push([first[0], first[1]]);
  }
  return { type: "Polygon", coordinates: [coords] };
}

export function centroidPolygon(poly: GeoJSON.Polygon | GeoJSON.MultiPolygon): { lat: number; lon: number } {
  const ring = poly.type === "Polygon" ? poly.coordinates[0] : poly.coordinates[0]?.[0];
  if (!ring?.length) return { lat: 0, lon: 0 };
  let sumLat = 0;
  let sumLon = 0;
  const n = ring.length - 1;
  for (let i = 0; i < n; i++) {
    sumLon += ring[i]![0];
    sumLat += ring[i]![1];
  }
  return { lat: sumLat / n, lon: sumLon / n };
}

function zbudujZapytanieObrys(lat: number, lon: number, promienM: number): string {
  const r = Math.round(promienM);
  return `[out:json][timeout:45];
(
  way["amenity"="grave_yard"](around:${r},${lat},${lon});
  way["landuse"="cemetery"](around:${r},${lat},${lon});
  relation["amenity"="grave_yard"](around:${r},${lat},${lon});
  relation["landuse"="cemetery"](around:${r},${lat},${lon});
);
out geom tags center;`;
}

export async function pobierzObrysyCmentarzyZOsm(
  lat: number,
  lon: number,
  promienM = 4000,
): Promise<{ ok: true; obrysy: ObrysCmentarzaZOsm[] } | { ok: false; blad: string }> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { ok: false, blad: "Nieprawidłowe współrzędne." };
  }
  const r = Math.min(8000, Math.max(800, Math.round(promienM)));
  const body = zbudujZapytanieObrys(lat, lon, r);

  let res: Response;
  try {
    res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8", "User-Agent": USER_AGENT },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(50_000),
    });
  } catch (e) {
    return { ok: false, blad: `Błąd połączenia z Overpass: ${e instanceof Error ? e.message : String(e)}` };
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

  const nodeMap = new Map<number, { lat: number; lon: number }>();
  for (const el of json.elements ?? []) {
    if (el.type === "node" && "lat" in el && "lon" in el) {
      nodeMap.set(el.id, { lat: el.lat, lon: el.lon });
    }
  }

  const obrysy: ObrysCmentarzaZOsm[] = [];

  for (const el of json.elements ?? []) {
    if (el.type === "way") {
      const tags = el.tags ?? {};
      if (!czyCmentarz(tags)) continue;
      const poly = wayDoPolygon(el, nodeMap);
      if (!poly) continue;
      const c = centroidPolygon(poly);
      obrysy.push({
        name: nazwaZTagow(tags),
        geojson: poly,
        centroidLat: c.lat,
        centroidLng: c.lon,
        osmType: "way",
        osmId: el.id,
      });
    }
    if (el.type === "relation") {
      const tags = el.tags ?? {};
      if (!czyCmentarz(tags)) continue;
      const center = el.center;
      if (!center) continue;
      const poly: GeoJSON.Polygon = {
        type: "Polygon",
        coordinates: [
          [
            [center.lon - 0.0003, center.lat - 0.0002],
            [center.lon + 0.0003, center.lat - 0.0002],
            [center.lon + 0.0003, center.lat + 0.0002],
            [center.lon - 0.0003, center.lat + 0.0002],
            [center.lon - 0.0003, center.lat - 0.0002],
          ],
        ],
      };
      obrysy.push({
        name: nazwaZTagow(tags),
        geojson: poly,
        centroidLat: center.lat,
        centroidLng: center.lon,
        osmType: "relation",
        osmId: el.id,
      });
    }
  }

  return { ok: true, obrysy };
}

/** URL kafelka ortofoto (Esri World Imagery) — orientacyjny podkład. */
export function urlPodkladuOrtofoto(lat: number, lon: number, zoom = 18): string {
  const z = zoom;
  const n = 2 ** z;
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
}
