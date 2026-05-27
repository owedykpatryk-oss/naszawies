import type { SupabaseClient } from "@supabase/supabase-js";
import {
  sciezkaGminy,
  sciezkaPowiatu,
  sciezkaProfiluWsi,
  sciezkaWojewodztwa,
} from "@/lib/wies/sciezka-publiczna";
import { slugCzesciAdministracyjnej } from "@/lib/wies/slug-administracyjny";

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
};

export type HubPowiatu = {
  poziom: "powiat";
  wojewodztwo: string;
  powiat: string;
  gminy: GminaNaHubie[];
  wies: WiesNaHubie[];
};

export type HubWojewodztwa = {
  poziom: "wojewodztwo";
  wojewodztwo: string;
  powiaty: PowiatNaHubie[];
  wies: WiesNaHubie[];
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

  const wies = (data as Omit<WiesNaHubie, "sciezka">[]).map(mapWies);
  const pierwsza = wies[0]!;

  return {
    poziom: "gmina",
    wojewodztwo: pierwsza.voivodeship,
    powiat: pierwsza.county,
    gmina: pierwsza.commune,
    wies,
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

  const wies = (wiesRaw as Omit<WiesNaHubie, "sciezka">[]).map(mapWies);
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
  };
}

export async function pobierzHubWojewodztwa(
  supabase: SupabaseClient,
  wojSeg: string,
): Promise<HubWojewodztwa | null> {
  const woj = slugCzesciAdministracyjnej(wojSeg);

  const [{ data: wiesRaw, error: errW }, { data: powiatyRaw, error: errP }] = await Promise.all([
    supabase.rpc("hub_wsi_po_sciezce", { p_woj_slug: woj, p_pow_slug: null, p_gmina_slug: null }),
    supabase.rpc("hub_powiaty_w_wojewodztwie", { p_woj_slug: woj }),
  ]);

  if (errW || errP || !wiesRaw?.length) {
    return null;
  }

  const wies = (wiesRaw as Omit<WiesNaHubie, "sciezka">[]).map(mapWies);
  const pierwsza = wies[0]!;

  const powiaty: PowiatNaHubie[] = ((powiatyRaw ?? []) as {
    county: string;
    liczba_gmin: number;
    liczba_wsi: number;
    liczba_aktywnych: number;
  }[]).map((p) => ({
    county: p.county,
    liczba_gmin: Number(p.liczba_gmin),
    liczba_wsi: Number(p.liczba_wsi),
    liczba_aktywnych: Number(p.liczba_aktywnych),
    sciezka: sciezkaPowiatu({ voivodeship: pierwsza.voivodeship, county: p.county }),
  }));

  return {
    poziom: "wojewodztwo",
    wojewodztwo: pierwsza.voivodeship,
    powiaty,
    wies,
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
