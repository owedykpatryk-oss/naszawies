import type { SupabaseClient } from "@supabase/supabase-js";
import {
  AKTUALNY_BUNDLE_WERSJI_PRAWNYCH,
  WERSJA_BANERU_COOKIES,
  type RodzajZgody,
  type ZrodloZgody,
} from "@/lib/rodo/wersje-dokumentow";

export type ZgodaDoZapisu = {
  consent_type: RodzajZgody;
  document_version: string;
};

/** Zapisuje zgody i aktualizuje skrót na `public.users` (pakiet regulamin + polityka). */
export async function zapiszZgodyUzytkownika(
  supabase: SupabaseClient,
  userId: string,
  zgody: ZgodaDoZapisu[],
  source: ZrodloZgody,
  opcje?: { ustawBundleNaProfilu?: boolean },
): Promise<{ blad?: string }> {
  if (zgody.length === 0) return {};

  const teraz = new Date().toISOString();
  const wiersze = zgody.map((z) => ({
    user_id: userId,
    consent_type: z.consent_type,
    document_version: z.document_version,
    accepted_at: teraz,
    source,
  }));

  const { error: errZgody } = await supabase.from("user_consents").upsert(wiersze, {
    onConflict: "user_id,consent_type,document_version",
    ignoreDuplicates: false,
  });
  if (errZgody) {
    console.error("[zapiszZgodyUzytkownika]", errZgody.message);
    return { blad: "Nie udało się zapisać zgód." };
  }

  const ustawBundle =
    opcje?.ustawBundleNaProfilu ??
    zgody.some(
      (z) =>
        (z.consent_type === "regulamin" || z.consent_type === "polityka_prywatnosci") &&
        z.document_version === AKTUALNY_BUNDLE_WERSJI_PRAWNYCH,
    );

  if (ustawBundle) {
    const { error: errUser } = await supabase
      .from("users")
      .update({
        legal_accepted_at: teraz,
        legal_bundle_version: AKTUALNY_BUNDLE_WERSJI_PRAWNYCH,
      })
      .eq("id", userId);
    if (errUser) {
      console.error("[zapiszZgodyUzytkownika users]", errUser.message);
      return { blad: "Zgody zapisane częściowo — odśwież stronę i spróbuj ponownie." };
    }
  }

  return {};
}

/** Pakiet wymagany przy rejestracji / pierwszym logowaniu OAuth. */
export function zgodyPakietuRejestracji(): ZgodaDoZapisu[] {
  return [
    { consent_type: "regulamin", document_version: AKTUALNY_BUNDLE_WERSJI_PRAWNYCH },
    { consent_type: "polityka_prywatnosci", document_version: AKTUALNY_BUNDLE_WERSJI_PRAWNYCH },
    { consent_type: "wiek_16", document_version: AKTUALNY_BUNDLE_WERSJI_PRAWNYCH },
  ];
}

export function zgodaBaneruCookies(): ZgodaDoZapisu {
  return { consent_type: "cookies_info", document_version: WERSJA_BANERU_COOKIES };
}
