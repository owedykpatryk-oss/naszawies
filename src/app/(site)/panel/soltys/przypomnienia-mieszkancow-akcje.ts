"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DOMYSLNE_REGULY_WSI } from "@/lib/przypomnienia/domyslne-reguly";
import { schemaRegulaPrzypomnienia } from "@/lib/przypomnienia/schema-regula";
import { linkPowiadomienia } from "@/lib/tekst/bezpieczny-url";
import { pobierzVillageIdsRoliPaneluSoltysa } from "@/lib/panel/rola-panelu-soltysa";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzUzytkownikaDoAkcji } from "@/lib/auth/pobierz-uzytkownika-serwer";

export type WynikProsty = { blad: string } | { ok: true; dodano?: number };

const uuid = z.string().uuid();

async function czyUzytkownikMozeZarzadzacWsia(
  supabase: ReturnType<typeof utworzKlientaSupabaseSerwer>,
  userId: string,
  villageId: string,
) {
  const ids = await pobierzVillageIdsRoliPaneluSoltysa(supabase, userId);
  return ids.includes(villageId);
}

export async function dodajRegulePrzypomnieniaMieszkancow(
  dane: z.infer<typeof schemaRegulaPrzypomnienia>,
): Promise<WynikProsty> {
  const parsed = schemaRegulaPrzypomnienia.safeParse(dane);
  if (!parsed.success) return { blad: "Sprawdź pola przypomnienia." };

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await czyUzytkownikMozeZarzadzacWsia(supabase, user.id, parsed.data.villageId))) {
    return { blad: "Brak uprawnień do tej wsi." };
  }

  const { count: liczbaRegul } = await supabase
    .from("village_resident_reminders")
    .select("id", { count: "exact", head: true })
    .eq("village_id", parsed.data.villageId);

  if ((liczbaRegul ?? 0) >= 40) {
    return { blad: "Maksymalnie 40 przypomnień na wieś — usuń zbędne przed dodaniem kolejnego." };
  }

  const { error } = await supabase.from("village_resident_reminders").insert({
    village_id: parsed.data.villageId,
    kind: parsed.data.kind,
    title: parsed.data.title,
    body: parsed.data.body?.trim() || null,
    recurrence: parsed.data.recurrence,
    day_of_week: parsed.data.recurrence === "weekly" ? parsed.data.day_of_week : null,
    day_of_month:
      parsed.data.recurrence === "monthly" || parsed.data.recurrence === "yearly"
        ? parsed.data.day_of_month
        : null,
    month: parsed.data.recurrence === "yearly" ? parsed.data.month : null,
    days_before: parsed.data.days_before,
      link_url: parsed.data.link_url
        ? linkPowiadomienia(parsed.data.link_url, "/panel/mieszkaniec/przypomnienia")
        : null,
    created_by: user.id,
    is_active: true,
  });

  if (error) {
    console.error("[dodajRegulePrzypomnieniaMieszkancow]", error.message);
    return { blad: "Nie udało się dodać przypomnienia." };
  }

  await revalidatePoZmianie(supabase, parsed.data.villageId);
  return { ok: true };
}

export async function usunRegulePrzypomnieniaMieszkancow(ruleId: string): Promise<WynikProsty> {
  const id = uuid.safeParse(ruleId);
  if (!id.success) return { blad: "Niepoprawny identyfikator." };

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się." };

  const { data: row } = await supabase
    .from("village_resident_reminders")
    .select("village_id")
    .eq("id", id.data)
    .maybeSingle();

  if (!row || !(await czyUzytkownikMozeZarzadzacWsia(supabase, user.id, row.village_id))) {
    return { blad: "Nie znaleziono lub brak uprawnień." };
  }

  const { error } = await supabase.from("village_resident_reminders").delete().eq("id", id.data);
  if (error) return { blad: "Nie udało się usunąć." };

  await revalidatePoZmianie(supabase, row.village_id);
  return { ok: true };
}

export async function dodajDomyslneRegulyPrzypomnienWsi(villageId: string): Promise<WynikProsty> {
  const vid = uuid.safeParse(villageId);
  if (!vid.success) return { blad: "Nieprawidłowa wieś." };

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await czyUzytkownikMozeZarzadzacWsia(supabase, user.id, vid.data))) {
    return { blad: "Brak uprawnień." };
  }

  const { count } = await supabase
    .from("village_resident_reminders")
    .select("id", { count: "exact", head: true })
    .eq("village_id", vid.data);

  if ((count ?? 0) > 0) {
    return { blad: "Wieś ma już reguły — usuń stare lub dodaj pojedynczo." };
  }

  const wstaw = DOMYSLNE_REGULY_WSI.map((r) => ({
    village_id: vid.data,
    kind: r.kind,
    title: r.title,
    body: r.body,
    recurrence: r.recurrence,
    day_of_week: r.recurrence === "weekly" ? (r.day_of_week ?? null) : null,
    day_of_month:
      r.recurrence === "monthly" || r.recurrence === "yearly" ? (r.day_of_month ?? null) : null,
    month: r.recurrence === "yearly" ? (r.month ?? null) : null,
    days_before: r.days_before,
    sort_order: r.sort_order,
    created_by: user.id,
    is_active: true,
  }));

  const { error } = await supabase.from("village_resident_reminders").insert(wstaw);
  if (error) {
    console.error("[dodajDomyslneRegulyPrzypomnienWsi]", error.message);
    return { blad: "Nie udało się dodać szablonów." };
  }

  await revalidatePoZmianie(supabase, vid.data);
  return { ok: true, dodano: wstaw.length };
}

async function revalidatePoZmianie(
  supabase: ReturnType<typeof utworzKlientaSupabaseSerwer>,
  villageId: string,
) {
  const { data: v } = await supabase
    .from("villages")
    .select("voivodeship, county, commune, slug")
    .eq("id", villageId)
    .maybeSingle();
  if (v?.slug) revalidatePath(sciezkaProfiluWsi(v));
  revalidatePath("/panel/soltys/samorzad");
  revalidatePath("/panel/mieszkaniec/przypomnienia");
}
