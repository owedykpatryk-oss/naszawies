import type { ZnacznikPoi } from "@/components/mapa/mapa-wsi-leaflet";

/** Lekki podpis listy POI — pomija pełną przebudowę klastra gdy dane się nie zmieniły. */
export function podpisWarstwyPoi(punkty: readonly Pick<ZnacznikPoi, "id" | "lat" | "lon" | "category">[]): string {
  if (punkty.length === 0) return "";
  const czesci: string[] = new Array(punkty.length);
  for (let i = 0; i < punkty.length; i++) {
    const p = punkty[i]!;
    czesci[i] = `${p.id}:${p.lat}:${p.lon}:${p.category}`;
  }
  czesci.sort();
  return czesci.join("|");
}
