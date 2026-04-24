"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

const uuid = z.string().uuid();

export type WynikProsty = { blad: string } | { ok: true };

export async function oznaczPowiadomienieJakoPrzeczytane(powiadomienieId: string): Promise<WynikProsty> {
  const id = uuid.safeParse(powiadomienieId);
  if (!id.success) {
    return { blad: "Niepoprawny identyfikator." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", id.data)
    .eq("user_id", user.id);

  if (error) {
    return { blad: "Nie udało się zaktualizować." };
  }

  revalidatePath("/panel/powiadomienia");
  return { ok: true };
}
