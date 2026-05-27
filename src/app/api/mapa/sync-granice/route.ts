import { NextResponse } from "next/server";
import { czyZapytanieCronAutoryzowane } from "@/lib/api/autoryzacja-cron";
import { pobierzIpIUserAgentZRequestu, zapiszCronRun } from "@/lib/api/zapisz-cron-run";
import { synchronizujGranicePrgAutomatycznie } from "@/lib/mapa/synchronizuj-granice-prg-automatycznie";
import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";

const ENDPOINT = "/api/mapa/sync-granice";

async function uruchom(request: Request) {
  const startedAt = new Date().toISOString();
  const meta = pobierzIpIUserAgentZRequestu(request);
  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Brak SUPABASE_SERVICE_ROLE_KEY lub NEXT_PUBLIC_SUPABASE_URL." },
      { status: 500 },
    );
  }

  try {
    const summary = await synchronizujGranicePrgAutomatycznie(supabase, { tryb: "mapa" });
    await zapiszCronRun(supabase, {
      endpoint: ENDPOINT,
      started_at: startedAt,
      status: "success",
      affected_rows: { updatedBoundaries: summary.updatedBoundaries, summary },
      ...meta,
    });
    return NextResponse.json({ ok: true, ...summary, ranAt: new Date().toISOString() });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[api/mapa/sync-granice]", msg);
    await zapiszCronRun(supabase, {
      endpoint: ENDPOINT,
      started_at: startedAt,
      status: "error",
      error_message: msg,
      ...meta,
    });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** Cron / maintenance: masowy import granic PRG (wyższe limity niż w /api/automatyzacje/run). */
export async function GET(request: Request) {
  if (!czyZapytanieCronAutoryzowane(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return uruchom(request);
}

export async function POST(request: Request) {
  if (!czyZapytanieCronAutoryzowane(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return uruchom(request);
}
