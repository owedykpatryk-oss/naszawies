"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { bezpiecznaSciezkaNastepna } from "@/lib/auth/bezpieczna-sciezka-nastepna";
import { sciezkaPomijaAkceptacjePrawnej } from "@/lib/rodo/bramka-zgod-prawnych";
import { czyProfilMaAktualnaAkceptacjePrawna } from "@/lib/rodo/czy-ma-akceptacje-prawna";
import { AKTUALNY_BUNDLE_WERSJI_PRAWNYCH } from "@/lib/rodo/wersje-dokumentow";
import { zapiszZgodyUzytkownika, zgodyPakietuRejestracji } from "@/lib/rodo/zapisz-zgody-uzytkownika";
import { pobierzUzytkownikaDoAkcji } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

export type WynikAkceptacji = { blad: string } | { ok: true; next: string };

export async function zaakceptujDokumentyPrawne(
  zgodyZaznaczone: boolean,
  next?: string | null,
): Promise<WynikAkceptacji> {
  if (!zgodyZaznaczone) {
    return { blad: "Zaznacz wszystkie wymagane zgody, aby kontynuować." };
  }

  const user = await pobierzUzytkownikaDoAkcji();
  if (!user) return { blad: "Zaloguj się ponownie." };
  const supabase = utworzKlientaSupabaseSerwer();

  const wynik = await zapiszZgodyUzytkownika(supabase, user.id, zgodyPakietuRejestracji(), "oauth_akceptacja", {
    ustawBundleNaProfilu: true,
  });
  if (wynik.blad) return { blad: wynik.blad };

  const teraz = new Date().toISOString();
  await supabase.auth.updateUser({
    data: {
      legal_accepted_at: teraz,
      legal_bundle_version: AKTUALNY_BUNDLE_WERSJI_PRAWNYCH,
    },
  });

  revalidatePath("/panel", "layout");
  const cel = bezpiecznaSciezkaNastepna(next ?? undefined);
  return { ok: true, next: cel };
}

/** Server component — przekierowanie, gdy brak aktualnej akceptacji regulaminu. */
export async function wymagajAkceptacjiPrawnejJesliTrzeba(sciezka: string, next?: string): Promise<void> {
  if (sciezkaPomijaAkceptacjePrawnej(sciezka)) return;

  const user = await pobierzUzytkownikaDoAkcji();
  if (!user) return;

  const supabase = utworzKlientaSupabaseSerwer();
  const { data: profil } = await supabase
    .from("users")
    .select("legal_accepted_at, legal_bundle_version")
    .eq("id", user.id)
    .maybeSingle();

  if (czyProfilMaAktualnaAkceptacjePrawna(profil)) return;

  const cel = bezpiecznaSciezkaNastepna(next ?? sciezka);
  redirect(`/panel/akceptacja-regulaminu?next=${encodeURIComponent(cel)}`);
}
