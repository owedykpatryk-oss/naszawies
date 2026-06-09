import type { SupabaseClient } from "@supabase/supabase-js";
import type { ZnacznikPoi } from "@/components/mapa/mapa-wsi-leaflet";
import { mapujPoiDlaMapy, POLE_SELECT_POI_MAPY, type WierszPoiMapy } from "@/lib/mapa/mapuj-poi-dla-mapy";
import { podzielNaPartie } from "@/lib/mapa/podziel-na-partie";

/** POI tylko dla wskazanych wsi — partiami, bez skanowania całej tabeli. */
export async function pobierzPoiDlaWsiIds(
  supabase: SupabaseClient,
  idsWsi: string[],
  wiesPoId: Map<string, { name: string; sciezka: string }>,
): Promise<{ punktyPoi: ZnacznikPoi[]; blad: string | null }> {
  if (idsWsi.length === 0) return { punktyPoi: [], blad: null };

  const wiersze: WierszPoiMapy[] = [];
  let pierwszyBlad: string | null = null;

  for (const partia of podzielNaPartie(idsWsi, 120)) {
    const { data, error } = await supabase
      .from("pois")
      .select(POLE_SELECT_POI_MAPY)
      .in("village_id", partia)
      .limit(8000);
    if (error) {
      pierwszyBlad = pierwszyBlad ?? error.message;
      continue;
    }
    wiersze.push(...((data ?? []) as WierszPoiMapy[]));
  }

  return {
    punktyPoi: mapujPoiDlaMapy(wiersze, wiesPoId),
    blad: pierwszyBlad,
  };
}
