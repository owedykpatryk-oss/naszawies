"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { czyAdminPlatformy } from "@/lib/admin/czy-admin-platformy";
import { pobierzUzytkownikaDoAkcji } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

const schemaNotatki = z.object({
  id: z.string().uuid(),
  adminStatus: z.enum(["new", "read", "planned", "done"]),
  adminNotes: z.string().trim().max(8000),
});

export type WynikAdminSugestie = { blad: string } | { ok: true };

export async function zapiszNotatkeAdminSugestii(dane: z.infer<typeof schemaNotatki>): Promise<WynikAdminSugestie> {
  const parsed = schemaNotatki.safeParse(dane);
  if (!parsed.success) return { blad: "Niepoprawne dane." };

  const supabase = utworzKlientaSupabaseSerwer();
  if (!(await czyAdminPlatformy(supabase))) return { blad: "Brak uprawnień." };

  const user = await pobierzUzytkownikaDoAkcji();
  if (!user) return { blad: "Zaloguj się." };

  const { error } = await supabase
    .from("platform_user_feedback")
    .update({
      admin_status: parsed.data.adminStatus,
      admin_notes: parsed.data.adminNotes || null,
      admin_updated_at: new Date().toISOString(),
      admin_updated_by: user.id,
    })
    .eq("id", parsed.data.id);

  if (error) {
    console.error("[zapiszNotatkeAdminSugestii]", error.message);
    return { blad: "Nie udało się zapisać." };
  }

  revalidatePath("/panel/admin/sugestie");
  return { ok: true };
}
