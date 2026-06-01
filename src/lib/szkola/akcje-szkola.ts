"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { AUDIENCJE_OGLOSZEN_SZKOLY } from "@/lib/szkola/teksty-szkoly";
import { pobierzVillageIdsRoliPaneluSoltysa } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzUzytkownikaDoAkcji } from "@/lib/auth/pobierz-uzytkownika-serwer";

export type WynikSzkola = { blad: string } | { ok: true };

const schemaOgloszenie = z.object({
  villageId: z.string().uuid(),
  school_group_id: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(2).max(200),
  body: z.string().trim().max(8000).optional().nullable(),
  audience: z.enum(AUDIENCJE_OGLOSZEN_SZKOLY),
  class_label: z.string().trim().max(32).optional().nullable(),
  is_pinned: z.boolean().optional(),
  attachment_url: z.string().trim().max(2048).optional().nullable(),
  valid_until_days: z.coerce.number().int().min(0).max(365).optional(),
});

const schemaId = z.object({
  id: z.string().uuid(),
  villageId: z.string().uuid(),
});

const schemaEdycja = schemaOgloszenie.extend({
  id: z.string().uuid(),
});

const schemaPrzedluz = z.object({
  id: z.string().uuid(),
  villageId: z.string().uuid(),
  dni: z.coerce.number().int().min(1).max(365),
});

async function mozeZarzadzacWies(
  supabase: ReturnType<typeof utworzKlientaSupabaseSerwer>,
  userId: string,
  villageId: string,
): Promise<boolean> {
  const vids = await pobierzVillageIdsRoliPaneluSoltysa(supabase, userId);
  return vids.includes(villageId);
}

async function revalidateSzkola(supabase: ReturnType<typeof utworzKlientaSupabaseSerwer>, villageId: string) {
  const { data: v } = await supabase
    .from("villages")
    .select("voivodeship, county, commune, slug")
    .eq("id", villageId)
    .maybeSingle();
  if (v?.slug) revalidatePath(sciezkaProfiluWsi(v));
  revalidatePath("/panel/soltys/szkola");
  revalidatePath("/panel/soltys/spolecznosc");
  revalidatePath(`/embed/wies/${villageId}/szkola`);
  revalidatePath(`/api/wies/${villageId}/szkola/rss`);
}

export async function dodajOgloszenieSzkoly(dane: z.infer<typeof schemaOgloszenie>): Promise<WynikSzkola> {
  const p = schemaOgloszenie.safeParse(dane);
  if (!p.success) return { blad: "Sprawdź dane ogłoszenia." };

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await mozeZarzadzacWies(supabase, user.id, p.data.villageId))) {
    return { blad: "Brak uprawnień." };
  }

  if (p.data.audience === "klasa" && !p.data.class_label?.trim()) {
    return { blad: "Podaj oznaczenie klasy (np. 5a)." };
  }

  let validUntil: string | null = null;
  if (p.data.valid_until_days && p.data.valid_until_days > 0) {
    validUntil = new Date(Date.now() + p.data.valid_until_days * 86400000).toISOString();
  }

  const { error } = await supabase.from("school_announcements").insert({
    village_id: p.data.villageId,
    school_group_id: p.data.school_group_id ?? null,
    created_by: user.id,
    title: p.data.title,
    body: p.data.body?.trim() || null,
    audience: p.data.audience,
    class_label: p.data.audience === "klasa" ? p.data.class_label?.trim() || null : null,
    is_pinned: p.data.is_pinned === true,
    attachment_url: p.data.attachment_url?.trim() || null,
    valid_until: validUntil,
    status: "approved",
    published_at: new Date().toISOString(),
  });

  if (error) {
    console.error("[dodajOgloszenieSzkoly]", error.message);
    return { blad: "Nie udało się dodać ogłoszenia (uruchom migrację bazy, jeśli tabela nie istnieje)." };
  }

  await revalidateSzkola(supabase, p.data.villageId);
  return { ok: true };
}

