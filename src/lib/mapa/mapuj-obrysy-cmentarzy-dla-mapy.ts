import type { ZnacznikCmentarzObrys } from "@/components/mapa/mapa-wsi-leaflet";

type WierszPlanuCmentarza = {
  id: string;
  village_id: string;
  name: string;
  boundary_geojson: unknown;
  is_published: boolean;
};

export function mapujObrysyCmentarzyDlaMapy(
  plany: WierszPlanuCmentarza[] | null,
  wiesPoId: Map<string, { name: string; sciezka: string }>,
): ZnacznikCmentarzObrys[] {
  if (!plany?.length) return [];
  const out: ZnacznikCmentarzObrys[] = [];
  for (const p of plany) {
    if (!p.is_published || !p.boundary_geojson) continue;
    const w = wiesPoId.get(p.village_id);
    if (!w) continue;
    out.push({
      id: p.id,
      villageId: p.village_id,
      name: p.name,
      villageName: w.name,
      sciezkaWsi: w.sciezka,
      hrefPlan: `${w.sciezka}/cmentarz`,
      boundaryGeojson: p.boundary_geojson,
    });
  }
  return out;
}

/** Mapa village_id → URL planu cmentarza (opublikowany). */
export function linkiPlanuCmentarzaPoWsi(
  plany: WierszPlanuCmentarza[] | null,
  wiesPoId: Map<string, { name: string; sciezka: string }>,
): Map<string, string> {
  const m = new Map<string, string>();
  for (const p of plany ?? []) {
    if (!p.is_published) continue;
    const w = wiesPoId.get(p.village_id);
    if (!w) continue;
    m.set(p.village_id, `${w.sciezka}/cmentarz`);
  }
  return m;
}
