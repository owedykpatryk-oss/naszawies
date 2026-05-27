import type { ZnacznikRynek } from "@/components/mapa/mapa-wsi-leaflet";
import { etykietaTypuOgloszenia } from "@/lib/marketplace/kategorie-ogloszen";

type WierszRynek = {
  id: string;
  title: string;
  listing_type: string;
  latitude: string | number | null;
  longitude: string | number | null;
  village_id: string;
};

export function mapujOgloszeniaRynekDlaMapy(
  wiersze: WierszRynek[] | null,
  wiesPoId: Map<string, { name: string; sciezka: string }>,
): ZnacznikRynek[] {
  if (!wiersze?.length) return [];
  const out: ZnacznikRynek[] = [];
  for (const r of wiersze) {
    const w = wiesPoId.get(r.village_id);
    if (!w) continue;
    const lat = typeof r.latitude === "number" ? r.latitude : Number.parseFloat(String(r.latitude));
    const lon = typeof r.longitude === "number" ? r.longitude : Number.parseFloat(String(r.longitude));
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    out.push({
      id: r.id,
      title: r.title,
      listingType: r.listing_type,
      listingTypeLabel: etykietaTypuOgloszenia(r.listing_type),
      lat,
      lon,
      villageName: w.name,
      sciezkaWsi: w.sciezka,
      href: `${w.sciezka}/rynek/${r.id}`,
    });
  }
  return out;
}
