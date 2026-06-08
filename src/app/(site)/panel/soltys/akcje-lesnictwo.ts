"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { czyRodzajOstrzezeniaLesnego } from "@/lib/lesnictwo/kategorie-ostrzezen";
import { profilLesnictwaZFormularza, schemaProfilLesnictwa } from "@/lib/lesnictwo/profil-lesnictwa";
import { walidujObszarPolowania } from "@/lib/lowiectwo/geojson-obszar";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzUzytkownikaDoAkcji } from "@/lib/auth/pobierz-uzytkownika-serwer";

const uuid = z.string().uuid();

export type WynikLes = { blad: string } | { ok: true };

async function czySoltysWsi(userId: string, villageId: string): Promise<boolean> {
  const ids = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(userId);
  return ids.includes(villageId);
}

const schemaProfil = z.object({
  villageId: uuid,
  opublikowany: z.boolean(),
  profileData: schemaProfilLesnictwa,
});

export async function zapiszProfilLesnictwaSoltys(dane: z.infer<typeof schemaProfil>): Promise<WynikLes> {
  const p = schemaProfil.safeParse(dane);
  if (!p.success) return { blad: "Uzupełnij poprawnie pola profilu." };

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await czySoltysWsi(user.id, p.data.villageId))) return { blad: "Brak uprawnień." };

  const { error } = await supabase.from("village_forestry_profiles").upsert(
    {
      village_id: p.data.villageId,
      profile_data: p.data.profileData,
      is_published: p.data.opublikowany,
    },
    { onConflict: "village_id" },
  );

  if (error) {
    console.error("[zapiszProfilLesnictwaSoltys]", error.message);
    return { blad: "Nie udało się zapisać profilu." };
  }

  revalidatePath("/panel/soltys/lesnictwo");
  revalidateTag(`profil-wsi-${p.data.villageId}`);
  return { ok: true };
}

export async function zapiszProfilLesnictwaZFormularza(fd: FormData): Promise<WynikLes> {
  const villageId = String(fd.get("village_id") ?? "");
  const opublikowany = fd.get("opublikowany") === "1";
  return zapiszProfilLesnictwaSoltys({
    villageId,
    opublikowany,
    profileData: profilLesnictwaZFormularza(fd),
  });
}

const schemaDodaj = z.object({
  villageId: uuid,
  noticeKind: z.string(),
  title: z.string().trim().min(3).max(160),
  areaDescription: z.string().trim().min(5).max(2000),
  safetyNote: z.string().trim().max(2000).optional().nullable(),
  contactPhone: z.string().trim().max(40).optional().nullable(),
  contactName: z.string().trim().max(120).optional().nullable(),
  startsAt: z.string(),
  endsAt: z.string(),
  areaGeojson: z.unknown().optional().nullable(),
});

export async function dodajOstrzezenieLesneSoltys(dane: z.infer<typeof schemaDodaj>): Promise<WynikLes> {
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

  const kind = czyRodzajOstrzezeniaLesnego(p.data.noticeKind) ? p.data.noticeKind : "inne";
  const areaGeojson = p.data.areaGeojson ? walidujObszarPolowania(p.data.areaGeojson) : null;
  if (p.data.areaGeojson && !areaGeojson) {
    return { blad: "Obszar na mapie jest niepoprawny — narysuj ponownie lub zostaw pusty." };
  }

  const { error } = await supabase.from("village_forestry_notices").insert({
    village_id: p.data.villageId,
    created_by: user.id,
    notice_kind: kind,
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
    console.error("[dodajOstrzezenieLesneSoltys]", error.message);
    return { blad: "Nie udało się zapisać." };
  }

  revalidatePath("/panel/soltys/lesnictwo");
  revalidatePath("/wies");
  revalidatePath("/mapa");
  return { ok: true };
}

const schemaObszar = z.object({
  noticeId: uuid,
  areaGeojson: z.unknown().nullable(),
});

export async function aktualizujObszarOstrzezeniaLesnego(dane: z.infer<typeof schemaObszar>): Promise<WynikLes> {
  const p = schemaObszar.safeParse(dane);
  if (!p.success) return { blad: "Niepoprawne dane." };

  const areaGeojson = p.data.areaGeojson ? walidujObszarPolowania(p.data.areaGeojson) : null;
  if (p.data.areaGeojson && !areaGeojson) return { blad: "Zaznacz poprawny obszar na mapie." };

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się." };

  const { data: row } = await supabase
    .from("village_forestry_notices")
    .select("id, village_id")
    .eq("id", p.data.noticeId)
    .maybeSingle();
  if (!row || !(await czySoltysWsi(user.id, row.village_id))) return { blad: "Brak uprawnień." };

  const { error } = await supabase
    .from("village_forestry_notices")
    .update({ area_geojson: areaGeojson })
    .eq("id", p.data.noticeId);

  if (error) return { blad: "Nie udało się zapisać obszaru." };

  revalidatePath("/panel/soltys/lesnictwo");
  revalidatePath("/wies");
  revalidatePath("/mapa");
  return { ok: true };
}

const schemaStatus = z.object({
  noticeId: uuid,
  status: z.enum(["approved", "archived", "rejected"]),
});

export async function zmienStatusOstrzezeniaLesnego(dane: z.infer<typeof schemaStatus>): Promise<WynikLes> {
  const p = schemaStatus.safeParse(dane);
  if (!p.success) return { blad: "Niepoprawne dane." };

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się." };

  const { data: row } = await supabase
    .from("village_forestry_notices")
    .select("id, village_id")
    .eq("id", p.data.noticeId)
    .maybeSingle();
  if (!row || !(await czySoltysWsi(user.id, row.village_id))) return { blad: "Brak uprawnień." };

  const { error } = await supabase
    .from("village_forestry_notices")
    .update({
      status: p.data.status,
      moderated_by: user.id,
      moderated_at: new Date().toISOString(),
    })
    .eq("id", p.data.noticeId);

  if (error) return { blad: "Nie udało się zaktualizować." };

  revalidatePath("/panel/soltys/lesnictwo");
  revalidatePath("/wies");
  revalidatePath("/mapa");
  return { ok: true };
}
