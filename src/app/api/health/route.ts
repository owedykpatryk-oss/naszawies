import { NextResponse } from "next/server";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";

const TIMEOUT_MS = 2500;

async function pingAuthHealth(baseUrl: string): Promise<boolean> {
  const u = baseUrl.replace(/\/$/, "") + "/auth/v1/health";
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), TIMEOUT_MS);
    const res = await fetch(u, { method: "GET", signal: ac.signal, cache: "no-store" });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Endpoint do monitoringu (np. UptimeRobot). Nie zwraca sekretów ani pełnego URL Supabase.
 */
export async function GET() {
  const maUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim());
  const maAnon = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim());
  const wersja =
    process.env.NEXT_PUBLIC_APP_VERSION?.trim() ||
    process.env.NEXT_PUBLIC_WERSJA_APLIKACJI?.trim() ||
    null;

  let supabasePingOk = false;
  let supabaseAuthOk = false;
  if (maUrl && maAnon) {
    const supabase = createPublicSupabaseClient();
    if (supabase) {
      const { error } = await supabase.from("villages").select("id").limit(1);
      supabasePingOk = !error;
    }
    if (maUrl) {
      supabaseAuthOk = await pingAuthHealth(process.env.NEXT_PUBLIC_SUPABASE_URL!.trim());
    }
  }

  const ok = maUrl && maAnon && supabasePingOk;

  return NextResponse.json(
    {
      ok,
      czas: new Date().toISOString(),
      aplikacja: {
        nazwa: "naszawies",
        wersja,
      },
      sprawdzenia: {
        zmiennePubliczneSupabase: maUrl && maAnon,
        odczytKataloguWsi: supabasePingOk,
        supabaseAuthHealth: supabaseAuthOk,
      },
    },
    { status: ok ? 200 : 503 },
  );
}
