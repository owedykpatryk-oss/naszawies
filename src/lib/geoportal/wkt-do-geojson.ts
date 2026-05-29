import type { GeoJsonPolygonPolowania } from "@/lib/lowiectwo/geojson-obszar";

type GeoJsonMultiPolygon = {
  type: "MultiPolygon";
  coordinates: [number, number][][][];
};

export type GeoJsonGeometriiDzialki = GeoJsonPolygonPolowania | GeoJsonMultiPolygon;

function oczyscWkt(wkt: string): string {
  const s = wkt.trim();
  const idx = s.indexOf("POLYGON");
  const idxM = s.indexOf("MULTIPOLYGON");
  if (idxM >= 0) return s.slice(idxM);
  if (idx >= 0) return s.slice(idx);
  return s;
}

/** Parsuje WKT POLYGON / MULTIPOLYGON (WGS84 lon,lat) z ULDK. */
export function wktDoGeojson(wkt: string): GeoJsonGeometriiDzialki | null {
  const s = oczyscWkt(wkt);
  if (!s) return null;

  const polyMatch = /^POLYGON\s*\(\((.+)\)\)$/i.exec(s.replace(/\s+/g, " "));
  if (polyMatch) {
    const ring = parsujPiercienWkt(polyMatch[1]!);
    if (!ring || ring.length < 4) return null;
    return { type: "Polygon", coordinates: [ring] };
  }

  const multiMatch = /^MULTIPOLYGON\s*\(\((.+)\)\)$/i.exec(s.replace(/\s+/g, " "));
  if (multiMatch) {
    const wnetrze = multiMatch[1]!;
    const polygony: [number, number][][][] = [];
    const czesci = rozdzielPolygonyMulti(wnetrze);
    for (const cz of czesci) {
      const piercienie = rozdzielPiercienie(cz);
      const coords: [number, number][][] = [];
      for (const p of piercienie) {
        const ring = parsujPiercienWkt(p);
        if (ring && ring.length >= 4) coords.push(ring);
      }
      if (coords.length > 0) polygony.push(coords);
    }
    if (polygony.length === 0) return null;
    if (polygony.length === 1 && polygony[0]!.length === 1) {
      return { type: "Polygon", coordinates: [polygony[0]![0]!] };
    }
    return { type: "MultiPolygon", coordinates: polygony };
  }

  return null;
}

function parsujPiercienWkt(tekst: string): [number, number][] | null {
  const punkty = tekst.split(",").map((p) => p.trim());
  const ring: [number, number][] = [];
  for (const pt of punkty) {
    const czesci = pt.split(/\s+/).filter(Boolean);
    if (czesci.length < 2) continue;
    const lng = Number(czesci[0]);
    const lat = Number(czesci[1]);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
    if (lng < 13 || lng > 25 || lat < 48 || lat > 55) return null;
    ring.push([lng, lat]);
  }
  if (ring.length < 3) return null;
  const first = ring[0]!;
  const last = ring[ring.length - 1]!;
  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push(first);
  }
  return ring;
}

function rozdzielPolygonyMulti(wnetrze: string): string[] {
  const wynik: string[] = [];
  let glebokosc = 0;
  let start = 0;
  for (let i = 0; i < wnetrze.length; i++) {
    if (wnetrze[i] === "(") {
      if (glebokosc === 0) start = i + 1;
      glebokosc++;
    } else if (wnetrze[i] === ")") {
      glebokosc--;
      if (glebokosc === 0) {
        wynik.push(wnetrze.slice(start, i));
      }
    }
  }
  return wynik;
}

function rozdzielPiercienie(polygonInner: string): string[] {
  const wynik: string[] = [];
  let glebokosc = 0;
  let start = 0;
  for (let i = 0; i < polygonInner.length; i++) {
    if (polygonInner[i] === "(") {
      if (glebokosc === 0) start = i + 1;
      glebokosc++;
    } else if (polygonInner[i] === ")") {
      glebokosc--;
      if (glebokosc === 0) {
        wynik.push(polygonInner.slice(start, i));
      }
    }
  }
  if (wynik.length === 0 && polygonInner.trim()) {
    return [polygonInner.trim()];
  }
  return wynik;
}

/** Przybliżona powierzchnia w m² (projekcja lokalna na środku Polski). */
export function obliczPowierzchnieGeometriiM2(geo: GeoJsonGeometriiDzialki): number | null {
  const piercienie: [number, number][][] = [];
  if (geo.type === "Polygon") {
    if (geo.coordinates[0]) piercienie.push(geo.coordinates[0]);
  } else {
    for (const poly of geo.coordinates) {
      if (poly[0]) piercienie.push(poly[0]);
    }
  }
  if (piercienie.length === 0) return null;
  let suma = 0;
  for (const ring of piercienie) {
    const a = powierzchniaPierscieniaM2(ring);
    if (a != null) suma += a;
  }
  return suma > 0 ? Math.round(suma) : null;
}

function powierzchniaPierscieniaM2(ring: [number, number][]): number | null {
  const pts =
    ring.length >= 4 &&
    ring[0]![0] === ring[ring.length - 1]![0] &&
    ring[0]![1] === ring[ring.length - 1]![1]
      ? ring.slice(0, -1)
      : ring;
  if (pts.length < 3) return null;

  const lat0 = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  const rad = (Math.PI * lat0) / 180;
  const mNaStopienLat = 111_320;
  const mNaStopienLng = 111_320 * Math.cos(rad);

  const xy = pts.map(([lng, lat]) => [lng * mNaStopienLng, lat * mNaStopienLat] as [number, number]);
  let sum = 0;
  for (let i = 0; i < xy.length; i++) {
    const j = (i + 1) % xy.length;
    sum += xy[i]![0] * xy[j]![1] - xy[j]![0] * xy[i]![1];
  }
  return Math.abs(sum) / 2;
}

export function centroidGeometriiDzialki(geo: GeoJsonGeometriiDzialki): { lat: number; lng: number } | null {
  const ring =
    geo.type === "Polygon"
      ? geo.coordinates[0]
      : geo.coordinates[0]?.[0];
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
  return { lat: sumLat / pts.length, lng: sumLng / pts.length };
}
