import { mapujDzialkiRynekDlaMapy } from "@/lib/mapa/rynek-dzialki-na-mapie";
import { mapujOgloszeniaRynekDlaMapy } from "@/lib/mapa/rynek-na-mapie";
import type { ZnacznikRynek, ZnacznikRynekDzialka } from "@/components/mapa/mapa-wsi-leaflet";

type WierszOgloszeniaMapa = {
  id: string;
  title: string;
  listing_type: string;
  equipment_category?: string | null;
  category?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  parcel_geojson?: unknown;
  parcel_area_m2?: number | null;
  village_id: string;
};

export function wyodrebnijWarstwyMapyRynkuZOgloszen(
  wiersze: WierszOgloszeniaMapa[],
  wiesPoId: Map<string, { name: string; sciezka: string }>,
): { punktyRynek: ZnacznikRynek[]; punktyRynekDzialki: ZnacznikRynekDzialka[] } {
  const geo: Parameters<typeof mapujOgloszeniaRynekDlaMapy>[0] = [];
  const dzialki: Parameters<typeof mapujDzialkiRynekDlaMapy>[0] = [];

  for (const r of wiersze) {
    const lat =
      typeof r.latitude === "number" ? r.latitude : Number.parseFloat(String(r.latitude ?? ""));
    const lon =
      typeof r.longitude === "number" ? r.longitude : Number.parseFloat(String(r.longitude ?? ""));
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      geo.push({
        id: r.id,
        title: r.title,
        listing_type: r.listing_type,
        latitude: lat,
        longitude: lon,
        village_id: r.village_id,
      });
    }
    if (r.parcel_geojson) {
      dzialki.push({
        id: r.id,
        title: r.title,
        listing_type: r.listing_type,
        equipment_category: r.equipment_category,
        category: r.category,
        parcel_geojson: r.parcel_geojson,
        parcel_area_m2: r.parcel_area_m2,
        village_id: r.village_id,
      });
    }
  }

  return {
    punktyRynek: mapujOgloszeniaRynekDlaMapy(geo, wiesPoId),
    punktyRynekDzialki: mapujDzialkiRynekDlaMapy(dzialki, wiesPoId),
  };
}
