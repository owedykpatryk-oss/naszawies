"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  type RodzajWpisuKalendarzaLowieckiego,
  RODZAJE_KALENDARZA_LOWIECKIEGO,
} from "@/lib/lowiectwo/kalendarz-lowiecki";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzUzytkownikaDoAkcji } from "@/lib/auth/pobierz-uzytkownika-serwer";

const uuid = z.string().uuid();

export type WynikKalLow = { blad: string } | { ok: true };

async function czySoltysWsi(userId: string, villageId: string): Promise<boolean> {
  const ids = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(userId);
  return ids.includes(villageId);
}

const rodzajSchema = z.enum(
  RODZAJE_KALENDARZA_LOWIECKIEGO as [RodzajWpisuKalendarzaLowieckiego, ...RodzajWpisuKalendarzaLowieckiego[]],
);

const schemaDodaj = z.object({
  villageId: uuid,
  entryKind: rodzajSchema,
  title: z.string().trim().min(2).max(200),
  startsAt: z.string(),
  endsAt: z.string(),
  poiId: uuid.optional().nullable(),
  standLabel: z.string().trim().max(120).optional().nullable(),
  hunterName: z.string().trim().max(120).optional().nullable(),
  hunterPhone: z.string().trim().max(40).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  huntingNoticeId: uuid.optional().nullable(),
});

export async function dodajWpisKalendarzaLowieckiego(
  dane: z.infer<typeof schemaDodaj>,
): Promise<WynikKalLow> {
  const p = schemaDodaj.safeParse(dane);
  if (!p.success) return { blad: "Uzupełnij poprawnie pola." };

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await czySoltysWsi(user.id, p.data.villageId))) return { blad: "Brak uprawnień." };

  const start = new Date(p.data.startsAt);
  const end = new Date(p.data.endsAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return { blad: "Niepoprawny zakres dat." };
  }

  if (p.data.entryKind === "obowiazek_ambony") {
    const maStoj = Boolean(p.data.poiId) || (p.data.standLabel?.trim().length ?? 0) >= 2;
    const maLow = (p.data.hunterName?.trim().length ?? 0) >= 2;
    if (!maStoj) return { blad: "Wybierz ambonę z mapy lub podaj nazwę stanowiska." };
    if (!maLow) return { blad: "Podaj imię i nazwisko myśliwego na ambony." };
  }

  const { error } = await supabase.from("village_hunting_schedule_entries").insert({
    village_id: p.data.villageId,
    entry_kind: p.data.entryKind,
    title: p.data.title,
    starts_at: start.toISOString(),
    ends_at: end.toISOString(),
    poi_id: p.data.poiId ?? null,
    stand_label: p.data.standLabel?.trim() || null,
    hunter_name: p.data.hunterName?.trim() || null,
    hunter_phone: p.data.hunterPhone?.trim() || null,
    notes: p.data.notes?.trim() || null,
    hunting_notice_id: p.data.huntingNoticeId ?? null,
    created_by: user.id,
  });

  if (error) {
    console.error("[dodajWpisKalendarzaLowieckiego]", error.message);
    return { blad: "Nie udało się zapisać wpisu." };
  }

  revalidatePath("/panel/soltys/lowiectwo/kalendarz");
  revalidatePath("/panel/soltys/kalendarz");
  revalidatePath("/panel/soltys/lowiectwo");
  revalidatePath("/wies");
  return { ok: true };
}

export async function usunWpisKalendarzaLowieckiego(entryId: string, villageId: string): Promise<WynikKalLow> {
  if (!uuid.safeParse(entryId).success || !uuid.safeParse(villageId).success) {
    return { blad: "Niepoprawne dane." };
  }

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await czySoltysWsi(user.id, villageId))) return { blad: "Brak uprawnień." };

  const { error } = await supabase
    .from("village_hunting_schedule_entries")
    .delete()
    .eq("id", entryId)
    .eq("village_id", villageId);

  if (error) return { blad: "Nie udało się usunąć." };

  revalidatePath("/panel/soltys/lowiectwo/kalendarz");
  revalidatePath("/panel/soltys/kalendarz");
  revalidatePath("/wies");
  return { ok: true };
}
