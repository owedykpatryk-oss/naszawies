"use server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { odwiazObceKluczePrzedUsunieciemUzytkownika } from "@/lib/rodo/odwiaz-obce-klucze-przed-usunieciem-uzytkownika";
import { zbierzPakietEksportuRodo } from "@/lib/rodo/zbierz-eksport-danych-uzytkownika";

const TEKST_POTWIERDZENIA_USUNIECIA = "USUN KONTO";

export type WynikEksportuRodo = { blad: string } | { ok: true; json: string; nazwaPliku: string };

/** Pakiet JSON z danymi osobowymi (prawo dostępu RODO). Wymaga `SUPABASE_SERVICE_ROLE_KEY` na serwerze. */
export async function pobierzJsonEksportuRodo(): Promise<WynikEksportuRodo> {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Brak sesji — zaloguj się ponownie." };
  }

  const admin = createAdminSupabaseClient();
  if (!admin) {
    return { blad: "Eksport jest chwilowo niedostępny (brak konfiguracji klucza serwisowego Supabase)." };
  }

  const pakiet = await zbierzPakietEksportuRodo(admin, user.id, user.email ?? undefined);
  const json = JSON.stringify(pakiet, null, 2);
  const skrot = user.id.replace(/-/g, "").slice(0, 8);
  const nazwaPliku = `naszawies-eksport-danych-${skrot}-${pakiet.meta.wygenerowano_at.slice(0, 10)}.json`;
  return { ok: true, json, nazwaPliku };
}

export type WynikUsunieciaKonta = { blad: string } | { ok: true; nastepnyUrl: string };

/**
 * Trwałe usunięcie konta (Supabase Auth + rekordy powiązane w bazie przez CASCADE / SET NULL).
 * Po sukcesie klient powinien przekierować na `nastepnyUrl`, żeby wyczyścić ciasteczka sesji.
 */
export async function usunKontoNaZawsze(potwierdzenie: string): Promise<WynikUsunieciaKonta> {
  if (potwierdzenie.trim() !== TEKST_POTWIERDZENIA_USUNIECIA) {
    return {
      blad: `Aby usunąć konto, wpisz dokładnie (wielkie litery): ${TEKST_POTWIERDZENIA_USUNIECIA}`,
    };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Brak sesji — zaloguj się ponownie." };
  }

  const admin = createAdminSupabaseClient();
  if (!admin) {
    return { blad: "Usuwanie konta jest chwilowo niedostępne (brak konfiguracji klucza serwisowego Supabase)." };
  }

  const bledyOdwiazania = await odwiazObceKluczePrzedUsunieciemUzytkownika(admin, user.id);
  if (bledyOdwiazania.length > 0) {
    console.warn("[usunKontoNaZawsze] odwiazanie kluczy", bledyOdwiazania);
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("[usunKontoNaZawsze] deleteUser", error.message);
    return {
      blad:
        "Nie udało się usunąć konta. Spróbuj ponownie lub napisz na adres kontaktowy serwisu — być może nadal istnieją powiązania w bazie.",
    };
  }

  return { ok: true, nastepnyUrl: "/wyloguj" };
}
