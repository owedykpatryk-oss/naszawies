"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

const uuid = z.string().uuid();

export type WynikProsty = { blad: string } | { ok: true; id?: string };

export async function dodajSubskrypcjeKategoriiRynku(
  villageId: string,
  equipmentCategory: string | null,
): Promise<WynikProsty> {
  const vid = uuid.safeParse(villageId);
  if (!vid.success) return { blad: "Niepoprawna wieś." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };

  const kat = equipmentCategory?.trim() || null;

  const { data, error } = await supabase
    .from("marketplace_category_subscriptions")
    .insert({
      user_id: user.id,
      village_id: vid.data,
      equipment_category: kat,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { blad: "Masz już taką subskrypcję." };
    return { blad: "Nie udało się zapisać subskrypcji." };
  }

  revalidatePath("/panel/mieszkaniec/marketplace");
  const { data: wies } = await supabase.from("villages").select("voivodeship, county, commune, slug").eq("id", vid.data).maybeSingle();
  if (wies) revalidatePath(`${sciezkaProfiluWsi(wies)}/rynek`);
  return { ok: true, id: data?.id };
}

export async function usunSubskrypcjeKategoriiRynku(subscriptionId: string): Promise<WynikProsty> {
  const id = uuid.safeParse(subscriptionId);
  if (!id.success) return { blad: "Niepoprawny identyfikator." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };

  const { error } = await supabase
    .from("marketplace_category_subscriptions")
    .delete()
    .eq("id", id.data)
    .eq("user_id", user.id);

  if (error) return { blad: "Nie udało się usunąć." };

  revalidatePath("/panel/mieszkaniec/marketplace");
  return { ok: true };
}
