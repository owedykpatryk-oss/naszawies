import { NextResponse } from "next/server";
import { z } from "zod";
import { pobierzKalendarzZajetosciDlaWsi } from "@/components/swietlica/kalendarz-zajetosci-publiczny";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import { pobierzSalePubliczneDlaWsi } from "@/lib/swietlica/pobierz-sale-publiczne-wsi";

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

  const [sale, kalendarz] = await Promise.all([
    pobierzSalePubliczneDlaWsi(supabase, id.data),
    pobierzKalendarzZajetosciDlaWsi(supabase, id.data),
  ]);

  return NextResponse.json({ sale, kalendarz }, {
    headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" },
  });
}
