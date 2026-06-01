"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { pobierzUzytkownikaDoAkcji } from "@/lib/auth/pobierz-uzytkownika-serwer";

type Wynik = { ok?: true; blad?: string; candle_count?: number; zapalona?: boolean };

export async function zapalSwieczkeHistorii(entryId: string): Promise<Wynik> {
  const id = z.string().uuid().safeParse(entryId);
  if (!id.success) return { blad: "Niepoprawny wpis." };

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się, aby zapalić świeczkę pamięci." };

  const { data: wpis } = await supabase
    .from("village_history_entries")
    .select("id, village_id, status, candle_count")
    .eq("id", id.data)
    .eq("status", "approved")
    .maybeSingle();

  if (!wpis) return { blad: "Nie znaleziono wpisu." };

  const { data: istnieje } = await supabase
    .from("village_history_candles")
    .select("id")
    .eq("entry_id", id.data)
    .eq("user_id", user.id)
    .maybeSingle();

  if (istnieje) {
    const { error: delE } = await supabase
      .from("village_history_candles")
      .delete()
      .eq("id", istnieje.id);
    if (delE) return { blad: "Nie udało się zgasić świeczki." };
    const nowy = Math.max(0, (wpis.candle_count as number) - 1);
    await supabase.from("village_history_entries").update({ candle_count: nowy }).eq("id", id.data);
    await rewalidujWpis(id.data, wpis.village_id as string);
    return { ok: true, candle_count: nowy, zapalona: false };
  }

  const { error: insE } = await supabase.from("village_history_candles").insert({
    entry_id: id.data,
    user_id: user.id,
  });
  if (insE) {
    console.error("[zapalSwieczkeHistorii]", insE.message);
    return { blad: "Nie udało się zapalić świeczki." };
  }
  const nowy = (wpis.candle_count as number) + 1;
  await supabase.from("village_history_entries").update({ candle_count: nowy }).eq("id", id.data);
  await rewalidujWpis(id.data, wpis.village_id as string);
  return { ok: true, candle_count: nowy, zapalona: true };
}

export async function czyUzytkownikZapalilSwieczke(entryId: string, userId: string | null): Promise<boolean> {
  if (!userId) return false;
  const supabase = utworzKlientaSupabaseSerwer();
  const { data } = await supabase
    .from("village_history_candles")
    .select("id")
    .eq("entry_id", entryId)
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data);
}

export async function zwiekszWyswietlenieHistorii(entryId: string): Promise<void> {
  const id = z.string().uuid().safeParse(entryId);
  if (!id.success) return;

  const supabase = utworzKlientaSupabaseSerwer();
  const { data: wpis } = await supabase
    .from("village_history_entries")
    .select("id, village_id, view_count")
    .eq("id", id.data)
    .eq("status", "approved")
    .maybeSingle();
  if (!wpis) return;

  await supabase
    .from("village_history_entries")
    .update({ view_count: (wpis.view_count as number) + 1 })
    .eq("id", id.data);
}

async function rewalidujWpis(entryId: string, villageId: string) {
  const { data: wies } = await utworzKlientaSupabaseSerwer()
    .from("villages")
    .select("voivodeship, county, commune, slug")
    .eq("id", villageId)
    .maybeSingle();
  if (wies) {
    const sciezka = sciezkaProfiluWsi(wies);
    revalidatePath(sciezka);
    revalidatePath(`${sciezka}/historia`);
    revalidatePath(`${sciezka}/historia/${entryId}`);
  }
}
