/** GeoJSON Polygon do zapisu w `village_hunting_notices.area_geojson`. */
export type GeoJsonPolygonPolowania = {
  type: "Polygon";
  coordinates: [number, number][][];
};

const MIN_PUNKTOW = 3;
const MAX_PUNKTOW = 80;

function zamknijPiercien(ring: [number, number][]): [number, number][] {
  if (ring.length < 3) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first && last && first[0] === last[0] && first[1] === last[1]) return ring;
  return [...ring, first!];
}

/** Punkty z edytora mapy (lat, lng) → Polygon GeoJSON. */
export function polygonZLokalnychPunktow(punkty: { lat: number; lng: number }[]): GeoJsonPolygonPolowania | null {
  if (punkty.length < MIN_PUNKTOW) return null;
  const ring: [number, number][] = punkty.map((p) => [p.lng, p.lat]);
  return { type: "Polygon", coordinates: [zamknijPiercien(ring)] };
}

/** Odczyt zapisanej geometrii → punkty do edytora. */
export function lokalnePunktyZPolygonu(raw: unknown): { lat: number; lng: number }[] {
  const poly = walidujObszarPolowania(raw);
  if (!poly) return [];
  const ring = poly.coordinates[0];
  if (!ring || ring.length < MIN_PUNKTOW) return [];
  const bezZamkniecia =
    ring.length >= 4 &&
    ring[0]![0] === ring[ring.length - 1]![0] &&
    ring[0]![1] === ring[ring.length - 1]![1]
      ? ring.slice(0, -1)
      : ring;
  return bezZamkniecia.map(([lng, lat]) => ({ lat, lng }));
}

export function walidujObszarPolowania(raw: unknown): GeoJsonPolygonPolowania | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as { type?: string; coordinates?: unknown };
  if (o.type !== "Polygon" || !Array.isArray(o.coordinates)) return null;
  const rings = o.coordinates as unknown[];
  if (rings.length === 0 || !Array.isArray(rings[0])) return null;
  const ring = rings[0] as unknown[];
  if (ring.length < MIN_PUNKTOW + 1) return null;

  const out: [number, number][] = [];
  for (const pt of ring) {
    if (!Array.isArray(pt) || pt.length < 2) return null;
    const lng = Number(pt[0]);
    const lat = Number(pt[1]);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
    if (lng < 13 || lng > 25 || lat < 48 || lat > 55) return null;
    out.push([lng, lat]);
  }
  if (out.length > MAX_PUNKTOW + 1) return null;

  const zamkniety = zamknijPiercien(out);
  if (zamkniety.length < MIN_PUNKTOW + 1) return null;
  return { type: "Polygon", coordinates: [zamkniety] };
}

/** Środek do pinezki / podglądu, gdy brak wsi na mapie. */
export function centroidObszaruPolowania(raw: unknown): { lat: number; lng: number } | null {
  const poly = walidujObszarPolowania(raw);
  if (!poly) return null;
  const ring = poly.coordinates[0];
  if (!ring?.length) return null;
  const pts =
    ring.length >= 4 &&
    ring[0]![0] === ring[ring.length - 1]![0] &&
    ring[0]![1] === ring[ring.length - 1]![1]
      ? ring.slice(0, -1)
      : ring;
  let sumLat = 0;
  let sumLng = 0;
  for (const [lng, lat] of pts) {
    sumLat += lat;
    sumLng += lng;
  }
  const n = pts.length;
  if (n === 0) return null;
  return { lat: sumLat / n, lng: sumLng / n };
}

/** Prostokąt z dwóch narożników (klik–klik). */
export function prostokatZLokalnychPunktow(a: PunktLokalny, b: PunktLokalny): GeoJsonPolygonPolowania | null {
  const latMin = Math.min(a.lat, b.lat);
  const latMax = Math.max(a.lat, b.lat);
  const lngMin = Math.min(a.lng, b.lng);
  const lngMax = Math.max(a.lng, b.lng);
  if (Math.abs(latMax - latMin) < 0.00005 || Math.abs(lngMax - lngMin) < 0.00005) return null;
  return polygonZLokalnychPunktow([
    { lat: latMin, lng: lngMin },
    { lat: latMin, lng: lngMax },
    { lat: latMax, lng: lngMax },
    { lat: latMax, lng: lngMin },
  ]);
}

export type PunktLokalny = { lat: number; lng: number };

function pierwszyPierscienZGeo(raw: unknown): [number, number][] | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as { type?: string; coordinates?: unknown; geometry?: unknown; features?: unknown[] };
  let najdluzszy: [number, number][] | null = null;

  const rozważRing = (ring: unknown) => {
    if (!Array.isArray(ring)) return;
    const pts: [number, number][] = [];
    for (const pt of ring) {
      if (!Array.isArray(pt) || pt.length < 2) return;
      const lng = Number(pt[0]);
      const lat = Number(pt[1]);
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;
      pts.push([lng, lat]);
    }
    if (pts.length >= MIN_PUNKTOW && (!najdluzszy || pts.length > najdluzszy.length)) {
      najdluzszy = pts;
    }
  };

  if (o.type === "Polygon" && Array.isArray(o.coordinates)) {
    rozważRing((o.coordinates as unknown[])[0]);
  } else if (o.type === "MultiPolygon" && Array.isArray(o.coordinates)) {
    for (const poly of o.coordinates as unknown[]) {
      if (Array.isArray(poly)) rozważRing(poly[0]);
    }
  } else if (o.type === "Feature" && o.geometry) {
    return pierwszyPierscienZGeo(o.geometry);
  } else if (o.type === "FeatureCollection" && Array.isArray(o.features)) {
    for (const f of o.features) {
      const r = pierwszyPierscienZGeo(f);
      if (r && (!najdluzszy || r.length > najdluzszy.length)) najdluzszy = r;
    }
  }

  return najdluzszy;
}

/** Uprość pierścień PRG do max. ~40 wierzchołków (co N-ty punkt). */
function uproszczPierscien(ring: [number, number][]): [number, number][] {
  const bezZamk =
    ring.length >= 4 &&
    ring[0]![0] === ring[ring.length - 1]![0] &&
    ring[0]![1] === ring[ring.length - 1]![1]
      ? ring.slice(0, -1)
      : [...ring];
  if (bezZamk.length <= 40) return zamknijPiercien(ring);
  const krok = Math.ceil(bezZamk.length / 36);
  const sampled = bezZamk.filter((_, i) => i % krok === 0);
  if (sampled.length < MIN_PUNKTOW) return zamknijPiercien(ring);
  return zamknijPiercien(sampled);
}

/** Granica wsi z bazy → obszar polowania (gdy sołtys nie chce rysować ręcznie). */
export function polygonZGranicyWsi(boundary: unknown): GeoJsonPolygonPolowania | null {
  const ring = pierwszyPierscienZGeo(boundary);
  if (!ring) return null;
  const uproszczony = uproszczPierscien(ring);
  return walidujObszarPolowania({ type: "Polygon", coordinates: [uproszczony] });
}
