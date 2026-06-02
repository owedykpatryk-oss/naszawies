import type { GeoJsonObject } from "geojson";
import type { ZnacznikWsi } from "@/components/mapa/mapa-wsi-leaflet";
import { granicaJakoGeoJson, wierzcholkiZGeoJson } from "@/lib/mapa/granica-geojson";

type Punkt = [number, number];

function cross(o: Punkt, a: Punkt, b: Punkt): number {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}

/** Otulina wypukła (orientacyjny obrys powiatu z granic wsi / punktów). */
export function otulinaWypukla(punkty: Punkt[]): Punkt[] {
  const unikalne = new Map<string, Punkt>();
  for (const p of punkty) {
    if (!Number.isFinite(p[0]) || !Number.isFinite(p[1])) continue;
    unikalne.set(`${p[0].toFixed(6)},${p[1].toFixed(6)}`, p);
  }
  const pts = Array.from(unikalne.values());
  if (pts.length < 3) return pts;

  const sorted = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  const lower: Punkt[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: Punkt[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

function zamknijPierscien(ring: Punkt[]): Punkt[] {
  if (ring.length < 3) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) return ring;
  return [...ring, first];
}

/** Polygon GeoJSON otuliny powiatu (szacunek — nie granica urzędowa TERYT). */
export function obrysPowiatuZznacznikow(wsi: ZnacznikWsi[]): GeoJsonObject | null {
  const punkty: Punkt[] = [];
  for (const z of wsi) {
    punkty.push([z.lon, z.lat]);
    const gj = granicaJakoGeoJson(z.boundary_geojson);
    if (gj) punkty.push(...wierzcholkiZGeoJson(gj));
  }
  const hull = otulinaWypukla(punkty);
  if (hull.length < 3) return null;
  const ring = zamknijPierscien(hull);
  return {
    type: "Polygon",
    coordinates: [ring],
  } as GeoJsonObject;
}
