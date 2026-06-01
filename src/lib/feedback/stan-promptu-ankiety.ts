import type { SupabaseClient } from "@supabase/supabase-js";
import { DNI_DO_PIERWSZEJ_ANKIETY } from "@/lib/feedback/konfiguracja-ankiety";

export type StanPromptuAnkiety = {
  pokazAutomatycznyPrompt: boolean;
  dniOdRejestracji: number | null;
  juzWyslanoAnkiete14d: boolean;
  moznaWypelnicDobrowolnie: true;
};

function roznicaDni(od: Date, doDnia = new Date()): number {
  return Math.floor((doDnia.getTime() - od.getTime()) / (24 * 60 * 60 * 1000));
}

export async function pobierzStanPromptuAnkiety(
  supabase: SupabaseClient,
  userId: string,
  dataRejestracjiIso: string | undefined,
): Promise<StanPromptuAnkiety> {
  const bazowy: StanPromptuAnkiety = {
    pokazAutomatycznyPrompt: false,
    dniOdRejestracji: null,
    juzWyslanoAnkiete14d: false,
    moznaWypelnicDobrowolnie: true,
  };

  if (!dataRejestracjiIso) return bazowy;

  const rejestracja = new Date(dataRejestracjiIso);
  if (Number.isNaN(rejestracja.getTime())) return bazowy;

  const dni = roznicaDni(rejestracja);
  bazowy.dniOdRejestracji = dni;

  const [{ data: profil }, { data: istniejaca }] = await Promise.all([
    supabase
      .from("users")
      .select("feedback_prompt_snooze_until, feedback_never_ask")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("platform_user_feedback")
      .select("id")
      .eq("user_id", userId)
      .eq("survey_kind", "onboarding_14d")
      .limit(1)
      .maybeSingle(),
  ]);

  if (istniejaca?.id) {
    bazowy.juzWyslanoAnkiete14d = true;
    return bazowy;
  }

  if (profil?.feedback_never_ask) return bazowy;

  const snooze = profil?.feedback_prompt_snooze_until;
  if (snooze && new Date(snooze).getTime() > Date.now()) return bazowy;

  if (dni >= DNI_DO_PIERWSZEJ_ANKIETY) {
    bazowy.pokazAutomatycznyPrompt = true;
  }

  return bazowy;
}
