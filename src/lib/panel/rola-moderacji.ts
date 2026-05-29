import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { roleDlaUprawnienia } from "@/lib/panel/uprawnienia-wsi";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

/** Wioski, w których użytkownik może moderować treści (rada sołecka / współadmin — nie sam sołtys). */
export async function pobierzVillageIdsModeracjiTresci(
  supabase: SupabaseClient,
  userId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("user_village_roles")
    .select("village_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .in("role", [...roleDlaUprawnienia("moderacja_tresci")]);

  return (data ?? []).map((r) => r.village_id).filter(Boolean) as string[];
}

export const pobierzVillageIdsModeracjiTresciCache = cache(async (userId: string): Promise<string[]> => {
  const supabase = utworzKlientaSupabaseSerwer();
  return pobierzVillageIdsModeracjiTresci(supabase, userId);
});

export async function czyUzytkownikMozeModerowacTresc(
  supabase: SupabaseClient,
  userId: string,
  villageId: string,
): Promise<boolean> {
  const ids = await pobierzVillageIdsModeracjiTresci(supabase, userId);
  return ids.includes(villageId);
}
