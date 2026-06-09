import { unstable_cache } from "next/cache";
import type {
  ZnacznikCmentarzObrys,
  ZnacznikPoi,
  ZnacznikRynek,
  ZnacznikRynekDzialka,
  ZnacznikWsi,
} from "@/components/mapa/mapa-wsi-leaflet";
import { mapujObrysyCmentarzyDlaMapy, linkiPlanuCmentarzaPoWsi } from "@/lib/mapa/mapuj-obrysy-cmentarzy-dla-mapy";
import { mapujOgloszeniaRynekDlaMapy } from "@/lib/mapa/rynek-na-mapie";
import { mapujDzialkiRynekDlaMapy } from "@/lib/mapa/rynek-dzialki-na-mapie";
import { pobierzPoiDlaWsiIds } from "@/lib/mapa/pobierz-poi-dla-wsi";
import { pobierzZnacznikiMapyPaginacja } from "@/lib/mapa/pobierz-znaczniki-mapy-paginacja";
import { podzielNaPartie } from "@/lib/mapa/podziel-na-partie";
import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ZakresMapy = "nakielski" | "polska";

export type PubliczneDaneMapy = {
  znaczniki: ZnacznikWsi[];
  punktyPoi: ZnacznikPoi[];
  punktyRynek: ZnacznikRynek[];
  punktyRynekDzialki: ZnacznikRynekDzialka[];
  obrysyCmentarzy: ZnacznikCmentarzObrys[];
  bladZapytania: string | null;
  zakres: ZakresMapy;
};

export type OpcjePubliczneDaneMapy = {
  zakres?: ZakresMapy;
  tylkoZnaczniki?: boolean;
};

function klientMapySerwer() {
  return createAdminSupabaseClient() ?? createPublicSupabaseClient();
}

function countyDlaZakresu(zakres: ZakresMapy): string | null {
  return zakres === "nakielski" ? "nakielski" : null;
}

async function pobierzRynekDlaWsi(
  supabase: SupabaseClient,
  idsWsi: string[],
): Promise<{ rynek: Record<string, unknown>[]; dzialki: Record<string, unknown>[] }> {
  const rynek: Record<string, unknown>[] = [];
  const dzialki: Record<string, unknown>[] = [];

  for (const partia of podzielNaPartie(idsWsi, 120)) {
    const [r1, r2] = await Promise.all([
      supabase
        .from("marketplace_listings")
        .select("id, title, listing_type, latitude, longitude, village_id")
        .in("village_id", partia)
        .eq("status", "approved")
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .limit(400),
      supabase
        .from("marketplace_listings")
        .select("id, title, listing_type, equipment_category, category, parcel_geojson, parcel_area_m2, village_id")
        .in("village_id", partia)
        .eq("status", "approved")
        .not("parcel_geojson", "is", null)
        .limit(120),
    ]);
    if (r1.data) rynek.push(...r1.data);
    if (r2.data) dzialki.push(...r2.data);
  }

  return { rynek, dzialki };
}

async function pobierzCmentarzeDlaWsi(
  supabase: SupabaseClient,
  idsWsi: string[],
): Promise<Record<string, unknown>[]> {
  const out: Record<string, unknown>[] = [];
  for (const partia of podzielNaPartie(idsWsi, 120)) {
    const { data } = await supabase
      .from("village_cemetery_plans")
      .select("id, village_id, name, boundary_geojson, is_published")
      .in("village_id", partia)
      .eq("is_published", true)
      .limit(120);
    if (data) out.push(...data);
  }
  return out;
}

async function pobierzPubliczneDaneMapyRaw(
  opts: OpcjePubliczneDaneMapy = {},
): Promise<PubliczneDaneMapy> {
  const zakres = opts.zakres ?? "nakielski";
  const puste: PubliczneDaneMapy = {
    znaczniki: [],
    punktyPoi: [],
    punktyRynek: [],
    punktyRynekDzialki: [],
    obrysyCmentarzy: [],
    bladZapytania: null,
    zakres,
  };

  const supabase = klientMapySerwer();
  if (!supabase) {
    return { ...puste, bladZapytania: "Mapa jest chwilowo niedostępna. Spróbuj ponownie później." };
  }

  const county = countyDlaZakresu(zakres);
  const { znaczniki, blad } = await pobierzZnacznikiMapyPaginacja(supabase, {
    county,
    maxStron: zakres === "nakielski" ? 1 : 5,
  });

  if (znaczniki.length === 0) {
    return { ...puste, bladZapytania: blad ?? "Nie udało się wczytać listy wsi na mapę." };
  }

  if (opts.tylkoZnaczniki) {
    return { ...puste, znaczniki, bladZapytania: blad };
  }

  const wiesPoId = new Map(znaczniki.map((z) => [z.id, { name: z.name, sciezka: z.sciezka } as const]));
  const idsWsi = znaczniki.map((z) => z.id);

  const [{ punktyPoi, blad: errPoi }, { rynek, dzialki }, planyCmentarza] = await Promise.all([
    pobierzPoiDlaWsiIds(supabase, idsWsi, wiesPoId),
    pobierzRynekDlaWsi(supabase, idsWsi),
    pobierzCmentarzeDlaWsi(supabase, idsWsi),
  ]);

  let poiFinal = punktyPoi;
  const linkiPlanu = linkiPlanuCmentarzaPoWsi(
    planyCmentarza as Parameters<typeof linkiPlanuCmentarzaPoWsi>[0],
    wiesPoId,
  );
  if (linkiPlanu.size > 0) {
    poiFinal = poiFinal.map((p) => {
      if (p.category.trim().toLowerCase() !== "cmentarz") return p;
      const link = linkiPlanu.get(p.villageId);
      return link ? { ...p, linkPlanuCmentarza: link } : p;
    });
  }

  return {
    znaczniki,
    punktyPoi: poiFinal,
    punktyRynek: mapujOgloszeniaRynekDlaMapy(
      rynek as Parameters<typeof mapujOgloszeniaRynekDlaMapy>[0],
      wiesPoId,
    ),
    punktyRynekDzialki: mapujDzialkiRynekDlaMapy(
      dzialki as Parameters<typeof mapujDzialkiRynekDlaMapy>[0],
      wiesPoId,
    ),
    obrysyCmentarzy: mapujObrysyCmentarzyDlaMapy(
      planyCmentarza as Parameters<typeof mapujObrysyCmentarzyDlaMapy>[0],
      wiesPoId,
    ),
    bladZapytania: errPoi ? "Część punktów POI mogła się nie wczytać — odśwież mapę." : blad,
    zakres,
  };
}

function cacheKey(zakres: ZakresMapy, tylkoZnaczniki: boolean): string[] {
  return ["mapa-publiczne-v5", zakres, tylkoZnaczniki ? "rdzen" : "pelne"];
}

export async function pobierzPubliczneDaneMapy(opts: OpcjePubliczneDaneMapy = {}): Promise<PubliczneDaneMapy> {
  const zakres = opts.zakres ?? "nakielski";
  const tylkoZnaczniki = opts.tylkoZnaczniki === true;
  const fn = unstable_cache(
    () => pobierzPubliczneDaneMapyRaw({ zakres, tylkoZnaczniki }),
    cacheKey(zakres, tylkoZnaczniki),
    { revalidate: 300 },
  );
  return fn();
}
