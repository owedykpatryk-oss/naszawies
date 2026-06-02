"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { pobierzUzytkownikaDoAkcji } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

async function czySoltysWsi(userId: string, villageId: string) {
  const ids = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(userId);
  return ids.includes(villageId);
}

const schemaDyżur = z.object({
  villageId: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6).optional().nullable(),
  specificDate: z.string().optional().nullable(),
  startTime: z.string().regex(/^\d{2}:\d{2}/),
  endTime: z.string().regex(/^\d{2}:\d{2}/),
  location: z.string().max(200).optional(),
  notes: z.string().max(500).optional(),
  phone: z.string().max(30).optional(),
});

export async function dodajDyzurSoltysa(dane: z.infer<typeof schemaDyżur>) {
  const p = schemaDyżur.safeParse(dane);
  if (!p.success) return { blad: "Nieprawidłowe dane dyżuru." };
  const user = await pobierzUzytkownikaDoAkcji();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await czySoltysWsi(user.id, p.data.villageId))) return { blad: "Brak uprawnień." };

  const supabase = utworzKlientaSupabaseSerwer();
  const { error } = await supabase.from("soltys_duty_slots").insert([
    {
      village_id: p.data.villageId,
      day_of_week: p.data.dayOfWeek ?? null,
      specific_date: p.data.specificDate || null,
      start_time: p.data.startTime,
      end_time: p.data.endTime,
      location: p.data.location?.trim() || null,
      notes: p.data.notes?.trim() || null,
      phone: p.data.phone?.trim() || null,
    },
  ]);
  if (error) return { blad: error.message.includes("soltys_duty") ? "Wymaga migracji bazy." : error.message };
  revalidatePath("/panel/soltys/dyzury");
  return { ok: true as const };
}

const schemaSmieci = z.object({
  villageId: z.string().uuid(),
  kind: z.enum(["zmieszane", "segregowane", "gabaryty", "pszok", "bio", "inne"]),
  dayOfWeek: z.number().int().min(0).max(6),
  timeHint: z.string().max(80).optional(),
  notes: z.string().max(500).optional(),
});

export async function dodajWpisHarmonogramuSmieci(dane: z.infer<typeof schemaSmieci>) {
  const p = schemaSmieci.safeParse(dane);
  if (!p.success) return { blad: "Nieprawidłowe dane harmonogramu." };
  const user = await pobierzUzytkownikaDoAkcji();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await czySoltysWsi(user.id, p.data.villageId))) return { blad: "Brak uprawnień." };

  const supabase = utworzKlientaSupabaseSerwer();
  const { error } = await supabase.from("village_waste_schedule").insert([
    {
      village_id: p.data.villageId,
      kind: p.data.kind,
      day_of_week: p.data.dayOfWeek,
      time_hint: p.data.timeHint?.trim() || null,
      notes: p.data.notes?.trim() || null,
    },
  ]);
  if (error) return { blad: error.message.includes("village_waste") ? "Wymaga migracji bazy." : error.message };
  revalidatePath("/panel/soltys/samorzad");
  return { ok: true as const };
}

const schemaCykliczna = z.object({
  hallId: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
  eventType: z.string().min(2).max(80),
  eventTitle: z.string().min(2).max(120),
  expectedGuests: z.number().int().min(1).max(500).default(20),
  organizationName: z.string().max(120).optional(),
});

export async function dodajRezerwacjeCykliczna(dane: z.infer<typeof schemaCykliczna>) {
  const p = schemaCykliczna.safeParse(dane);
  if (!p.success) return { blad: "Nieprawidłowe dane rezerwacji cyklicznej." };
  const user = await pobierzUzytkownikaDoAkcji();
  if (!user) return { blad: "Zaloguj się." };

  const supabase = utworzKlientaSupabaseSerwer();
  const { data: hall } = await supabase.from("halls").select("village_id").eq("id", p.data.hallId).maybeSingle();
  if (!hall || !(await czySoltysWsi(user.id, hall.village_id))) return { blad: "Brak uprawnień do sali." };

  const { error } = await supabase.from("hall_recurring_bookings").insert([
    {
      hall_id: p.data.hallId,
      day_of_week: p.data.dayOfWeek,
      start_time: p.data.startTime,
      end_time: p.data.endTime,
      event_type: p.data.eventType,
      event_title: p.data.eventTitle,
      expected_guests: p.data.expectedGuests,
      organization_name: p.data.organizationName?.trim() || null,
      created_by: user.id,
    },
  ]);
  if (error) return { blad: error.message.includes("hall_recurring") ? "Wymaga migracji bazy." : error.message };
  revalidatePath("/panel/soltys/rezerwacje-cykliczne");
  return { ok: true as const };
}
