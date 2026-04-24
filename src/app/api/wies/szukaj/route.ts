import { NextResponse } from "next/server";
import { z } from "zod";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

const zapytanie = z.object({
  q: z.string().trim().min(2, "Minimum 2 znaki.").max(80),
});

type WierszRpc = {
  id: string;
  name: string;
  slug: string;
  voivodeship: string;
  county: string;
  commune: string;
  commune_type: string;
  teryt_id: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sparsowane = zapytanie.safeParse({ q: searchParams.get("q") ?? "" });
  if (!sparsowane.success) {
    const msg = sparsowane.error.issues[0]?.message ?? "Niepoprawne zapytanie.";
    return NextResponse.json({ blad: msg }, { status: 400 });
  }

  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ blad: "Brak konfiguracji Supabase." }, { status: 503 });
  }

  const fraza = sparsowane.data.q;
  const wzor = `%${fraza.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;

  const { data, error } = await supabase.rpc("szukaj_wsi_katalog", { p_fraza: fraza });

  let wiersze: WierszRpc[] = [];
  if (!error && data && Array.isArray(data)) {
    wiersze = data as WierszRpc[];
  }
  if (wiersze.length === 0) {
    if (error) {
      console.error("[api/wies/szukaj] szukaj_wsi_katalog:", error.message);
    }
    const { data: fallback, error: err2 } = await supabase
      .from("villages")
      .select("id, name, slug, voivodeship, county, commune, commune_type, teryt_id")
      .ilike("name", wzor)
      .order("name", { ascending: true })
      .limit(30);
    if (err2) {
      console.error("[api/wies/szukaj] villages (fallback name):", err2.message);
      return NextResponse.json(
        { blad: "Nie udało się teraz wyszukać miejscowości. Spróbuj ponownie za chwilę." },
        { status: 500 },
      );
    }
    wiersze = (fallback ?? []) as WierszRpc[];
  }

  const wyniki = wiersze.map((w) => ({
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
  }));

  return NextResponse.json({ wyniki });
}
