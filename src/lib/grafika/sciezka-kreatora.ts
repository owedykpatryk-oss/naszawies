import type { SupabaseClient } from "@supabase/supabase-js";
import { pobierzVillageIdsRoliPaneluSoltysa } from "@/lib/panel/rola-panelu-soltysa";

/** Docelowa ścieżka kreatora po zalogowaniu (sołtys → pełniejszy panel). */
export async function sciezkaKreatoraGrafikiDlaUzytkownika(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  const soltys = await pobierzVillageIdsRoliPaneluSoltysa(supabase, userId);
  if (soltys.length > 0) return "/panel/soltys/grafika";
  return "/panel/mieszkaniec/grafika";
}
