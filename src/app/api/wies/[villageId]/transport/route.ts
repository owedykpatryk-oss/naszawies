import { NextResponse } from "next/server";
import { z } from "zod";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";

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

  const [{ data: status }, { data: odjazdy }] = await Promise.all([
    supabase
      .from("village_transport_line_status")
      .select("status_color, status_label, delayed_count, cancelled_count, fallback_mode, updated_at")
      .eq("village_id", id.data)
      .maybeSingle(),
    supabase
      .from("transport_departures_cache")
      .select(
        "id, station_name, train_label, destination, platform, planned_at, realtime_at, delay_min, is_cancelled, status, fetched_at",
      )
      .eq("village_id", id.data)
      .gte("planned_at", new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
      .order("planned_at", { ascending: true })
      .limit(8),
  ]);

  return NextResponse.json(
    { status: status ?? null, odjazdy: odjazdy ?? [] },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } },
  );
}
