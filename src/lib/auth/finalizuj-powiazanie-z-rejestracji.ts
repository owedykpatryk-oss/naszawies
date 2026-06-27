"use server";

import { z } from "zod";
import { utworzWniosekMieszkaniecZRejestracji } from "@/lib/mieszkaniec/wniosek-z-rejestracji";
import { utworzWniosekSoltysaZRejestracji } from "@/lib/soltys/wniosek-soltysa";
import { domyslnePreferencjeUiNowegoUzytkownika } from "@/lib/uzytkownik/preferencje-ui";
import { pobierzUzytkownikaDoAkcji } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

function metaRejestracjiWymagaFinalizacji(meta: Record<string, unknown>): boolean {
  const villageId = typeof meta.signup_village_id === "string" ? meta.signup_village_id.trim() : "";
  if (!villageId || !z.string().uuid().safeParse(villageId).success) return false;
  const intent = typeof meta.signup_intent === "string" ? meta.signup_intent : "";
  return intent === "mieszkaniec" || intent === "soltys";
}

/**
 * Po potwierdzeniu e-maila: składa wniosek mieszkańca / sołtysa z metadanych rejestracji
 * (bez konieczności wchodzenia w osobne podstrony panelu).
 */
export async function finalizujPowiazanieZRejestracji(): Promise<void> {
  const user = await pobierzUzytkownikaDoAkcji();
  if (!user?.user_metadata || typeof user.user_metadata !== "object") return;

  try {
    const supabase = utworzKlientaSupabaseSerwer();
    const meta = user.user_metadata as Record<string, unknown>;
    if (!metaRejestracjiWymagaFinalizacji(meta)) return;

    await Promise.all([utworzWniosekMieszkaniecZRejestracji(), utworzWniosekSoltysaZRejestracji()]);

    const ukonczony =
      typeof meta.onboarding_completed_at === "string" && meta.onboarding_completed_at.trim().length > 0;
    if (ukonczony) return;

    const { error } = await supabase.auth.updateUser({
      data: {
        onboarding_completed_at: new Date().toISOString(),
        ui_preferences: domyslnePreferencjeUiNowegoUzytkownika(),
      },
    });
    if (error) {
      console.error("[finalizujPowiazanieZRejestracji]", error.message);
    }
  } catch (e) {
    console.error("[finalizujPowiazanieZRejestracji]", e);
  }
}
