import { NextResponse } from "next/server";
import { z } from "zod";
import { pobierzAktywnosciFitnessWsi } from "@/lib/wies/pobierz-aktywnosci-fitness-wsi";
import { zbudujRssAktywnosciFitnessWsi } from "@/lib/wies/rss-aktywnosci-fitness";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";

type Props = { params: { villageId: string } };

export const revalidate = 300;

export async function GET(_request: Request, { params }: Props) {
  const id = z.string().uuid().safeParse(params.villageId);
  if (!id.success) {
    return new NextResponse("Niepoprawny identyfikator wsi.", { status: 400 });
  }

  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return new NextResponse("Serwis chwilowo niedostępny.", { status: 503 });
  }

  const { data: wies } = await supabase
    .from("villages")
    .select("id, name, voivodeship, county, commune, slug, is_active")
    .eq("id", id.data)
    .maybeSingle();

  if (!wies?.is_active || !wies.slug) {
    return new NextResponse("Nie znaleziono wsi.", { status: 404 });
  }

  const aktywnosci = await pobierzAktywnosciFitnessWsi(wies.id, 40);
  const xml = zbudujRssAktywnosciFitnessWsi({
    nazwaWsi: wies.name,
    villageId: wies.id,
    sciezkaProfilu: sciezkaProfiluWsi(wies),
    aktywnosci,
  });

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
