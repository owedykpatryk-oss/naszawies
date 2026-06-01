import type { SupabaseClient } from "@supabase/supabase-js";
import { odwiazObceKluczePrzedUsunieciemUzytkownika } from "@/lib/rodo/odwiaz-obce-klucze-przed-usunieciem-uzytkownika";

/**
 * Przygotowanie konta do usunięcia: odwiązanie FK, usunięcie subskrypcji i danych,
 * które nie powinny pozostać po żądaniu usunięcia (RODO).
 */
export async function usunDaneOsobowePrzedUsunieciemKonta(
  admin: SupabaseClient,
  userId: string,
): Promise<string[]> {
  const bledy = await odwiazObceKluczePrzedUsunieciemUzytkownika(admin, userId);

  async function usun(tabela: string, kolumna = "user_id") {
    const { error } = await admin.from(tabela).delete().eq(kolumna, userId);
    if (error) bledy.push(`${tabela}: ${error.message}`);
  }

  await usun("user_web_push_subscriptions");
  await usun("notifications");
  await usun("user_follows");
  await usun("marketplace_profile_follows");
  await usun("resident_reminder_deliveries");
  await usun("user_resident_reminder_prefs");
  await usun("user_commune_follows");
  await usun("user_saved_content");
  await usun("user_transport_favorite_relations");
  await usun("village_history_candles");

  return bledy;
}
