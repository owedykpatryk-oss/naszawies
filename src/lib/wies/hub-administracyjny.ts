import type { SupabaseClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import {
  sciezkaGminy,
  sciezkaPowiatu,
  sciezkaProfiluWsi,
  sciezkaWojewodztwa,
} from "@/lib/wies/sciezka-publiczna";
import { slugCzesciAdministracyjnej } from "@/lib/wies/slug-administracyjny";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import {
  dolaczLicznikiPoiDoWsi,
  liczbaWsiZPoi,
  pobierzLicznikiPoiDlaWsi,
  sumaLicznikaPoi,
} from "@/lib/mapa/pobierz-liczniki-poi-wsi";

export type WiesNaHubie = {
  id: string;
  name: string;
  slug: string;
  voivodeship: string;
  county: string;
  commune: string;
  commune_type: string;
  population: number | null;
  is_active: boolean;
  sciezka: string;
  liczba_poi?: number;
};

export type GminaNaHubie = {
  commune: string;
  commune_type: string;
  liczba_wsi: number;
  liczba_aktywnych: number;
  sciezka: string;
};

export type PowiatNaHubie = {
  county: string;
  liczba_gmin: number;
  liczba_wsi: number;
  liczba_aktywnych: number;
  sciezka: string;
};

export type HubGminy = {
  poziom: "gmina";
  wojewodztwo: string;
  powiat: string;
  gmina: string;
  wies: WiesNaHubie[];
  liczba_poi: number;
  liczba_wsi_z_poi: number;
};

export type HubPowiatu = {
  poziom: "powiat";
  wojewodztwo: string;
  powiat: string;
  gminy: GminaNaHubie[];
  wies: WiesNaHubie[];
  liczba_poi: number;
  liczba_wsi_z_poi: number;
};

export type HubWojewodztwa = {
  poziom: "wojewodztwo";
  wojewodztwo: string;
  powiaty: PowiatNaHubie[];
  liczba_wsi: number;
  liczba_aktywnych: number;
};

function mapWies(w: {
  id: string;
  name: string;
  slug: string;
  voivodeship: string;
  county: string;
  commune: string;
  commune_type: string;
  population: number | null;
  is_active: boolean;
}): WiesNaHubie {
  return {
    ...w,
    sciezka: sciezkaProfiluWsi(w),
  };
}

export async function pobierzHubGminy(
  supabase: SupabaseClient,
  wojSeg: string,
  powSeg: string,
  gminaSeg: string,
): Promise<HubGminy | null> {
  const woj = slugCzesciAdministracyjnej(wojSeg);
  const pow = slugCzesciAdministracyjnej(powSeg);
  const gmina = slugCzesciAdministracyjnej(gminaSeg);

  const { data, error } = await supabase.rpc("hub_wsi_po_sciezce", {
    p_woj_slug: woj,
    p_pow_slug: pow,
    p_gmina_slug: gmina,
  });

  if (error || !data?.length) {
    return null;
  }

  const wiesSurowe = (data as Omit<WiesNaHubie, "sciezka" | "liczba_poi">[]).map(mapWies);
  const liczniki = await pobierzLicznikiPoiDlaWsi(supabase, wiesSurowe.map((w) => w.id));
  const wies = dolaczLicznikiPoiDoWsi(wiesSurowe, liczniki);
  const pierwsza = wies[0]!;

  return {
    poziom: "gmina",
    wojewodztwo: pierwsza.voivodeship,
    powiat: pierwsza.county,
    gmina: pierwsza.commune,
    wies,
    liczba_poi: sumaLicznikaPoi(liczniki),
    liczba_wsi_z_poi: liczbaWsiZPoi(liczniki),
  };
}

export async function pobierzHubPowiatu(
  supabase: SupabaseClient,
  wojSeg: string,
  powSeg: string,
): Promise<HubPowiatu | null> {
  const woj = slugCzesciAdministracyjnej(wojSeg);
  const pow = slugCzesciAdministracyjnej(powSeg);

  const [{ data: wiesRaw, error: errW }, { data: gminyRaw, error: errG }] = await Promise.all([
    supabase.rpc("hub_wsi_po_sciezce", { p_woj_slug: woj, p_pow_slug: pow, p_gmina_slug: null }),
    supabase.rpc("hub_gminy_w_powiacie", { p_woj_slug: woj, p_pow_slug: pow }),
  ]);

  if (errW || errG || !wiesRaw?.length) {
    return null;
  }

  const wiesSurowe = (wiesRaw as Omit<WiesNaHubie, "sciezka" | "liczba_poi">[]).map(mapWies);
  const liczniki = await pobierzLicznikiPoiDlaWsi(supabase, wiesSurowe.map((w) => w.id));
  const wies = dolaczLicznikiPoiDoWsi(wiesSurowe, liczniki);
  const pierwsza = wies[0]!;

  const gminy: GminaNaHubie[] = ((gminyRaw ?? []) as {
    commune: string;
    commune_type: string;
    liczba_wsi: number;
    liczba_aktywnych: number;
  }[]).map((g) => ({
    commune: g.commune,
    commune_type: g.commune_type,
    liczba_wsi: Number(g.liczba_wsi),
    liczba_aktywnych: Number(g.liczba_aktywnych),
    sciezka: sciezkaGminy({
      voivodeship: pierwsza.voivodeship,
      county: pierwsza.county,
      commune: g.commune,
    }),
  }));

  return {
    poziom: "powiat",
    wojewodztwo: pierwsza.voivodeship,
    powiat: pierwsza.county,
    gminy,
    wies,
    liczba_poi: sumaLicznikaPoi(liczniki),
    liczba_wsi_z_poi: liczbaWsiZPoi(liczniki),
  };
}

export async function pobierzHubWojewodztwa(
  supabase: SupabaseClient,
  wojSeg: string,
): Promise<HubWojewodztwa | null> {
  const woj = slugCzesciAdministracyjnej(wojSeg);

  const { data: powiatyRaw, error: errP } = await supabase.rpc("hub_powiaty_w_wojewodztwie", {
    p_woj_slug: woj,
  });

  if (errP || !powiatyRaw?.length) {
    return null;
  }

  type WierszPowiatu = {
    county: string;
    voivodeship: string;
    liczba_gmin: number;
    liczba_wsi: number;
    liczba_aktywnych: number;
  };

  const wiersze = powiatyRaw as WierszPowiatu[];
  const wojewodztwo = wiersze[0]!.voivodeship;

  const powiaty: PowiatNaHubie[] = wiersze.map((p) => ({
    county: p.county,
    liczba_gmin: Number(p.liczba_gmin),
    liczba_wsi: Number(p.liczba_wsi),
    liczba_aktywnych: Number(p.liczba_aktywnych),
    sciezka: sciezkaPowiatu({ voivodeship: wojewodztwo, county: p.county }),
  }));

  return {
    poziom: "wojewodztwo",
    wojewodztwo,
    powiaty,
    liczba_wsi: powiaty.reduce((s, p) => s + p.liczba_wsi, 0),
    liczba_aktywnych: powiaty.reduce((s, p) => s + p.liczba_aktywnych, 0),
  };
}

export function sciezkaHubuWgPoziomu(hub: HubGminy | HubPowiatu | HubWojewodztwa): string {
  if (hub.poziom === "gmina") {
    return sciezkaGminy({ voivodeship: hub.wojewodztwo, county: hub.powiat, commune: hub.gmina });
  }
  if (hub.poziom === "powiat") {
    return sciezkaPowiatu({ voivodeship: hub.wojewodztwo, county: hub.powiat });
  }
  return sciezkaWojewodztwa(hub.wojewodztwo);
}

function hubGminyCached(wojSeg: string, powSeg: string, gminaSeg: string) {
  return unstable_cache(
    async () => {
      const supabase = createPublicSupabaseClient();
      if (!supabase) return null;
      return pobierzHubGminy(supabase, wojSeg, powSeg, gminaSeg);
    },
    ["hub-gmina", wojSeg, powSeg, gminaSeg],
    { revalidate: 600 },
  )();
}

function hubPowiatuCached(wojSeg: string, powSeg: string) {
  return unstable_cache(
    async () => {
      const supabase = createPublicSupabaseClient();
      if (!supabase) return null;
      return pobierzHubPowiatu(supabase, wojSeg, powSeg);
    },
    ["hub-powiat", wojSeg, powSeg],
    { revalidate: 600 },
  )();
}

function hubWojewodztwaCached(wojSeg: string) {
  return unstable_cache(
    async () => {
      const supabase = createPublicSupabaseClient();
      if (!supabase) return null;
      return pobierzHubWojewodztwa(supabase, wojSeg);
    },
    ["hub-woj", wojSeg],
    { revalidate: 3600 },
  )();
}

/** Hub gminy z cache (SEO / katalog — dane rzadko się zmieniają). */
export async function pobierzHubGminyCached(wojSeg: string, powSeg: string, gminaSeg: string) {
  return hubGminyCached(wojSeg, powSeg, gminaSeg);
}

export async function pobierzHubPowiatuCached(wojSeg: string, powSeg: string) {
  return hubPowiatuCached(wojSeg, powSeg);
}

export async function pobierzHubWojewodztwaCached(wojSeg: string) {
  return hubWojewodztwaCached(wojSeg);
}
