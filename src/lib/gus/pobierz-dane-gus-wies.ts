import { unstable_cache } from "next/cache";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import { slugCzesciAdministracyjnej } from "@/lib/wies/slug-administracyjny";

export type CenaGruntuWoj = {
  wojewodztwo: string;
  rok: number;
  value: number;
  unit: string;
};

/** Ostatnia znana średnia cena użytków rolnych (P3415) dla województwa. */
export async function pobierzCeneGruntuWoj(wojewodztwo: string): Promise<CenaGruntuWoj | null> {
  const slug = slugCzesciAdministracyjnej(wojewodztwo.trim());
  if (!slug) return null;
  return pobierzCeneGruntuWojCached(slug);
}

const pobierzCeneGruntuWojCached = unstable_cache(
  async (slug: string): Promise<CenaGruntuWoj | null> => {
    const supabase = createPublicSupabaseClient();
    if (!supabase) return null;

    const { data } = await supabase
      .from("gus_ceny_gruntow_woj")
      .select("wojewodztwo, rok, value, unit")
      .eq("wojewodztwo", slug)
      .order("rok", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      return {
        wojewodztwo: data.wojewodztwo as string,
        rok: data.rok as number,
        value: Number(data.value),
        unit: data.unit as string,
      };
    }

    const { data: poLike } = await supabase
      .from("gus_ceny_gruntow_woj")
      .select("wojewodztwo, rok, value, unit")
      .ilike("wojewodztwo", slug.replace(/-/g, "%"))
      .order("rok", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!poLike) return null;
    return {
      wojewodztwo: poLike.wojewodztwo as string,
      rok: poLike.rok as number,
      value: Number(poLike.value),
      unit: poLike.unit as string,
    };
  },
  ["gus-cena-gruntu-woj"],
  { revalidate: 3600 },
);

export type PsrGminy = {
  liczba_gospodarstw: number | null;
  powierzchnia_ha: number | null;
  rok: number;
};

export async function pobierzPsrGminy(gminaTerytKod: string | null): Promise<PsrGminy | null> {
  const kod = gminaTerytKod?.trim();
  if (!kod) return null;
  return pobierzPsrGminyCached(kod);
}

const pobierzPsrGminyCached = unstable_cache(
  async (kod: string): Promise<PsrGminy | null> => {
    const supabase = createPublicSupabaseClient();
    if (!supabase) return null;

    const { data } = await supabase
      .from("gus_psr_gmina")
      .select("liczba_gospodarstw, powierzchnia_ha, rok")
      .eq("gmina_teryt_kod", kod)
      .maybeSingle();

    if (!data) return null;
    return {
      liczba_gospodarstw: data.liczba_gospodarstw as number | null,
      powierzchnia_ha: data.powierzchnia_ha != null ? Number(data.powierzchnia_ha) : null,
      rok: data.rok as number,
    };
  },
  ["gus-psr-gmina"],
  { revalidate: 86400 },
);
