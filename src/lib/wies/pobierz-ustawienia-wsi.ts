import type { SupabaseClient } from "@supabase/supabase-js";
import { zbudujUstawieniaWsiPubliczne, type UstawieniaWsiPubliczne } from "@/lib/wies/ustawienia-wsi";

export async function pobierzUstawieniaWsi(
  supabase: SupabaseClient,
  villageId: string,
): Promise<UstawieniaWsiPubliczne> {
  const { data } = await supabase
    .from("village_settings")
    .select("theme_id, logo_url, settings")
    .eq("village_id", villageId)
    .maybeSingle();

  return zbudujUstawieniaWsiPubliczne(data);
}
