"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { pobierzUzytkownikaPanelu } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import type { CzestotliwoscPowiadomienia } from "@/lib/powiadomienia/typy-powiadomien-preferences";

const schemaPref = z.object({
  typ_powiadomienia: z.string().min(1).max(64),
  kanal_push: z.enum(["natychmiast", "digest_dzienny", "digest_tygodniowy", "wylaczone"]),
  kanal_email: z.enum(["natychmiast", "digest_dzienny", "digest_tygodniowy", "wylaczone"]),
  kanal_sms: z.enum(["natychmiast", "digest_dzienny", "digest_tygodniowy", "wylaczone"]),
});

export async function zapiszPreferencjePowiadomien(
  prefs: Array<{
    typ_powiadomienia: string;
    kanal_push: CzestotliwoscPowiadomienia;
    kanal_email: CzestotliwoscPowiadomienia;
    kanal_sms: CzestotliwoscPowiadomienia;
  }>,
): Promise<{ ok: true } | { blad: string }> {
  const user = await pobierzUzytkownikaPanelu();
  const supabase = utworzKlientaSupabaseSerwer();

  for (const p of prefs) {
    const parsed = schemaPref.safeParse(p);
    if (!parsed.success) return { blad: "Nieprawidłowe preferencje powiadomień." };
  }

  const rows = prefs.map((p) => ({
    user_id: user.id,
    typ_powiadomienia: p.typ_powiadomienia,
    kanal_push: p.kanal_push,
    kanal_email: p.kanal_email,
    kanal_sms: p.kanal_sms,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("user_notification_preferences").upsert(rows, {
    onConflict: "user_id,typ_powiadomienia",
  });

  if (error) {
    if (error.message.includes("user_notification_preferences")) {
      return { blad: "Preferencje powiadomień wymagają migracji bazy — skontaktuj się z administratorem." };
    }
    return { blad: error.message };
  }

  revalidatePath("/panel/powiadomienia");
  revalidatePath("/panel/profil");
  return { ok: true };
}

export async function pobierzPreferencjePowiadomienSerwer() {
  const user = await pobierzUzytkownikaPanelu();
  const supabase = utworzKlientaSupabaseSerwer();
  const { data } = await supabase
    .from("user_notification_preferences")
    .select("typ_powiadomienia, kanal_push, kanal_email, kanal_sms")
    .eq("user_id", user.id);
  return data ?? [];
}
