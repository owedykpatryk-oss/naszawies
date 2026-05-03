import { NextResponse } from "next/server";
import { czyZapytanieCronAutoryzowane } from "@/lib/api/autoryzacja-cron";
import { pobierzIpIUserAgentZRequestu, zapiszCronRun } from "@/lib/api/zapisz-cron-run";
import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";

type AutomationRunRow = {
  action: string;
  affected_rows: number;
};

const ENDPOINT = "/api/automatyzacje/run";

async function runAutomation(request: Request) {
  const startedAt = new Date().toISOString();
  const meta = pobierzIpIUserAgentZRequestu(request);
  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Brak konfiguracji SUPABASE_SERVICE_ROLE_KEY lub NEXT_PUBLIC_SUPABASE_URL." },
      { status: 500 }
    );
  }

  const { data, error } = await supabase.rpc("run_village_automation_for_cron");
  if (error) {
    console.error("[api/automatyzacje/run]", error.message);
    await zapiszCronRun(supabase, {
      endpoint: ENDPOINT,
      started_at: startedAt,
      status: "error",
      error_message: error.message,
      ...meta,
    });
    return NextResponse.json({ error: "Nie udało się uruchomić automatyzacji." }, { status: 500 });
  }

  const rows = (data ?? []) as AutomationRunRow[];
  const pominiety =
    rows.length === 1 && rows[0]?.action === "skipped_concurrent_lock";
  const totalAffected = rows.reduce((sum, row) => sum + (row.affected_rows ?? 0), 0);

  await zapiszCronRun(supabase, {
    endpoint: ENDPOINT,
    started_at: startedAt,
    status: "success",
    affected_rows: { totalAffected, actions: rows, skippedConcurrent: pominiety },
    ...meta,
  });

  return NextResponse.json({
    ok: true,
    skippedConcurrent: pominiety,
    totalAffected,
    actions: rows,
    ranAt: new Date().toISOString(),
  });
}

export async function GET(request: Request) {
  if (!czyZapytanieCronAutoryzowane(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runAutomation(request);
}

export async function POST(request: Request) {
  if (!czyZapytanieCronAutoryzowane(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runAutomation(request);
}
