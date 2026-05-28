import { NextResponse } from "next/server";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

export type WynikAuthApi = { ok: true } | { ok: false; response: NextResponse };

export async function wymagajLogowaniaApi(): Promise<WynikAuthApi> {
  try {
    const supabase = utworzKlientaSupabaseSerwer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) return { ok: true };
  } catch {
    /* brak env */
  }
  return {
    ok: false,
    response: NextResponse.json(
      { blad: "Ta funkcja jest dostępna po zalogowaniu." },
      { status: 401 },
    ),
  };
}
