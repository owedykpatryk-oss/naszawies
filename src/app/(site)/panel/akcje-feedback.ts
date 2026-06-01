"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DNI_ODROCZENIA_PROMPTU } from "@/lib/feedback/konfiguracja-ankiety";
import type { RodzajAnkiety } from "@/lib/feedback/konfiguracja-ankiety";
import { powiadomOperatoraONowejOpinii } from "@/lib/feedback/powiadom-o-nowej-opinii";
import { pobierzStanPromptuAnkiety, type StanPromptuAnkiety } from "@/lib/feedback/stan-promptu-ankiety";
import { pobierzVillageIdsRoliPaneluSoltysa } from "@/lib/panel/rola-panelu-soltysa";
import { pobierzUzytkownikaDoAkcji } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

const schemaOpinia = z.object({
  surveyKind: z.enum(["onboarding_14d", "voluntary", "prompt"]),
  ratingOverall: z.number().int().min(1).max(5).nullable().optional(),
  ratingEase: z.number().int().min(1).max(5).nullable().optional(),
  whatWorks: z.string().trim().max(3000).nullable().optional(),
  whatImprove: z.string().trim().max(3000).nullable().optional(),
  freeNotes: z.string().trim().max(4000).nullable().optional(),
  pagePath: z.string().trim().max(500).nullable().optional(),
});

export type WynikFeedback = { blad: string } | { ok: true };

export async function pobierzStanAnkietyFeedback(): Promise<StanPromptuAnkiety & { zalogowany: boolean }> {
  const supabase = utworzKlientaSupabaseSerwer();
  const user = await pobierzUzytkownikaDoAkcji();
  if (!user) {
    return {
      zalogowany: false,
      pokazAutomatycznyPrompt: false,
      dniOdRejestracji: null,
      juzWyslanoAnkiete14d: false,
      moznaWypelnicDobrowolnie: true,
    };
  }

  const createdAt = user.created_at?.trim() ? user.created_at : undefined;

  const stan = await pobierzStanPromptuAnkiety(supabase, user.id, createdAt);
  return { ...stan, zalogowany: true };
}

export async function wyslijOpiniePlatformy(dane: z.infer<typeof schemaOpinia>): Promise<WynikFeedback> {
  const parsed = schemaOpinia.safeParse(dane);
  if (!parsed.success) {
    return { blad: "Sprawdź ocenę i treść opinii." };
  }

  const poprawione = parsed.data;
  const maTresc =
    (poprawione.whatImprove?.length ?? 0) >= 3 ||
    (poprawione.whatWorks?.length ?? 0) >= 3 ||
    (poprawione.freeNotes?.length ?? 0) >= 3 ||
    poprawione.ratingOverall != null;

  if (!maTresc) {
    return { blad: "Dodaj krótką ocenę lub choć jedną uwagę (min. 3 znaki)." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const user = await pobierzUzytkownikaDoAkcji();
  if (!user) return { blad: "Zaloguj się ponownie." };

  const godzinaTemu = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: ostatnia } = await supabase
    .from("platform_user_feedback")
    .select("id")
    .eq("user_id", user.id)
    .gte("created_at", godzinaTemu)
    .limit(1)
    .maybeSingle();

  if (ostatnia?.id) {
    return { blad: "Ostatnią opinię wysłałeś przed chwilą — odczekaj godzinę lub dopisz do poprzedniej na stronie sugestii." };
  }

  const wsiSoltys = await pobierzVillageIdsRoliPaneluSoltysa(supabase, user.id);
  const villageId =
    typeof user.user_metadata?.signup_village_id === "string" && user.user_metadata.signup_village_id
      ? String(user.user_metadata.signup_village_id)
      : null;

  const rola =
    wsiSoltys.length > 0 ? "soltys" : villageId ? "mieszkaniec" : "uzytkownik";

  const { error } = await supabase.from("platform_user_feedback").insert({
    user_id: user.id,
    village_id: villageId && z.string().uuid().safeParse(villageId).success ? villageId : null,
    survey_kind: poprawione.surveyKind as RodzajAnkiety,
    rating_overall: poprawione.ratingOverall ?? null,
    rating_ease: poprawione.ratingEase ?? null,
    what_works: poprawione.whatWorks || null,
    what_improve: poprawione.whatImprove || null,
    free_notes: poprawione.freeNotes || null,
    page_path: poprawione.pagePath || null,
    user_role_snapshot: rola,
  });

  if (error) {
    console.error("[wyslijOpiniePlatformy]", error.message);
    return { blad: "Nie udało się zapisać opinii. Spróbuj ponownie." };
  }

  const { data: profil } = await supabase.from("users").select("display_name").eq("id", user.id).maybeSingle();

  void powiadomOperatoraONowejOpinii({
    emailUzytkownika: user.email,
    displayName: profil?.display_name ?? null,
    surveyKind: poprawione.surveyKind,
    ratingOverall: poprawione.ratingOverall ?? null,
    whatImprove: poprawione.whatImprove ?? null,
  });

  revalidatePath("/panel");
  revalidatePath("/panel/sugestie");
  revalidatePath("/panel/admin/sugestie");
  return { ok: true };
}

export async function odroczPromptAnkiety(): Promise<WynikFeedback> {
  const supabase = utworzKlientaSupabaseSerwer();
  const user = await pobierzUzytkownikaDoAkcji();
  if (!user) return { blad: "Zaloguj się." };

  const doKiedy = new Date(Date.now() + DNI_ODROCZENIA_PROMPTU * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from("users")
    .update({ feedback_prompt_snooze_until: doKiedy })
    .eq("id", user.id);

  if (error) return { blad: "Nie udało się odłożyć przypomnienia." };
  revalidatePath("/panel");
  return { ok: true };
}

export async function wylaczAutomatycznyPromptAnkiety(): Promise<WynikFeedback> {
  const supabase = utworzKlientaSupabaseSerwer();
  const user = await pobierzUzytkownikaDoAkcji();
  if (!user) return { blad: "Zaloguj się." };

  const { error } = await supabase.from("users").update({ feedback_never_ask: true }).eq("id", user.id);
  if (error) return { blad: "Nie udało się zapisać preferencji." };
  revalidatePath("/panel");
  return { ok: true };
}
