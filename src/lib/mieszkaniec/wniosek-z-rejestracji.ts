"use server";

import { z } from "zod";
import { powiadomSoltysowONowymWnioskuRoli } from "@/lib/powiadomienia/powiadom-soltysow-o-wniosku-roli";
import { etykietaRoliWsi } from "@/lib/panel/role-definicje";
import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzUzytkownikaDoAkcji } from "@/lib/auth/pobierz-uzytkownika-serwer";

/** Po rejestracji z intencją „mieszkaniec” — jednorazowo składa wniosek o rolę we wsi z metadanych konta. */
export async function utworzWniosekMieszkaniecZRejestracji(): Promise<void> {
  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user?.user_metadata || typeof user.user_metadata !== "object") return;

  const meta = user.user_metadata as Record<string, unknown>;
  if (meta.signup_intent !== "mieszkaniec") return;

  const villageIdRaw = typeof meta.signup_village_id === "string" ? meta.signup_village_id.trim() : "";
  if (!villageIdRaw || !z.string().uuid().safeParse(villageIdRaw).success) return;

  const { count: istniejace } = await supabase
    .from("user_village_roles")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("village_id", villageIdRaw);

  if (typeof istniejace === "number" && istniejace > 0) return;

  const { error } = await supabase.from("user_village_roles").insert({
    user_id: user.id,
    village_id: villageIdRaw,
    role: "mieszkaniec",
    status: "pending",
  });

  if (error) {
    if (error.code !== "23505") {
      console.error("[utworzWniosekMieszkaniecZRejestracji]", error.message);
    }
    return;
  }

  const adminPowiadomienia = createAdminSupabaseClient();
  if (adminPowiadomienia) {
    void powiadomSoltysowONowymWnioskuRoli(adminPowiadomienia, {
      villageId: villageIdRaw,
      applicantUserId: user.id,
      rolaEtykieta: etykietaRoliWsi("mieszkaniec"),
    }).catch((e) => console.warn("[utworzWniosekMieszkaniecZRejestracji] powiadomienie:", e));
  }
}
