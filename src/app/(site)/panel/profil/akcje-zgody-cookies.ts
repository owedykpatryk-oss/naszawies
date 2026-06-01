"use server";

import { zapiszZgodyUzytkownika, zgodaBaneruCookies } from "@/lib/rodo/zapisz-zgody-uzytkownika";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzUzytkownikaDoAkcji } from "@/lib/auth/pobierz-uzytkownika-serwer";

/** Zapis informacji o zapoznaniu się z banerem cookies (zalogowany użytkownik). */
export async function zapiszZgodeBaneruCookies(): Promise<{ ok?: true; blad?: string }> {
  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { ok: true };

  const wynik = await zapiszZgodyUzytkownika(supabase, user.id, [zgodaBaneruCookies()], "banner_cookies", {
    ustawBundleNaProfilu: false,
  });
  if (wynik.blad) return { blad: wynik.blad };
  return { ok: true };
}
