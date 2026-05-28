"use server";

import { z } from "zod";
import {
  pobierzGminyKatalog,
  pobierzPowiatyKatalog,
  pobierzWojewodztwaKatalog,
  pobierzWsiKatalog,
} from "@/lib/wies/katalog-administracyjny";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import { slugCzesciZBazy } from "@/lib/wies/slug-administracyjny";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

const poziomZapytania = z.discriminatedUnion("poziom", [
  z.object({ poziom: z.literal("wojewodztwa") }),
  z.object({
    poziom: z.literal("powiaty"),
    woj: z.string().trim().min(1).max(80),
  }),
  z.object({
    poziom: z.literal("gminy"),
    woj: z.string().trim().min(1).max(80),
    pow: z.string().trim().min(1).max(80),
  }),
  z.object({
    poziom: z.literal("wsi"),
    woj: z.string().trim().min(1).max(80),
    pow: z.string().trim().min(1).max(80),
    gmina: z.string().trim().min(1).max(80),
  }),
]);

export type WynikKatalogRejestracja =
  | { ok: true; elementy?: { nazwa: string; slug: string; liczba?: number }[]; wsi?: unknown[] }
  | { ok: false; blad: string };

export async function pobierzKatalogDlaRejestracji(
  niesprawdzone: unknown,
): Promise<WynikKatalogRejestracja> {
  const p = poziomZapytania.safeParse(niesprawdzone);
  if (!p.success) {
    return { ok: false, blad: "Niepoprawne parametry katalogu." };
  }

  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return { ok: false, blad: "Katalog jest chwilowo niedostępny." };
  }

  const d = p.data;
  if (d.poziom === "wojewodztwa") {
    return { ok: true, elementy: await pobierzWojewodztwaKatalog(supabase) };
  }
  if (d.poziom === "powiaty") {
    return {
      ok: true,
      elementy: await pobierzPowiatyKatalog(supabase, slugCzesciZBazy(d.woj)),
    };
  }
  if (d.poziom === "gminy") {
    return {
      ok: true,
      elementy: await pobierzGminyKatalog(supabase, slugCzesciZBazy(d.woj), slugCzesciZBazy(d.pow)),
    };
  }

  const wsi = await pobierzWsiKatalog(
    supabase,
    slugCzesciZBazy(d.woj),
    slugCzesciZBazy(d.pow),
    slugCzesciZBazy(d.gmina),
  );
  if (wsi.length === 0) {
    return { ok: false, blad: "Brak miejscowości w tej gminie w katalogu." };
  }
  return { ok: true, wsi };
}

export async function szukajWsiDlaRejestracji(fraza: string): Promise<
  | {
      ok: true;
      wyniki: {
        id: string;
        nazwa: string;
        gmina: string;
        powiat: string;
        wojewodztwo: string;
        terytId: string;
        sciezka: string;
      }[];
    }
  | { ok: false; blad: string }
> {
  const q = fraza.trim();
  if (q.length < 2) {
    return { ok: false, blad: "Minimum 2 znaki." };
  }

  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return { ok: false, blad: "Wyszukiwarka jest chwilowo niedostępna." };
  }

  const { data, error } = await supabase.rpc("szukaj_wsi_katalog", { p_fraza: q });
  let wiersze: {
    id: string;
    name: string;
    slug: string;
    voivodeship: string;
    county: string;
    commune: string;
    teryt_id: string;
  }[] = [];

  if (!error && data && Array.isArray(data)) {
    wiersze = data as typeof wiersze;
  } else {
    const wzor = `%${q.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;
    const { data: fallback } = await supabase
      .from("villages")
      .select("id, name, slug, voivodeship, county, commune, teryt_id")
      .ilike("name", wzor)
      .order("name", { ascending: true })
      .limit(30);
    wiersze = (fallback ?? []) as typeof wiersze;
  }

  return {
    ok: true,
    wyniki: wiersze.map((w) => ({
      id: w.id,
      nazwa: w.name,
      gmina: w.commune,
      powiat: w.county,
      wojewodztwo: w.voivodeship,
      terytId: w.teryt_id,
      sciezka: sciezkaProfiluWsi({
        voivodeship: w.voivodeship,
        county: w.county,
        commune: w.commune,
        slug: w.slug,
      }),
    })),
  };
}
