"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzUzytkownikaDoAkcji } from "@/lib/auth/pobierz-uzytkownika-serwer";

const uuid = z.string().uuid();

export type WynikKalendarz = { blad: string } | { ok: true };

async function czySoltysWsi(userId: string, villageId: string): Promise<boolean> {
  const ids = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(userId);
  return ids.includes(villageId);
}

const schemaDodaj = z.object({
  villageId: uuid,
  entryKind: z.enum(["zadanie", "termin", "zebranie", "notatka"]),
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  startsAt: z.string(),
  endsAt: z.string().optional().nullable(),
});

export async function dodajWpisKalendarzaSoltys(dane: z.infer<typeof schemaDodaj>): Promise<WynikKalendarz> {
  const p = schemaDodaj.safeParse(dane);
  if (!p.success) return { blad: "Uzupełnij poprawnie wpis." };

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await czySoltysWsi(user.id, p.data.villageId))) return { blad: "Brak uprawnień." };

  const start = new Date(p.data.startsAt);
  if (Number.isNaN(start.getTime())) return { blad: "Niepoprawna data rozpoczęcia." };
  let endIso: string | null = null;
  if (p.data.endsAt) {
    const end = new Date(p.data.endsAt);
    if (!Number.isNaN(end.getTime())) endIso = end.toISOString();
  }

  const { error } = await supabase.from("village_soltys_calendar_entries").insert({
    village_id: p.data.villageId,
    created_by: user.id,
    entry_kind: p.data.entryKind,
    title: p.data.title,
    description: p.data.description?.length ? p.data.description : null,
    starts_at: start.toISOString(),
    ends_at: endIso,
  });
  if (error) {
    console.error("[dodajWpisKalendarzaSoltys]", error.message);
    return { blad: "Nie udało się zapisać wpisu." };
  }

  revalidatePath("/panel/soltys/kalendarz");
  return { ok: true };
}

const schemaGotowe = z.object({ entryId: uuid });

export async function oznaczWpisKalendarzaJakoGotowy(dane: z.infer<typeof schemaGotowe>): Promise<WynikKalendarz> {
  const p = schemaGotowe.safeParse(dane);
  if (!p.success) return { blad: "Niepoprawny wpis." };

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się." };

  const { data: wpis } = await supabase
    .from("village_soltys_calendar_entries")
    .select("id, village_id")
    .eq("id", p.data.entryId)
    .maybeSingle();
  if (!wpis || !(await czySoltysWsi(user.id, wpis.village_id))) return { blad: "Brak uprawnień." };

  const { error } = await supabase
    .from("village_soltys_calendar_entries")
    .update({ is_done: true })
    .eq("id", p.data.entryId);
  if (error) return { blad: "Nie udało się zaktualizować." };

  revalidatePath("/panel/soltys/kalendarz");
  return { ok: true };
}

export async function usunWpisKalendarzaSoltys(dane: z.infer<typeof schemaGotowe>): Promise<WynikKalendarz> {
  const p = schemaGotowe.safeParse(dane);
  if (!p.success) return { blad: "Niepoprawny wpis." };

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się." };

  const { data: wpis } = await supabase
    .from("village_soltys_calendar_entries")
    .select("id, village_id")
    .eq("id", p.data.entryId)
    .maybeSingle();
  if (!wpis || !(await czySoltysWsi(user.id, wpis.village_id))) return { blad: "Brak uprawnień." };

  const { error } = await supabase.from("village_soltys_calendar_entries").delete().eq("id", p.data.entryId);
  if (error) return { blad: "Nie udało się usunąć." };

  revalidatePath("/panel/soltys/kalendarz");
  return { ok: true };
}
