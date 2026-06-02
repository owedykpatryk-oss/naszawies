"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { pobierzUzytkownikaDoAkcji } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { powiadomONowymAlercie } from "@/lib/alerty/powiadom-o-alercie";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

async function czySoltysWsi(userId: string, villageId: string): Promise<boolean> {
  const ids = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(userId);
  return ids.includes(villageId);
}

const schemaNowy = z.object({
  villageId: z.string().uuid(),
  kind: z.enum(["prad", "woda", "droga", "gaz", "inne"]),
  title: z.string().min(3).max(200),
  body: z.string().max(4000).optional(),
  expectedEndAt: z.string().optional().nullable(),
});

export async function utworzAlertWsi(dane: z.infer<typeof schemaNowy>) {
  const parsed = schemaNowy.safeParse(dane);
  if (!parsed.success) return { blad: "Nieprawidłowe dane alertu." };

  const user = await pobierzUzytkownikaDoAkcji();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await czySoltysWsi(user.id, parsed.data.villageId))) return { blad: "Brak uprawnień we wsi." };

  const supabase = utworzKlientaSupabaseSerwer();

  const { data: wies } = await supabase
    .from("villages")
    .select("slug, voivodeship, county, commune, name")
    .eq("id", parsed.data.villageId)
    .maybeSingle();

  const { data: inserted, error } = await supabase
    .from("village_alerts")
    .insert([
      {
        village_id: parsed.data.villageId,
        kind: parsed.data.kind,
        title: parsed.data.title.trim(),
        body: parsed.data.body?.trim() || null,
        expected_end_at: parsed.data.expectedEndAt || null,
        status: "active",
        created_by: user.id,
      },
    ])
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.message.includes("village_alerts")) return { blad: "Moduł alertów wymaga migracji bazy." };
    return { blad: error.message };
  }

  const admin = createAdminSupabaseClient();
  if (admin && inserted?.id && wies) {
    const sciezka = sciezkaProfiluWsi(wies);
    await powiadomONowymAlercie(admin, {
      villageId: parsed.data.villageId,
      alertId: inserted.id,
      title: `⚠️ ${parsed.data.title.trim()}`,
      body: parsed.data.body?.trim() || `Nowy alert we wsi ${wies.name}.`,
      linkUrl: `${sciezka}#sekcja-alerty-wsi`,
      wykluczUserId: user.id,
    });
  }

  revalidatePath("/panel/soltys/alerty");
  return { ok: true as const };
}

export async function rozwiazAlertWsi(alertId: string, villageId: string) {
  const user = await pobierzUzytkownikaDoAkcji();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await czySoltysWsi(user.id, villageId))) return { blad: "Brak uprawnień." };

  const supabase = utworzKlientaSupabaseSerwer();
  const { error } = await supabase
    .from("village_alerts")
    .update({ status: "resolved", resolved_at: new Date().toISOString() })
    .eq("id", alertId)
    .eq("village_id", villageId);

  if (error) return { blad: error.message };
  revalidatePath("/panel/soltys/alerty");
  return { ok: true as const };
}
