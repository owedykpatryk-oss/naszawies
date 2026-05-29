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
  nazwaWsi: string;
  gmina: string;
  published_at: string | null;
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
  published_at: string | null;
  villages: WierszWiesHub | WierszWiesHub[] | null;
};

export async function pobierzHubRynku(supabase: SupabaseClient): Promise<HubRynkuDane> {
  const { data: wiersze } = await supabase
    .from("marketplace_listings")
    .select(
      "id, village_id, title, published_at, villages(id, name, slug, voivodeship, county, commune, rynek_banner_text, rynek_banner_until)",
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
        nazwaWsi: v.name,
        gmina: v.commune,
        published_at: row.published_at,
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
