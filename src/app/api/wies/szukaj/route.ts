import { NextResponse } from "next/server";
import slugify from "slugify";
import { z } from "zod";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";

const zapytanie = z.object({
  q: z.string().trim().min(2, "Minimum 2 znaki.").max(80),
});

function naWzorzIlike(tekst: string): string {
  return `%${tekst.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;
}

function segmentUrl(tekst: string): string {
  return slugify(tekst, { lower: true, strict: true, locale: "pl" });
}

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

  const wzor = naWzorzIlike(sparsowane.data.q);
  const { data, error } = await supabase
    .from("villages")
    .select("id, name, slug, voivodeship, county, commune, commune_type, teryt_id")
    .ilike("name", wzor)
    .order("name", { ascending: true })
    .limit(30);

  if (error) {
    console.error("[api/wies/szukaj]", error.message);
    return NextResponse.json(
      { blad: "Nie udało się przeszukać katalogu. Sprawdź, czy tabela villages istnieje." },
      { status: 500 }
    );
  }

  const wiersze = (data ?? []).map((w) => ({
    id: w.id,
    nazwa: w.name,
    gmina: w.commune,
    powiat: w.county,
    wojewodztwo: w.voivodeship,
    terytId: w.teryt_id,
    sciezka: `/wies/${segmentUrl(w.voivodeship)}/${segmentUrl(w.county)}/${segmentUrl(w.commune)}/${w.slug}`,
  }));

  return NextResponse.json({ wyniki: wiersze });
}
