import type { SupabaseClient } from "@supabase/supabase-js";
import { aktywnyBannerRynku } from "@/lib/marketplace/banner-rynku";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { pojedynczaWies } from "@/lib/supabase/wies-z-zapytania";

export type WiesNaHubieRynku = {
  id: string;
  name: string;
  commune: string;
  county: string;
  voivodeship: string;
  sciezka: string;
  sciezkaRynek: string;
  liczbaOgloszen: number;
  banner?: string | null;
};

export type OstatnieOgloszenieHub = {
  id: string;
  title: string;
  sciezka: string;
  sciezkaWsiRynek: string;
  nazwaWsi: string;
  gmina: string;
  published_at: string | null;
  listing_type: string;
  equipment_category: string | null;
  category: string | null;
  price_amount: number | null;
  price_unit: string | null;
  currency: string | null;
  image_urls: string[] | null;
  seller_verified: boolean | null;
  geoportal_parcel_id: string | null;
  parcel_area_m2: number | null;
  parcel_number: string | null;
  view_count?: number;
};

export type HubRynkuDane = {
  wsie: WiesNaHubieRynku[];
  ostatnie: OstatnieOgloszenieHub[];
  lacznieOgloszen: number;
  lacznieWsi: number;
};

type WierszWiesHub = {
  id: string;
  name: string;
  slug: string;
  voivodeship: string;
  county: string;
  commune: string;
  rynek_banner_text: string | null;
  rynek_banner_until: string | null;
};

type WierszListing = {
  id: string;
  village_id: string;
  title: string;
  listing_type: string;
  equipment_category: string | null;
  category: string | null;
  price_amount: number | null;
  price_unit: string | null;
  currency: string | null;
  image_urls: string[] | null;
  seller_verified: boolean | null;
  geoportal_parcel_id: string | null;
  parcel_area_m2: number | null;
  parcel_number: string | null;
  view_count: number | null;
  published_at: string | null;
  villages: WierszWiesHub | WierszWiesHub[] | null;
};

export async function pobierzHubRynku(supabase: SupabaseClient): Promise<HubRynkuDane> {
  const { data: wiersze } = await supabase
    .from("marketplace_listings")
    .select(
      "id, village_id, title, listing_type, equipment_category, category, price_amount, price_unit, currency, image_urls, seller_verified, geoportal_parcel_id, parcel_area_m2, parcel_number, view_count, published_at, villages(id, name, slug, voivodeship, county, commune, rynek_banner_text, rynek_banner_until)",
    )
    .eq("status", "approved")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(1200);

  const mapaWsi = new Map<string, WiesNaHubieRynku>();
  const ostatnie: OstatnieOgloszenieHub[] = [];

  for (const row of (wiersze ?? []) as WierszListing[]) {
    const v = pojedynczaWies<WierszWiesHub>(row.villages);
    if (!v) continue;

    const sciezka = sciezkaProfiluWsi(v);
    const istniejaca = mapaWsi.get(v.id);
    const banner = aktywnyBannerRynku(v.rynek_banner_text, v.rynek_banner_until);

    if (!istniejaca) {
      mapaWsi.set(v.id, {
        id: v.id,
        name: v.name,
        commune: v.commune,
        county: v.county,
        voivodeship: v.voivodeship,
        sciezka,
        sciezkaRynek: `${sciezka}/rynek`,
        liczbaOgloszen: 1,
        banner,
      });
    } else {
      istniejaca.liczbaOgloszen += 1;
      if (banner && !istniejaca.banner) istniejaca.banner = banner;
    }

    if (ostatnie.length < 12) {
      ostatnie.push({
        id: row.id,
        title: row.title,
        sciezka: `${sciezka}/rynek/${row.id}`,
        sciezkaWsiRynek: `${sciezka}/rynek`,
        nazwaWsi: v.name,
        gmina: v.commune,
        published_at: row.published_at,
        listing_type: row.listing_type,
        equipment_category: row.equipment_category,
        category: row.category,
        price_amount: row.price_amount,
        price_unit: row.price_unit,
        currency: row.currency,
        image_urls: row.image_urls,
        seller_verified: row.seller_verified,
        geoportal_parcel_id: row.geoportal_parcel_id,
        parcel_area_m2: row.parcel_area_m2,
        parcel_number: row.parcel_number,
        view_count: row.view_count ?? undefined,
      });
    }
  }

  const wsie = Array.from(mapaWsi.values()).sort((a, b) => {
    if (b.liczbaOgloszen !== a.liczbaOgloszen) return b.liczbaOgloszen - a.liczbaOgloszen;
    return a.name.localeCompare(b.name, "pl");
  });

  return {
    wsie,
    ostatnie,
    lacznieOgloszen: wiersze?.length ?? 0,
    lacznieWsi: wsie.length,
  };
}
