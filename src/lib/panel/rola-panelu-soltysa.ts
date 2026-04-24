import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

/**
 * Zgodne z `is_village_soltys()` w PostgreSQL: aktywna rola sołtysa lub współadministratora wsi.
 * Nie obejmuje: mieszkaniec, reprezentant_podmiotu, pending.
 */
export const ROLE_PANELU_SOLTYSA = ["soltys", "wspoladmin"] as const;

/**
 * Id wsi, w których użytkownik może działać jak panel sołtysa (sołtys / współadmin).
 */
export async function pobierzVillageIdsRoliPaneluSoltysa(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  const { data: mojeWsi } = await supabase
    .from("user_village_roles")
    .select("village_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .in("role", [...ROLE_PANELU_SOLTYSA]);

  return (mojeWsi ?? []).map((m) => m.village_id).filter(Boolean) as string[];
}

/**
 * Deduplikacja w jednym żądaniu React (layout + strona potomna z tym samym `userId`).
 */
export const pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache = cache(
  async (userId: string): Promise<string[]> => {
    const supabase = utworzKlientaSupabaseSerwer();
    return pobierzVillageIdsRoliPaneluSoltysa(supabase, userId);
  }
);

/**
 * Czy użytkownik ma uprawnienia panelu sołtysa do danej sali (wieś sali ∈ jego wsiach).
 * Lista wsi jest brana z pamięci podręcznej żądania (jak w layoucie panelu).
 */
export async function czyUzytkownikJestSoltysemDlaSali(
  supabase: SupabaseClient,
  userId: string,
  hallId: string
): Promise<boolean> {
  const { data: hall } = await supabase.from("halls").select("village_id").eq("id", hallId).maybeSingle();
  if (!hall?.village_id) return false;
  const villageIds = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(userId);
  return villageIds.includes(hall.village_id);
}
