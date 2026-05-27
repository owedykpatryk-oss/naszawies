import { NextResponse } from "next/server";
import { z } from "zod";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import { pobierzDaneGeoWsi } from "@/lib/wies/pobierz-dane-geo-wsi";

type Params = { params: { villageId: string } };

export async function GET(_req: Request, { params }: Params) {
  const id = z.string().uuid().safeParse(params.villageId);
  if (!id.success) {
    return NextResponse.json({ blad: "Nieprawidłowy identyfikator wsi." }, { status: 400 });
  }

  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ blad: "Usługa chwilowo niedostępna." }, { status: 503 });
  }

  const dane = await pobierzDaneGeoWsi(supabase, id.data);
  return NextResponse.json(dane, {
    headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" },
  });
}
