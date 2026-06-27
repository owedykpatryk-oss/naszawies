"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { IntencjaOnboardingu } from "@/lib/auth/onboarding-uzytkownika";
import { bezpiecznaSciezkaNastepna } from "@/lib/auth/bezpieczna-sciezka-nastepna";
import { pobierzUzytkownikaSerwer } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { domyslnePreferencjeUiNowegoUzytkownika } from "@/lib/uzytkownik/preferencje-ui";
import { etykietaRoliWsi } from "@/lib/panel/role-definicje";
import { powiadomSoltysowONowymWnioskuRoli } from "@/lib/powiadomienia/powiadom-soltysow-o-wniosku-roli";
import { zlozWniosekSoltysa } from "@/lib/soltys/wniosek-soltysa";
import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzUzytkownikaDoAkcji } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { ponowJesliRedirect } from "@/lib/next/ponow-redirect";

export type WynikOnboardingu = { blad: string } | { ok: true; next: string };

const schema = z
  .object({
    intencja: z.enum(["mieszkaniec", "soltys", "przegladam"]),
    villageId: z.string().uuid().optional().nullable(),
    villageName: z.string().trim().max(200).optional().nullable(),
    commune: z.string().trim().max(100).optional().nullable(),
    county: z.string().trim().max(100).optional().nullable(),
    voivodeship: z.string().trim().max(100).optional().nullable(),
    terytId: z.string().trim().max(20).optional().nullable(),
    displayName: z.string().trim().min(2).max(80),
    next: z.string().optional().nullable(),
  })
  .superRefine((d, ctx) => {
    if ((d.intencja === "mieszkaniec" || d.intencja === "soltys") && !d.villageId) {
      ctx.addIssue({
        code: "custom",
        message: "Wybierz miejscowość z katalogu.",
        path: ["villageId"],
      });
    }
    if (d.intencja === "soltys" && !d.villageId) {
      ctx.addIssue({
        code: "custom",
        message: "Wybierz miejscowość z katalogu.",
        path: ["villageId"],
      });
    }
  });

async function zapiszMetadaneOnboardingu(
  supabase: ReturnType<typeof utworzKlientaSupabaseSerwer>,
  intencja: IntencjaOnboardingu,
  villageId: string | null,
  label: string,
  terytId: string,
) {
  const teraz = new Date().toISOString();
  const { error } = await supabase.auth.updateUser({
    data: {
      onboarding_completed_at: teraz,
      signup_intent: intencja,
      signup_village_id: villageId ?? "",
      signup_village_label: label,
      signup_village_teryt: terytId,
      ui_preferences: domyslnePreferencjeUiNowegoUzytkownika(),
    },
  });
  if (error) {
    console.error("[zapiszMetadaneOnboardingu]", error.message);
    throw new Error("Nie udało się zapisać ustawień konta.");
  }
}

export async function zakonczOnboarding(dane: z.infer<typeof schema>): Promise<WynikOnboardingu> {
  const parsed = schema.safeParse(dane);
  if (!parsed.success) {
    return { blad: parsed.error.issues[0]?.message ?? "Sprawdź formularz." };
  }

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się ponownie." };

  const p = parsed.data;
  const next = bezpiecznaSciezkaNastepna(p.next ?? undefined);

  const { error: profilErr } = await supabase
    .from("users")
    .update({ display_name: p.displayName.trim() })
    .eq("id", user.id);
  if (profilErr) {
    console.error("[zakonczOnboarding] display_name", profilErr.message);
  }

  const villageId = p.villageId ?? null;
  const label =
    p.villageName && p.commune
      ? `${p.villageName} · ${p.commune}, ${p.county ?? ""}, ${p.voivodeship ?? ""}`
      : p.villageName ?? "";
  let terytId = p.terytId?.trim() ?? "";
  if (villageId && terytId.length < 4) {
    const { data: wTeryt } = await supabase
      .from("villages")
      .select("teryt_id")
      .eq("id", villageId)
      .maybeSingle();
    terytId = wTeryt?.teryt_id?.trim() ?? terytId;
  }

  try {
    await zapiszMetadaneOnboardingu(supabase, p.intencja, villageId, label, terytId);
  } catch (e) {
    return { blad: e instanceof Error ? e.message : "Błąd zapisu konta." };
  }

  if (p.intencja === "mieszkaniec" && villageId) {
    const { count } = await supabase
      .from("user_village_roles")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("village_id", villageId);
    if ((count ?? 0) === 0) {
      const { error } = await supabase.from("user_village_roles").insert({
        user_id: user.id,
        village_id: villageId,
        role: "mieszkaniec",
        status: "pending",
      });
      if (error && error.code !== "23505") {
        console.error("[zakonczOnboarding] wniosek mieszkaniec", error.message);
        return { blad: "Nie udało się złożyć wniosku o mieszkańca." };
      }
      const admin = createAdminSupabaseClient();
      if (admin) {
        void powiadomSoltysowONowymWnioskuRoli(admin, {
          villageId,
          applicantUserId: user.id,
          rolaEtykieta: etykietaRoliWsi("mieszkaniec"),
        }).catch((err) => console.warn("[zakonczOnboarding] powiadomienie", err));
      }
    }
  }

  if (p.intencja === "soltys" && villageId) {
    if (terytId.length < 4) {
      return { blad: "Brak kodu TERYT dla tej miejscowości — wybierz inną z katalogu lub napisz na kontakt@naszawies.pl." };
    }
    const wynik = await zlozWniosekSoltysa({
      villageId,
      terytId,
      villageName: p.villageName ?? "Miejscowość",
      commune: p.commune ?? "—",
      county: p.county ?? "—",
      voivodeship: p.voivodeship ?? "—",
      note: "Wniosek z onboardingu po pierwszym logowaniu.",
    });
    if ("blad" in wynik) {
      return { blad: wynik.blad };
    }
  }

  if (p.intencja === "przegladam" && villageId) {
    const { error } = await supabase.from("user_follows").insert({
      user_id: user.id,
      village_id: villageId,
      notify_posts: true,
      notify_events: true,
      notify_issues: false,
      notify_alerts: true,
    });
    if (error && error.code !== "23505") {
      console.error("[zakonczOnboarding] obserwacja", error.message);
    }
  }

  revalidatePath("/panel");
  revalidatePath("/panel/mieszkaniec");
  revalidatePath("/panel/moje");
  revalidatePath("/panel/wniosek-soltysa");

  return { ok: true, next: p.intencja === "soltys" ? "/panel/wniosek-soltysa" : next };
}

/** Server component — przekierowanie na onboarding, gdy brak wyboru wsi/roli. */
export async function wymagajOnboardinguJesliTrzeba(sciezka: string, nextPoUknczeniu?: string): Promise<void> {
  const user = await pobierzUzytkownikaSerwer();
  if (!user) return;

  try {
    const { sciezkaPomijaOnboarding, czyUzytkownikUknczylOnboarding } = await import(
      "@/lib/auth/onboarding-uzytkownika"
    );
    if (sciezkaPomijaOnboarding(sciezka)) return;

    const supabase = utworzKlientaSupabaseSerwer();
    const ukonczony = await czyUzytkownikUknczylOnboarding(supabase, user);
    if (ukonczony) return;

    const cel = nextPoUknczeniu ?? sciezka;
    redirect(`/panel/onboarding?next=${encodeURIComponent(cel)}`);
  } catch (e) {
    ponowJesliRedirect(e);
    console.error("[wymagajOnboardinguJesliTrzeba]", e);
  }
}
