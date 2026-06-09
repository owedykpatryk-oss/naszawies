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
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

type WierszRpc = {
  id: string;
  name: string;
  slug: string;
  voivodeship: string;
  county: string;
  commune: string;
  teryt_id: string;
  gmina_teryt_kod?: string | null;
  powiat_teryt_kod?: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  population: number | null;
  boundary_geojson: unknown | null;
  public_offers_count: number | string | null;
};

function doLiczby(v: string | number | null | undefined): number {
  if (v == null) return NaN;
  return typeof v === "number" ? v : Number.parseFloat(String(v));
}

function doLiczbyCalkowitej(v: number | string | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "number" ? Math.trunc(v) : Number.parseInt(String(v), 10) || 0;
}

export type PubliczneDaneMapy = {
  znaczniki: ZnacznikWsi[];
  punktyPoi: ZnacznikPoi[];
  punktyRynek: ZnacznikRynek[];
  punktyRynekDzialki: ZnacznikRynekDzialka[];
  obrysyCmentarzy: ZnacznikCmentarzObrys[];
  bladZapytania: string | null;
};

function mapujZnacznikiRpc(wiersze: WierszRpc[]): ZnacznikWsi[] {
  return wiersze.flatMap((w) => {
    const lat = doLiczby(w.latitude);
    const lon = doLiczby(w.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lon)) return [];
    return [
      {
        id: w.id,
        name: w.name,
        sciezka: sciezkaProfiluWsi({
          voivodeship: w.voivodeship,
          county: w.county,
          commune: w.commune,
          slug: w.slug,
        }),
        lat,
        lon,
        population: w.population,
        boundary_geojson: w.boundary_geojson ?? null,
        public_offers_count: doLiczbyCalkowitej(w.public_offers_count),
        commune: w.commune,
        county: w.county,
        voivodeship: w.voivodeship,
        teryt_id: w.teryt_id,
        gmina_teryt_kod: w.gmina_teryt_kod ?? undefined,
        powiat_teryt_kod: w.powiat_teryt_kod ?? undefined,
      },
    ];
  });
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

  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return { ...puste, bladZapytania: "Mapa jest chwilowo niedostępna. Spróbuj ponownie później." };
  }

  const { data, error } = await supabase.rpc("mapa_wsi_znaczniki");
  let znaczniki: ZnacznikWsi[] = [];
  let bladZapytania: string | null = null;

  if (!error && data && Array.isArray(data)) {
    znaczniki = mapujZnacznikiRpc(data as WierszRpc[]);
  } else {
    const opisRpc = error?.message ?? "Nie udało się wczytać mapy.";
    const { data: wiersze, error: err2 } = await supabase
      .from("villages")
      .select("id, name, slug, voivodeship, county, commune, teryt_id, latitude, longitude, population")
      .eq("is_active", true)
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .order("name", { ascending: true })
      .limit(800);

    if (err2) {
      return { ...puste, bladZapytania: `${opisRpc} · ${err2.message}` };
    }

    znaczniki = (wiersze ?? []).flatMap((w) => {
      const lat = doLiczby(w.latitude as string | number | null);
      const lon = doLiczby(w.longitude as string | number | null);
      if (Number.isNaN(lat) || Number.isNaN(lon)) return [];
      return [
        {
          id: w.id,
          name: w.name,
          sciezka: sciezkaProfiluWsi({
            voivodeship: w.voivodeship,
            county: w.county,
            commune: w.commune,
            slug: w.slug,
          }),
          lat,
          lon,
          population: (w as { population?: number | null }).population ?? null,
          boundary_geojson: null,
          public_offers_count: 0,
          commune: w.commune,
          county: w.county,
          voivodeship: w.voivodeship,
          teryt_id: (w as { teryt_id?: string }).teryt_id,
        },
      ];
    });
    bladZapytania = error
      ? `${opisRpc} · Wyświetlono listę wsi w trybie ograniczonym (np. bez liczników ofert).`
      : null;
  }

  if (znaczniki.length === 0) {
    return { ...puste, znaczniki, bladZapytania };
  }

  const wiesPoId = new Map(znaczniki.map((z) => [z.id, { name: z.name, sciezka: z.sciezka } as const]));
  const idsWsi = znaczniki.map((z) => z.id);

  const [
    { data: wierszePoi, error: errPoi },
    { data: planyCmentarza },
    { data: wierszeRynek },
    { data: wierszeDzialki },
  ] = await Promise.all([
    supabase.from("pois").select(POLE_SELECT_POI_MAPY).in("village_id", idsWsi).limit(2500),
    supabase
      .from("village_cemetery_plans")
      .select("id, village_id, name, boundary_geojson, is_published")
      .in("village_id", idsWsi)
      .eq("is_published", true)
      .limit(120),
    supabase
      .from("marketplace_listings")
      .select("id, title, listing_type, latitude, longitude, village_id")
      .in("village_id", idsWsi)
      .eq("status", "approved")
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .limit(400),
    supabase
      .from("marketplace_listings")
      .select("id, title, listing_type, equipment_category, category, parcel_geojson, parcel_area_m2, village_id")
      .in("village_id", idsWsi)
      .eq("status", "approved")
      .not("parcel_geojson", "is", null)
      .limit(120),
  ]);

  let punktyPoi: ZnacznikPoi[] = [];
  if (!errPoi && wierszePoi) {
    punktyPoi = mapujPoiDlaMapy(wierszePoi as WierszPoiMapy[], wiesPoId);
  }

  const linkiPlanu = linkiPlanuCmentarzaPoWsi(
    (planyCmentarza ?? []) as Parameters<typeof linkiPlanuCmentarzaPoWsi>[0],
    wiesPoId,
  );
  if (linkiPlanu.size > 0) {
    punktyPoi = punktyPoi.map((p) => {
      if (p.category.trim().toLowerCase() !== "cmentarz") return p;
      const link = linkiPlanu.get(p.villageId);
      return link ? { ...p, linkPlanuCmentarza: link } : p;
    });
  }

  return {
    znaczniki,
    punktyPoi,
    punktyRynek: mapujOgloszeniaRynekDlaMapy(
      (wierszeRynek ?? []) as Parameters<typeof mapujOgloszeniaRynekDlaMapy>[0],
      wiesPoId,
    ),
    punktyRynekDzialki: mapujDzialkiRynekDlaMapy(
      (wierszeDzialki ?? []) as Parameters<typeof mapujDzialkiRynekDlaMapy>[0],
      wiesPoId,
    ),
    obrysyCmentarzy: mapujObrysyCmentarzyDlaMapy(
      (planyCmentarza ?? []) as Parameters<typeof mapujObrysyCmentarzyDlaMapy>[0],
      wiesPoId,
    ),
    bladZapytania,
  };
}

/** Współdzielone dane mapy (znaczniki + warstwy publiczne) — cache 2 min. */
export const pobierzPubliczneDaneMapy = unstable_cache(
  pobierzPubliczneDaneMapyRaw,
  ["mapa-publiczne-warstwy-v2"],
  { revalidate: 120 },
);
