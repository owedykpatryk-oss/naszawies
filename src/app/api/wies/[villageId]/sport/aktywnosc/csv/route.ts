import { NextResponse } from "next/server";
import { z } from "zod";
import { pobierzAktywnosciFitnessWsi } from "@/lib/wies/pobierz-aktywnosci-fitness-wsi";
import { zbudujCsvAktywnosciFitnessWsi } from "@/lib/wies/csv-aktywnosci-fitness";
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
    .select("id, name, slug, is_active")
    .eq("id", id.data)
    .maybeSingle();

  if (!wies?.is_active || !wies.slug) {
    return new NextResponse("Nie znaleziono wsi.", { status: 404 });
  }

  const aktywnosci = await pobierzAktywnosciFitnessWsi(wies.id, 500);
  const csv = zbudujCsvAktywnosciFitnessWsi(aktywnosci);
  const nazwaPliku = `aktywnosc-${wies.slug}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nazwaPliku}"`,
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
