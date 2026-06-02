"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { pobierzUzytkownikaDoAkcji } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { pobierzVillageIdsRoliPaneluSoltysa } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

const uuid = z.string().uuid();

export type AktywnoscFitnessPanel = {
  id: string;
  activity_kind: string;
  title: string;
  activity_date: string;
  distance_meters: number | null;
  status: string;
  autor: string | null;
};

export async function pobierzAktywnosciFitnessPanel(
  villageId: string,
): Promise<AktywnoscFitnessPanel[]> {
  const user = await pobierzUzytkownikaDoAkcji();
  if (!user) return [];
  const supabase = utworzKlientaSupabaseSerwer();
  const ids = await pobierzVillageIdsRoliPaneluSoltysa(supabase, user.id);
  if (!ids.includes(villageId)) return [];

  const { data } = await supabase
    .from("village_fitness_activities")
    .select("id, activity_kind, title, activity_date, distance_meters, status, users(display_name)")
    .eq("village_id", villageId)
    .order("activity_date", { ascending: false })
    .limit(30);

  return (data ?? []).map((r) => {
    const u = r.users as { display_name?: string | null } | null;
    return {
      id: r.id,
      activity_kind: r.activity_kind,
      title: r.title,
      activity_date: r.activity_date,
      distance_meters: r.distance_meters,
      status: r.status,
      autor: u?.display_name ?? null,
    };
  });
}

export async function usunAktywnoscFitnessSoltys(
  id: string,
  villageId: string,
): Promise<{ blad: string } | { ok: true }> {
  const user = await pobierzUzytkownikaDoAkcji();
  if (!user) return { blad: "Zaloguj się." };
  if (!uuid.safeParse(id).success || !uuid.safeParse(villageId).success) {
    return { blad: "Nieprawidłowe dane." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const ids = await pobierzVillageIdsRoliPaneluSoltysa(supabase, user.id);
  if (!ids.includes(villageId)) return { blad: "Brak uprawnień." };

  const { error } = await supabase
    .from("village_fitness_activities")
    .delete()
    .eq("id", id)
    .eq("village_id", villageId);

  if (error) return { blad: "Nie udało się usunąć wpisu." };
  revalidatePath("/wies");
  return { ok: true };
}
