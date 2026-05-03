import { NextResponse } from "next/server";
import { czyZapytanieCronAutoryzowane } from "@/lib/api/autoryzacja-cron";
import { pobierzIpIUserAgentZRequestu, zapiszCronRun } from "@/lib/api/zapisz-cron-run";
import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { synchronizujKanalyRssDlaWsi } from "@/lib/rss/synchronizuj-kanaly-rss";

export const dynamic = "force-dynamic";

const ENDPOINT = "/api/kanaly-rss/sync";
const KLUCZ_LEASE_RSS = "rss_sync_global";

function czyTrybMiekkiBrakuAdminaWlaczony(): boolean {
  const v = process.env.RSS_SYNC_SOFT_SKIP_MISSING_ADMIN?.trim().toLowerCase();
  if (v === "1" || v === "true" || v === "yes" || v === "on") return true;
  if (v === "0" || v === "false" || v === "no" || v === "off") return false;
  return process.env.NODE_ENV !== "production";
}

async function uruchomSync(request: Request) {
  if (!czyZapytanieCronAutoryzowane(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const startedAt = new Date().toISOString();
  const meta = pobierzIpIUserAgentZRequestu(request);
  const admin = createAdminSupabaseClient();
  if (!admin) {
    if (czyTrybMiekkiBrakuAdminaWlaczony()) {
      console.warn("[api/kanaly-rss/sync] skipped: missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL");
      return NextResponse.json({
        ok: true,
        skipped: true,
        powod: "brak_admin_klucza_supabase",
        wymagane: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
        ranAt: new Date().toISOString(),
      });
    }
    return NextResponse.json(
      {
        error:
          "Brak SUPABASE_SERVICE_ROLE_KEY — synchronizacja RSS wymaga klienta admin. Uzupełnij SUPABASE_SERVICE_ROLE_KEY i NEXT_PUBLIC_SUPABASE_URL w środowisku serwera.",
      },
      { status: 500 },
    );
  }

  const { data: leased, error: leaseErr } = await admin.rpc("cron_acquire_lease", {
    p_key: KLUCZ_LEASE_RSS,
    p_ttl_seconds: 2700,
  });
  if (leaseErr) {
    console.warn("[api/kanaly-rss/sync] cron_acquire_lease:", leaseErr.message);
  }
  const mamLease = leased === true;

  if (!leaseErr && leased === false) {
    await zapiszCronRun(admin, {
      endpoint: ENDPOINT,
      started_at: startedAt,
      status: "success",
      affected_rows: { skipped: true, reason: "lease_zajety" },
      ...meta,
    });
    return NextResponse.json({
      ok: true,
      skipped: true,
      powod: "inny_sync_w_trakcie",
      ranAt: new Date().toISOString(),
    });
  }

  try {
    const wynik = await synchronizujKanalyRssDlaWsi(admin, null);
    await zapiszCronRun(admin, {
      endpoint: ENDPOINT,
      started_at: startedAt,
      status: "success",
      affected_rows: wynik,
      ...meta,
    });
    return NextResponse.json({
      ok: true,
      ...wynik,
      ranAt: new Date().toISOString(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await zapiszCronRun(admin, {
      endpoint: ENDPOINT,
      started_at: startedAt,
      status: "error",
      error_message: msg,
      ...meta,
    });
    return NextResponse.json({ error: "Błąd synchronizacji RSS." }, { status: 500 });
  } finally {
    if (mamLease) {
      const { error: relErr } = await admin.rpc("cron_release_lease", { p_key: KLUCZ_LEASE_RSS });
      if (relErr) console.warn("[api/kanaly-rss/sync] cron_release_lease:", relErr.message);
    }
  }
}

/** Vercel Cron wywołuje GET z nagłówkiem Authorization (CRON_SECRET). */
export async function GET(request: Request) {
  return uruchomSync(request);
}

export async function POST(request: Request) {
  return uruchomSync(request);
}
