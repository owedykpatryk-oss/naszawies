"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { uzupelnijRelacjeTransportoweUzytkownika } from "@/lib/transport/uzupelnij-relacje-transportowe";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzUzytkownikaDoAkcji } from "@/lib/auth/pobierz-uzytkownika-serwer";

const schemaAktualizacji = z.object({
  id: z.string().uuid(),
  notifyDelayMin: z.number().int().min(1).max(240),
  notifyCancelled: z.boolean(),
  notifyDisruptions: z.boolean(),
  isActive: z.boolean(),
});

export type WynikMojeTransport = { ok: true } | { ok: false; blad: string };

export async function aktualizujRelacjeTransportowa(dane: z.infer<typeof schemaAktualizacji>): Promise<WynikMojeTransport> {
  const parsed = schemaAktualizacji.safeParse(dane);
  if (!parsed.success) return { ok: false, blad: "Nieprawidłowe dane." };

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { ok: false, blad: "Zaloguj się." };

  const { error } = await supabase
    .from("user_transport_favorite_relations")
    .update({
      notify_delay_min: parsed.data.notifyDelayMin,
      notify_cancelled: parsed.data.notifyCancelled,
      notify_disruptions: parsed.data.notifyDisruptions,
      is_active: parsed.data.isActive,
    })
    .eq("id", parsed.data.id)
    .eq("user_id", user.id);

  if (error) return { ok: false, blad: error.message };

  revalidatePath("/panel/moje/transport");
  revalidatePath("/panel/moje/ulubione");
  return { ok: true };
}

export async function odswiezStacjeDoceloweRelacji(): Promise<WynikMojeTransport & { zaktualizowano?: number }> {
  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { ok: false, blad: "Zaloguj się." };

  const { zaktualizowano } = await uzupelnijRelacjeTransportoweUzytkownika(supabase, user.id);
  revalidatePath("/panel/moje/transport");
  return { ok: true, zaktualizowano };
}
