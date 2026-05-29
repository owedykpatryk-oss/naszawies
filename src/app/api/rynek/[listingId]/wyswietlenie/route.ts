import { NextResponse } from "next/server";
import { z } from "zod";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";

const idSchema = z.string().uuid();

/**
 * Inkrementuje licznik wyświetleń ogłoszenia (tylko status approved w RPC).
 * Wywoływane z klienta raz na sesję przeglądarki.
 */
export async function POST(_req: Request, { params }: { params: { listingId: string } }) {
  const parsed = idSchema.safeParse(params.listingId);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const { error } = await supabase.rpc("increment_marketplace_listing_view", {
    p_listing_id: parsed.data,
  });

  if (error) {
    console.warn("[rynek/wyswietlenie]", error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
