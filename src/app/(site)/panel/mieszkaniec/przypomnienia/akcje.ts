"use server";

import { revalidatePath } from "next/cache";
import { schemaPreferencjePrzypomnien } from "@/lib/przypomnienia/schema-regula";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

export type WynikProsty = { blad: string } | { ok: true };

export async function zapiszPreferencjePrzypomnienMieszkanca(
  dane: import("zod").infer<typeof schemaPreferencjePrzypomnien>,
): Promise<WynikProsty> {
  const parsed = schemaPreferencjePrzypomnien.safeParse(dane);
  if (!parsed.success) return { blad: "Sprawdź ustawienia." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };

  const { data: rola } = await supabase
    .from("user_village_roles")
    .select("id")
    .eq("user_id", user.id)
    .eq("village_id", parsed.data.villageId)
    .eq("status", "active")
    .maybeSingle();

  if (!rola) return { blad: "Musisz być aktywnym mieszkańcem tej wsi." };

  const { error } = await supabase.from("user_resident_reminder_prefs").upsert(
    {
      user_id: user.id,
      village_id: parsed.data.villageId,
      notify_smieci: parsed.data.notify_smieci,
      notify_podatek: parsed.data.notify_podatek,
      notify_dzialka: parsed.data.notify_dzialka,
      notify_pszok: parsed.data.notify_pszok,
      notify_inne: parsed.data.notify_inne,
    },
    { onConflict: "user_id,village_id" },
  );

  if (error) {
    console.error("[zapiszPreferencjePrzypomnienMieszkanca]", error.message);
    return { blad: "Nie udało się zapisać." };
  }

  revalidatePath("/panel/mieszkaniec/przypomnienia");
  revalidatePath("/panel/mieszkaniec");
  return { ok: true };
}
