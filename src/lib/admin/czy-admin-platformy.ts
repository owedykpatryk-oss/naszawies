import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Czy zalogowany użytkownik ma rolę administratora platformy (RPC Postgres). */
async function sprawdzAdminPlatformy(supabase: SupabaseClient): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_platform_admin");
  if (error) return false;
  return data === true;
}

/** Cache na czas jednego żądania serwera (panel layout). */
export const czyAdminPlatformy = cache(sprawdzAdminPlatformy);
