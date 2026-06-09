import { unstable_cache } from "next/cache";
import type {
  ZnacznikCmentarzObrys,
  ZnacznikPoi,
  ZnacznikRynek,
  ZnacznikRynekDzialka,
  ZnacznikWsi,
} from "@/components/mapa/mapa-wsi-leaflet";
import { mapujObrysyCmentarzyDlaMapy, linkiPlanuCmentarzaPoWsi } from "@/lib/mapa/mapuj-obrysy-cmentarzy-dla-mapy";
import { mapujPoiDlaMapy, POLE_SELECT_POI_MAPY, type WierszPoiMapy } from "@/lib/mapa/mapuj-poi-dla-mapy";
import { mapujOgloszeniaRynekDlaMapy } from "@/lib/mapa/rynek-na-mapie";
import { mapujDzialkiRynekDlaMapy } from "@/lib/mapa/rynek-dzialki-na-mapie";
import { pobierzZnacznikiMapyPaginacja } from "@/lib/mapa/pobierz-znaczniki-mapy-paginacja";
import { pobierzWierszePaginacja } from "@/lib/mapa/pobierz-wiersze-paginacja";
import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";

export type PubliczneDaneMapy = {
  znaczniki: ZnacznikWsi[];
  punktyPoi: ZnacznikPoi[];
  punktyRynek: ZnacznikRynek[];
  punktyRynekDzialki: ZnacznikRynekDzialka[];
  obrysyCmentarzy: ZnacznikCmentarzObrys[];
  bladZapytania: string | null;
};

function klientMapySerwer() {
  return createAdminSupabaseClient() ?? createPublicSupabaseClient();
}

async function pobierzPubliczneDaneMapyRaw(): Promise<PubliczneDaneMapy> {
  const puste: PubliczneDaneMapy = {
    znaczniki: [],
    punktyPoi: [],
    punktyRynek: [],
    punktyRynekDzialki: [],
    obrysyCmentarzy: [],
    bladZapytania: null,
  };

  const supabase = klientMapySerwer();
  if (!supabase) {
    return { ...puste, bladZapytania: "Mapa jest chwilowo niedostępna. Spróbuj ponownie później." };
  }

  const { znaczniki, blad } = await pobierzZnacznikiMapyPaginacja(supabase);
  if (znaczniki.length === 0) {
    return {
      ...puste,
      bladZapytania: blad ?? "Nie udało się wczytać listy wsi na mapę.",
    };
  }

  const wiesPoId = new Map(znaczniki.map((z) => [z.id, { name: z.name, sciezka: z.sciezka } as const]));
  const idsWsi = new Set(znaczniki.map((z) => z.id));

  const [
    { wiersze: wierszePoi, blad: errPoi },
    { wiersze: wierszeRynek },
    { wiersze: wierszeDzialki },
    { wiersze: planyCmentarza },
  ] = await Promise.all([
    pobierzWierszePaginacja(supabase, (sb, from, to) =>
      sb.from("pois").select(POLE_SELECT_POI_MAPY).order("id").range(from, to),
    ),
    pobierzWierszePaginacja(supabase, (sb, from, to) =>
      sb
        .from("marketplace_listings")
        .select("id, title, listing_type, latitude, longitude, village_id")
        .eq("status", "approved")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .order("id")
        .range(from, to),
    ),
    pobierzWierszePaginacja(supabase, (sb, from, to) =>
      sb
        .from("marketplace_listings")
        .select("id, title, listing_type, equipment_category, category, parcel_geojson, parcel_area_m2, village_id")
        .eq("status", "approved")
        .not("parcel_geojson", "is", null)
        .order("id")
        .range(from, to),
    ),
    pobierzWierszePaginacja(supabase, (sb, from, to) =>
      sb
        .from("village_cemetery_plans")
        .select("id, village_id, name, boundary_geojson, is_published")
        .eq("is_published", true)
        .order("id")
        .range(from, to),
    ),
  ]);

  let punktyPoi: ZnacznikPoi[] = [];
  if (!errPoi) {
    punktyPoi = mapujPoiDlaMapy(wierszePoi as WierszPoiMapy[], wiesPoId);
  }

  const planyNaMapie = (planyCmentarza ?? []).filter((p) => idsWsi.has(p.village_id as string));
  const linkiPlanu = linkiPlanuCmentarzaPoWsi(
    planyNaMapie as Parameters<typeof linkiPlanuCmentarzaPoWsi>[0],
    wiesPoId,
  );
  if (linkiPlanu.size > 0) {
    punktyPoi = punktyPoi.map((p) => {
      if (p.category.trim().toLowerCase() !== "cmentarz") return p;
      const link = linkiPlanu.get(p.villageId);
      return link ? { ...p, linkPlanuCmentarza: link } : p;
    });
  }

  const rynekNaMapie = wierszeRynek.filter((r) => idsWsi.has(r.village_id as string));
  const dzialkiNaMapie = wierszeDzialki.filter((r) => idsWsi.has(r.village_id as string));

  return {
    znaczniki,
    punktyPoi,
    punktyRynek: mapujOgloszeniaRynekDlaMapy(
      rynekNaMapie as Parameters<typeof mapujOgloszeniaRynekDlaMapy>[0],
      wiesPoId,
    ),
    punktyRynekDzialki: mapujDzialkiRynekDlaMapy(
      dzialkiNaMapie as Parameters<typeof mapujDzialkiRynekDlaMapy>[0],
      wiesPoId,
    ),
    obrysyCmentarzy: mapujObrysyCmentarzyDlaMapy(
      planyNaMapie as Parameters<typeof mapujObrysyCmentarzyDlaMapy>[0],
      wiesPoId,
    ),
    bladZapytania: errPoi ? "Część punktów POI mogła się nie wczytać — odśwież mapę." : null,
  };
}

/** Współdzielone dane mapy (znaczniki + warstwy publiczne) — cache 2 min. */
export const pobierzPubliczneDaneMapy = unstable_cache(
  pobierzPubliczneDaneMapyRaw,
  ["mapa-publiczne-warstwy-v4"],
  { revalidate: 120 },
);
