import { NextResponse } from "next/server";
import { czyZapytanieCronAutoryzowane } from "@/lib/api/autoryzacja-cron";
import { pobierzIpIUserAgentZRequestu, zapiszCronRun } from "@/lib/api/zapisz-cron-run";
import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { synchronizujGusPelny } from "@/lib/gus/synchronizuj-gus-pelny";

const ENDPOINT = "/api/gus/sync";

async function uruchom(request: Request) {
  if (!czyZapytanieCronAutoryzowane(request)) {
    return NextResponse.json({ blad: "Brak autoryzacji." }, { status: 401 });
  }

  const startedAt = new Date().toISOString();
  const { source_ip, user_agent } = pobierzIpIUserAgentZRequestu(request);
  const admin = createAdminSupabaseClient();

  if (!admin) {
    return NextResponse.json({ blad: "Brak klienta admin." }, { status: 503 });
  }

  try {
    const wynik = await synchronizujGusPelny(admin);
    const zapisano =
      wynik.ceny.zapisano + wynik.ludnosc.zaktualizowano_wsi + wynik.psr.zapisano + wynik.grunty.zapisano;
    await zapiszCronRun(admin, {
      endpoint: ENDPOINT,
      started_at: startedAt,
      status: zapisano > 0 ? "success" : "error",
      affected_rows: zapisano,
      error_message: wynik.bledy.length ? wynik.bledy.join("; ") : null,
      source_ip,
      user_agent,
    });
    return NextResponse.json({ ok: true, ...wynik });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await zapiszCronRun(admin, {
      endpoint: ENDPOINT,
      started_at: startedAt,
      status: "error",
      affected_rows: 0,
      error_message: msg,
      source_ip,
      user_agent,
    });
    return NextResponse.json({ blad: msg }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return uruchom(request);
}

export async function POST(request: Request) {
  return uruchom(request);
}
