import type { ZnacznikRynekDzialka } from "@/components/mapa/mapa-wsi-leaflet";
import { formatujPowierzchnieDzialki } from "@/lib/marketplace/nieruchomosci";
import { etykietaKategoriiOgloszenia } from "@/lib/marketplace/kategorie-ogloszen";

type WierszDzialka = {
  id: string;
  title: string;
  listing_type: string;
  equipment_category?: string | null;
  category?: string | null;
  parcel_geojson: unknown;
  parcel_area_m2?: number | null;
  village_id: string;
};

export function mapujDzialkiRynekDlaMapy(
  wiersze: WierszDzialka[] | null,
  wiesPoId: Map<string, { name: string; sciezka: string }>,
): ZnacznikRynekDzialka[] {
  if (!wiersze?.length) return [];
  const out: ZnacznikRynekDzialka[] = [];
  for (const r of wiersze) {
    if (!r.parcel_geojson) continue;
    const w = wiesPoId.get(r.village_id);
    if (!w) continue;
    const kat = r.equipment_category ?? r.category;
    out.push({
      id: r.id,
      title: r.title,
      href: `${w.sciezka}/rynek/${r.id}`,
      villageName: w.name,
      areaLabel: formatujPowierzchnieDzialki(r.parcel_area_m2) ?? undefined,
      categoryLabel: kat ? (etykietaKategoriiOgloszenia(kat) ?? undefined) : undefined,
      parcelGeojson: r.parcel_geojson,
    });
  }
  return out;
}
