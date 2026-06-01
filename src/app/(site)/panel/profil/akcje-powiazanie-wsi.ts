"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { IntencjaOnboardingu } from "@/lib/auth/onboarding-uzytkownika";
import { zlozWniosekSoltysa } from "@/lib/soltys/wniosek-soltysa";
import { zlozWniosekMieszkaniec } from "@/app/(site)/panel/mieszkaniec/akcje";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzUzytkownikaDoAkcji } from "@/lib/auth/pobierz-uzytkownika-serwer";

export type WynikPowiazania = { blad: string } | { ok: true; komunikat: string };

const schema = z
  .object({
    intencja: z.enum(["mieszkaniec", "soltys", "przegladam"]),
    villageId: z.string().uuid().optional().nullable(),
    villageName: z.string().trim().max(200).optional().nullable(),
    commune: z.string().trim().max(100).optional().nullable(),
    county: z.string().trim().max(100).optional().nullable(),
    voivodeship: z.string().trim().max(100).optional().nullable(),
    terytId: z.string().trim().max(20).optional().nullable(),
  })
  .superRefine((d, ctx) => {
    if ((d.intencja === "mieszkaniec" || d.intencja === "soltys") && !d.villageId) {
      ctx.addIssue({ code: "custom", message: "Wybierz miejscowość z katalogu.", path: ["villageId"] });
    }
  });

/** Aktualizacja głównej wsi / intencji konta (po onboardingu). */
export async function zmienPowiazanieKonta(dane: z.infer<typeof schema>): Promise<WynikPowiazania> {
  const parsed = schema.safeParse(dane);
  if (!parsed.success) {
    return { blad: parsed.error.issues[0]?.message ?? "Sprawdź formularz." };
  }

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się." };

  const p = parsed.data;
  const villageId = p.villageId ?? null;
  const label =
    p.villageName && p.commune
      ? `${p.villageName} · ${p.commune}, ${p.county ?? ""}, ${p.voivodeship ?? ""}`
      : (p.villageName ?? "");
  let terytId = p.terytId?.trim() ?? "";

  if (villageId && terytId.length < 4) {
    const { data: wTeryt } = await supabase.from("villages").select("teryt_id").eq("id", villageId).maybeSingle();
    terytId = wTeryt?.teryt_id?.trim() ?? terytId;
  }

  const teraz = new Date().toISOString();
  const { error: metaErr } = await supabase.auth.updateUser({
    data: {
      onboarding_completed_at: teraz,
      signup_intent: p.intencja satisfies IntencjaOnboardingu,
      signup_village_id: villageId ?? "",
      signup_village_label: label,
      signup_village_teryt: terytId,
    },
  });
  if (metaErr) {
    console.error("[zmienPowiazanieKonta]", metaErr.message);
    return { blad: "Nie udało się zapisać ustawień konta." };
  }

  let komunikat = "Zapisano preferencje konta.";

  if (p.intencja === "mieszkaniec" && villageId) {
    const w = await zlozWniosekMieszkaniec(villageId);
    if ("blad" in w && w.blad && !w.blad.includes("już zapis")) {
      return { blad: w.blad };
    }
    komunikat = "Zaktualizowano wieś — wniosek o rolę mieszkańca trafił do sołtysa (jeśli jeszcze go nie masz).";
  }

  if (p.intencja === "soltys" && villageId) {
    if (terytId.length < 4) {
      return { blad: "Brak kodu TERYT — wybierz miejscowość z katalogu." };
    }
    const w = await zlozWniosekSoltysa({
      villageId,
      terytId,
      villageName: p.villageName ?? "Miejscowość",
      commune: p.commune ?? "—",
      county: p.county ?? "—",
      voivodeship: p.voivodeship ?? "—",
      note: "Zmiana powiązania z profilu konta.",
    });
    if ("blad" in w) {
      if (!w.blad.includes("już")) return { blad: w.blad };
    } else {
      komunikat = "Zapisano — wniosek sołtysa jest w panelu „Wniosek sołtysa”.";
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
      console.error("[zmienPowiazanieKonta] follow", error.message);
    }
    komunikat = "Zapisano obserwację wsi — powiadomienia możesz zmienić w „Moje wsi”.";
  }

  revalidatePath("/panel/profil");
  revalidatePath("/panel/moje");
  revalidatePath("/panel/mieszkaniec");
  return { ok: true, komunikat };
}
