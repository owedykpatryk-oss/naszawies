import type { SupabaseClient } from "@supabase/supabase-js";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { slugCzesciZBazy } from "@/lib/wies/slug-administracyjny";

/** Oficjalne nazwy 16 województw — slug liczony tym samym algorytmem co w bazie (`slug_pl`). */
const NAZWY_WOJEWODZTW = [
  "dolnośląskie",
  "kujawsko-pomorskie",
  "lubelskie",
  "lubuskie",
  "łódzkie",
  "małopolskie",
  "mazowieckie",
  "opolskie",
  "podkarpackie",
  "podlaskie",
  "pomorskie",
  "śląskie",
  "świętokrzyskie",
  "warmińsko-mazurskie",
  "wielkopolskie",
  "zachodniopomorskie",
] as const;

export type ElementKatalogu = {
  nazwa: string;
  slug: string;
  liczba?: number;
};

export type WiesKatalogu = {
  id: string;
  nazwa: string;
  gmina: string;
  powiat: string;
  wojewodztwo: string;
  sciezka: string;
};

export async function pobierzWojewodztwaKatalog(supabase: SupabaseClient): Promise<ElementKatalogu[]> {
  const { data, error } = await supabase.rpc("hub_podsumowanie_wojewodztw");
  if (error) {
    console.warn("[pobierzWojewodztwaKatalog]", error.message);
    return NAZWY_WOJEWODZTW.map((nazwa) => ({
      nazwa,
      slug: slugCzesciZBazy(nazwa),
      liczba: undefined,
    })).sort((a, b) => a.nazwa.localeCompare(b.nazwa, "pl"));
  }

  const poSlug = new Map(
    ((data ?? []) as { voivodeship: string; voivodeship_slug: string; liczba_wsi: number }[]).map((r) => [
      r.voivodeship_slug,
      { nazwa: r.voivodeship, liczba: Number(r.liczba_wsi) },
    ]),
  );

  return NAZWY_WOJEWODZTW.map((nazwa) => {
    const slug = slugCzesciZBazy(nazwa);
    const wiersz = poSlug.get(slug);
    return { nazwa, slug, liczba: wiersz?.liczba ?? 0 };
  }).sort((a, b) => a.nazwa.localeCompare(b.nazwa, "pl"));
}

export async function pobierzPowiatyKatalog(
  supabase: SupabaseClient,
  wojSlug: string,
): Promise<ElementKatalogu[]> {
  const { data, error } = await supabase.rpc("hub_powiaty_w_wojewodztwie", { p_woj_slug: wojSlug });
  if (error || !data?.length) return [];
  return (data as { county: string; liczba_wsi: number }[]).map((p) => ({
    nazwa: p.county,
    slug: slugCzesciZBazy(p.county),
    liczba: Number(p.liczba_wsi),
  }));
}

export async function pobierzGminyKatalog(
  supabase: SupabaseClient,
  wojSlug: string,
  powSlug: string,
): Promise<ElementKatalogu[]> {
  const { data, error } = await supabase.rpc("hub_gminy_w_powiacie", {
    p_woj_slug: wojSlug,
    p_pow_slug: powSlug,
  });
  if (error || !data?.length) return [];
  return (data as { commune: string; liczba_wsi: number }[]).map((g) => ({
    nazwa: g.commune,
    slug: slugCzesciZBazy(g.commune),
    liczba: Number(g.liczba_wsi),
  }));
}

export async function pobierzWsiKatalog(
  supabase: SupabaseClient,
  wojSlug: string,
  powSlug: string,
  gminaSlug: string,
): Promise<WiesKatalogu[]> {
  const { data, error } = await supabase.rpc("hub_wsi_po_sciezce", {
    p_woj_slug: wojSlug,
    p_pow_slug: powSlug,
    p_gmina_slug: gminaSlug,
  });
  if (error || !data?.length) return [];
  return (data as {
    id: string;
    name: string;
    slug: string;
    voivodeship: string;
    county: string;
    commune: string;
  }[]).map((w) => ({
    id: w.id,
    nazwa: w.name,
    gmina: w.commune,
    powiat: w.county,
    wojewodztwo: w.voivodeship,
    sciezka: sciezkaProfiluWsi(w),
  }));
}
