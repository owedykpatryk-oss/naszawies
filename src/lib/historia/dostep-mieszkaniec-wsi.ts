import type { SupabaseClient } from "@supabase/supabase-js";

/** Aktywna rola lub obserwacja wsi — dostęp do zgłaszania wspomnień. */
export async function czyMaDostepMieszkancaDoWsi(
  supabase: SupabaseClient,
  userId: string,
  villageId: string,
): Promise<boolean> {
  const [{ data: rola }, { data: follow }] = await Promise.all([
    supabase
      .from("user_village_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("village_id", villageId)
      .eq("status", "active")
      .in("role", ["mieszkaniec", "soltys", "wspoladmin", "osp_naczelnik", "kgw_przewodniczaca", "rada_solecka"])
      .maybeSingle(),
    supabase.from("user_follows").select("id").eq("user_id", userId).eq("village_id", villageId).maybeSingle(),
  ]);
  return Boolean(rola || follow);
}
