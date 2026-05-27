import type { SupabaseClient } from "@supabase/supabase-js";
import { pobierzVillageIdsRoliPaneluSoltysa } from "@/lib/panel/rola-panelu-soltysa";

/** Aktywne wsi, w których użytkownik ma rolę mieszkańca. */
export async function pobierzVillageIdsMieszkanca(
  supabase: SupabaseClient,
  userId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("user_village_roles")
    .select("village_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .eq("role", "mieszkaniec");

  return (data ?? []).map((r) => r.village_id).filter(Boolean);
}

/** Zapis projektów grafiki: sołtys lub mieszkaniec danej wsi. */
export async function czyMozeZapisacGrafikeDlaWsi(
  supabase: SupabaseClient,
  userId: string,
  villageId: string,
): Promise<boolean> {
  const soltys = await pobierzVillageIdsRoliPaneluSoltysa(supabase, userId);
  if (soltys.includes(villageId)) return true;

  const { data } = await supabase
    .from("user_village_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("village_id", villageId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  return Boolean(data);
}