export async function edytujOgloszenieSzkoly(dane: z.infer<typeof schemaEdycja>): Promise<WynikSzkola> {
  const p = schemaEdycja.safeParse(dane);
  if (!p.success) return { blad: "Sprawdź dane ogłoszenia." };

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await mozeZarzadzacWies(supabase, user.id, p.data.villageId))) {
    return { blad: "Brak uprawnień." };
  }

  if (p.data.audience === "klasa" && !p.data.class_label?.trim()) {
    return { blad: "Podaj oznaczenie klasy (np. 5a)." };
  }

  const payload: Record<string, unknown> = {
    school_group_id: p.data.school_group_id ?? null,
    title: p.data.title,
    body: p.data.body?.trim() || null,
    audience: p.data.audience,
    class_label: p.data.audience === "klasa" ? p.data.class_label?.trim() || null : null,
    is_pinned: p.data.is_pinned === true,
    attachment_url: p.data.attachment_url?.trim() || null,
    updated_at: new Date().toISOString(),
  };
  if (p.data.valid_until_days && p.data.valid_until_days > 0) {
    payload.valid_until = new Date(Date.now() + p.data.valid_until_days * 86400000).toISOString();
  }

  const { error } = await supabase
    .from("school_announcements")
    .update(payload)
    .eq("id", p.data.id)
    .eq("village_id", p.data.villageId);

  if (error) {
    console.error("[edytujOgloszenieSzkoly]", error.message);
    return { blad: "Nie udało się zapisać zmian." };
  }

  await revalidateSzkola(supabase, p.data.villageId);
  return { ok: true };
}

export async function przedluzOgloszenieSzkoly(dane: z.infer<typeof schemaPrzedluz>): Promise<WynikSzkola> {
  const p = schemaPrzedluz.safeParse(dane);
  if (!p.success) return { blad: "Niepoprawne dane." };

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await mozeZarzadzacWies(supabase, user.id, p.data.villageId))) {
    return { blad: "Brak uprawnień." };
  }

  const { data: cur } = await supabase
    .from("school_announcements")
    .select("valid_until")
    .eq("id", p.data.id)
    .eq("village_id", p.data.villageId)
    .maybeSingle();

  if (!cur) return { blad: "Nie znaleziono ogłoszenia." };

  const baza = cur.valid_until ? new Date(cur.valid_until).getTime() : Date.now();
  const start = Math.max(baza, Date.now());
  const validUntil = new Date(start + p.data.dni * 86400000).toISOString();

  const { error } = await supabase
    .from("school_announcements")
    .update({ valid_until: validUntil, updated_at: new Date().toISOString() })
    .eq("id", p.data.id)
    .eq("village_id", p.data.villageId);

  if (error) {
    console.error("[przedluzOgloszenieSzkoly]", error.message);
    return { blad: "Nie udało się przedłużyć ważności." };
  }

  await revalidateSzkola(supabase, p.data.villageId);
  return { ok: true };
}

const schemaPrzypnij = z.object({
  id: z.string().uuid(),
  villageId: z.string().uuid(),
  is_pinned: z.boolean(),
});

export async function przypnijOgloszenieSzkoly(dane: z.infer<typeof schemaPrzypnij>): Promise<WynikSzkola> {
  const p = schemaPrzypnij.safeParse(dane);
  if (!p.success) return { blad: "Niepoprawne dane." };

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await mozeZarzadzacWies(supabase, user.id, p.data.villageId))) {
    return { blad: "Brak uprawnień." };
  }

  const { error } = await supabase
    .from("school_announcements")
    .update({ is_pinned: p.data.is_pinned })
    .eq("id", p.data.id)
    .eq("village_id", p.data.villageId);

  if (error) {
    console.error("[przypnijOgloszenieSzkoly]", error.message);
    return { blad: "Nie udało się zmienić przypięcia." };
  }

  await revalidateSzkola(supabase, p.data.villageId);
  return { ok: true };
}

export async function usunOgloszenieSzkoly(dane: z.infer<typeof schemaId>): Promise<WynikSzkola> {
  const p = schemaId.safeParse(dane);
  if (!p.success) return { blad: "Niepoprawne dane." };

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await mozeZarzadzacWies(supabase, user.id, p.data.villageId))) {
    return { blad: "Brak uprawnień." };
  }

  const { error } = await supabase
    .from("school_announcements")
    .delete()
    .eq("id", p.data.id)
    .eq("village_id", p.data.villageId);

  if (error) {
    console.error("[usunOgloszenieSzkoly]", error.message);
    return { blad: "Nie udało się usunąć." };
  }

  await revalidateSzkola(supabase, p.data.villageId);
  return { ok: true };
}
