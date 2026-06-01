"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { walidujObszarPolowania } from "@/lib/lowiectwo/geojson-obszar";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzUzytkownikaDoAkcji } from "@/lib/auth/pobierz-uzytkownika-serwer";

const uuid = z.string().uuid();

export type WynikLow = { blad: string } | { ok: true };

async function czySoltysWsi(userId: string, villageId: string): Promise<boolean> {
  const ids = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(userId);
  return ids.includes(villageId);
}

const schemaDodaj = z.object({
  villageId: uuid,
  title: z.string().trim().min(3).max(160),
  areaDescription: z.string().trim().min(5).max(2000),
  safetyNote: z.string().trim().max(2000).optional().nullable(),
  contactPhone: z.string().trim().max(40).optional().nullable(),
  contactName: z.string().trim().max(120).optional().nullable(),
  startsAt: z.string(),
  endsAt: z.string(),
  areaGeojson: z.unknown().optional().nullable(),
});

export async function dodajOstrzezenieLowieckieSoltys(dane: z.infer<typeof schemaDodaj>): Promise<WynikLow> {
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

  const areaGeojson = walidujObszarPolowania(p.data.areaGeojson ?? null);
  if (!areaGeojson) {
    return { blad: "Zaznacz obszar polowania na mapie (min. 3 narożniki)." };
  }

  const { error } = await supabase.from("village_hunting_notices").insert({
    village_id: p.data.villageId,
    created_by: user.id,
    title: p.data.title,
    area_description: p.data.areaDescription,
    safety_note: p.data.safetyNote?.length ? p.data.safetyNote : null,
    contact_phone: p.data.contactPhone?.length ? p.data.contactPhone : null,
    contact_name: p.data.contactName?.length ? p.data.contactName : null,
    starts_at: start.toISOString(),
    ends_at: end.toISOString(),
    area_geojson: areaGeojson,
    status: "approved",
    moderated_by: user.id,
    moderated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("[dodajOstrzezenieLowieckieSoltys]", error.message);
    return { blad: "Nie udało się zapisać." };
  }

  revalidatePath("/panel/soltys/lowiectwo");
  revalidatePath("/wies");
  revalidatePath("/mapa");
  return { ok: true };
}

const schemaObszar = z.object({
  noticeId: uuid,
  areaGeojson: z.unknown(),
});

export async function aktualizujObszarOstrzezeniaLowieckiego(
  dane: z.infer<typeof schemaObszar>,
): Promise<WynikLow> {
  const p = schemaObszar.safeParse(dane);
  if (!p.success) return { blad: "Niepoprawne dane." };

  const areaGeojson = walidujObszarPolowania(p.data.areaGeojson);
  if (!areaGeojson) return { blad: "Zaznacz poprawny obszar na mapie." };

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się." };

  const { data: row } = await supabase
    .from("village_hunting_notices")
    .select("id, village_id")
    .eq("id", p.data.noticeId)
    .maybeSingle();
  if (!row || !(await czySoltysWsi(user.id, row.village_id))) return { blad: "Brak uprawnień." };

  const { error } = await supabase
    .from("village_hunting_notices")
    .update({ area_geojson: areaGeojson })
    .eq("id", p.data.noticeId);

  if (error) return { blad: "Nie udało się zapisać obszaru." };

  revalidatePath("/panel/soltys/lowiectwo");
  revalidatePath("/wies");
  revalidatePath("/mapa");
  return { ok: true };
}

const schemaStatus = z.object({
  noticeId: uuid,
  status: z.enum(["approved", "archived", "rejected"]),
});

export async function zmienStatusOstrzezeniaLowieckiego(dane: z.infer<typeof schemaStatus>): Promise<WynikLow> {
  const p = schemaStatus.safeParse(dane);
  if (!p.success) return { blad: "Niepoprawne dane." };

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się." };

  const { data: row } = await supabase
    .from("village_hunting_notices")
    .select("id, village_id")
    .eq("id", p.data.noticeId)
    .maybeSingle();
  if (!row || !(await czySoltysWsi(user.id, row.village_id))) return { blad: "Brak uprawnień." };

  const { error } = await supabase
    .from("village_hunting_notices")
    .update({
      status: p.data.status,
      moderated_by: user.id,
      moderated_at: new Date().toISOString(),
    })
    .eq("id", p.data.noticeId);

  if (error) return { blad: "Nie udało się zaktualizować." };

  revalidatePath("/panel/soltys/lowiectwo");
  revalidatePath("/wies");
  revalidatePath("/mapa");
  return { ok: true };
}
