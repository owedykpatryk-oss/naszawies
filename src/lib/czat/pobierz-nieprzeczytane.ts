import type { SupabaseClient } from "@supabase/supabase-js";

export async function pobierzLiczbeNieprzeczytanychCzatu(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { data, error } = await supabase.rpc("chat_unread_total", { p_user_id: userId });
  if (error) {
    console.warn("[chat_unread_total]", error.message);
    return 0;
  }
  return Number(data ?? 0);
}

export async function pobierzNieprzeczytanePoKonwersacji(
  supabase: SupabaseClient,
  userId: string,
): Promise<Record<string, number>> {
  const { data, error } = await supabase.rpc("chat_unread_by_conversation", { p_user_id: userId });
  if (error) {
    console.warn("[chat_unread_by_conversation]", error.message);
    return {};
  }
  const map: Record<string, number> = {};
  for (const row of data ?? []) {
    const r = row as { conversation_id: string; unread_count: number };
    map[r.conversation_id] = Number(r.unread_count ?? 0);
  }
  return map;
}
