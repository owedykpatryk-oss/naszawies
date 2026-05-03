import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Ustawia na NULL (lub usuń wiersze) powiązania wskazujące na użytkownika,
 * gdzie schemat nie ma `ON DELETE SET NULL` — bez tego usunięcie rekordu `public.users` się nie powiedzie.
 */
export async function odwiazObceKluczePrzedUsunieciemUzytkownika(
  admin: SupabaseClient,
  userId: string
): Promise<string[]> {
  const bledy: string[] = [];

  async function nulluj(tabela: string, kolumna: string) {
    const { error } = await admin.from(tabela).update({ [kolumna]: null }).eq(kolumna, userId);
    if (error) bledy.push(`${tabela}.${kolumna}: ${error.message}`);
  }

  async function usunWiersze(tabela: string, kolumna: string) {
    const { error } = await admin.from(tabela).delete().eq(kolumna, userId);
    if (error) bledy.push(`${tabela} (delete): ${error.message}`);
  }

  await nulluj("user_village_roles", "verified_by");
  await nulluj("posts", "moderated_by");
  await nulluj("comments", "moderated_by");
  await nulluj("hall_bookings", "approved_by");
  await nulluj("entities", "approved_by");
  await nulluj("issues", "assigned_to");
  await nulluj("photos", "moderated_by");
  await nulluj("moderation_reports", "reviewed_by");
  await nulluj("village_blog_posts", "moderated_by");
  await nulluj("village_history_entries", "moderated_by");
  await nulluj("marketplace_listings", "moderated_by");
  await nulluj("local_news_items", "moderated_by");
  await nulluj("village_community_events", "moderated_by");

  await usunWiersze("audit_log", "user_id");

  return bledy;
}
