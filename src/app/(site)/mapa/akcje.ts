"use server";

import { synchronizujGranicePrgAutomatycznie } from "@/lib/mapa/synchronizuj-granice-prg-automatycznie";
import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";

/** Uruchamiane z mapy w tle — uzupełnia brakujące obrysy PRG (service role). */
export async function uruchomSyncGraniceZMapy() {
  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return { ok: false as const, blad: "Brak konfiguracji serwera." };
  }
  try {
    const summary = await synchronizujGranicePrgAutomatycznie(supabase, { tryb: "mapa" });
    return { ok: true as const, summary };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false as const, blad: msg };
  }
}
