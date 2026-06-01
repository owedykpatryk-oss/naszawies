import type { ZnacznikPoi } from "@/components/mapa/mapa-wsi-leaflet";
import type { WpisHistoriiPubliczny } from "@/lib/historia/typy-historii";

/** Syntetyczne POI na mapie sekcji historii (kategoria `historia_wydarzenie`). */
export function znacznikiHistoriiNaMapie(
  wpisy: WpisHistoriiPubliczny[],
  villageId: string,
  villageName: string,
  sciezkaWsi: string,
): ZnacznikPoi[] {
  return wpisy
    .filter((w) => w.latitude != null && w.longitude != null && Number.isFinite(w.latitude) && Number.isFinite(w.longitude))
    .map((w) => ({
      id: `hist-${w.id}`,
      villageId,
      villageName,
      sciezkaWsi,
      category: "historia_wydarzenie",
      name: w.title,
      description: w.location_label?.trim() || w.short_description?.trim() || null,
      lat: w.latitude!,
      lon: w.longitude!,
      photoUrl: w.media_urls[0] ?? null,
      photoCaption: w.era_label?.trim() || null,
      linkedEntityId: w.id,
    }));
}
