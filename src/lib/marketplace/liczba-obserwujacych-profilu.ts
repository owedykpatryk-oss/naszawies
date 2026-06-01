import type { SupabaseClient } from "@supabase/supabase-js";

/** Liczba obserwujących bez ujawniania tożsamości (RPC, RLS-safe). */
export async function pobierzLiczbeObserwujacychProfiluRynku(
  supabase: SupabaseClient,
  profileId: string,
): Promise<number> {
  const { data, error } = await supabase.rpc("count_marketplace_profile_followers", {
    p_profile_id: profileId,
  });
  if (error) {
    console.warn("[pobierzLiczbeObserwujacychProfiluRynku]", error.message);
    return 0;
  }
  const n = typeof data === "number" ? data : Number(data);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}
