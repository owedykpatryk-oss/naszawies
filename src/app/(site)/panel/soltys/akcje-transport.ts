"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { synchronizujAutobusyAutomatycznie } from "@/lib/transport/synchronizuj-autobusy-automatycznie";
import { synchronizujTransportAutomatycznie } from "@/lib/transport/synchronizuj-transport-automatycznie";
import { pobierzUzytkownikaDoAkcji } from "@/lib/auth/pobierz-uzytkownika-serwer";

const schemaMapowanie = z.object({
  villageId: z.string().uuid(),
  stationId: z.string().trim().min(1).max(64),
  stationName: z.string().trim().min(2).max(120),
  poiId: z.string().uuid().optional().nullable(),
});

export type WynikTransport = { ok: true } | { ok: false; blad: string };

export async function ustawRecznaStacjePkpSoltys(dane: z.infer<typeof schemaMapowanie>): Promise<WynikTransport> {
  const parsed = schemaMapowanie.safeParse(dane);
  if (!parsed.success) return { ok: false, blad: parsed.error.issues[0]?.message ?? "Sprawdź pola." };

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { ok: false, blad: "Zaloguj się." };

  const ids = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  if (!ids.includes(parsed.data.villageId)) return { ok: false, blad: "Brak uprawnień do tej wsi." };

  const { error } = await supabase.from("village_transport_stations").upsert(
    {
      village_id: parsed.data.villageId,
      poi_id: parsed.data.poiId ?? null,
      station_id: parsed.data.stationId,
      station_name: parsed.data.stationName,
      station_name_source: "ręczne mapowanie sołtysa",
      is_active: true,
      is_manual_override: true,
      synced_at: new Date().toISOString(),
    },
    { onConflict: "village_id,station_id" },
  );

  if (error) return { ok: false, blad: error.message };

  const admin = createAdminSupabaseClient();
  if (admin) {
    await synchronizujTransportAutomatycznie(admin, {
      tylkoVillageIds: [parsed.data.villageId],
      wymus: true,
    });
  }

  revalidatePath("/panel/soltys/transport");
  revalidatePath(`/wies`);
  return { ok: true };
}

export async function usunRecznaStacjePkpSoltys(args: { id: string }): Promise<WynikTransport> {
  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { ok: false, blad: "Zaloguj się." };

  const { data: row } = await supabase
    .from("village_transport_stations")
    .select("village_id")
    .eq("id", args.id)
    .maybeSingle();

  if (!row) return { ok: false, blad: "Nie znaleziono wpisu." };

  const ids = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  if (!ids.includes(row.village_id)) return { ok: false, blad: "Brak uprawnień." };

  const { error } = await supabase.from("village_transport_stations").delete().eq("id", args.id);
  if (error) return { ok: false, blad: error.message };

  revalidatePath("/panel/soltys/transport");
  return { ok: true };
}

const schemaOdswiez = z.object({
  villageId: z.string().uuid(),
});

export type WynikOdswiezTransportu =
  | {
      ok: true;
      kolejOdjazdy: number;
      autobusOdjazdy: number;
      bledy: string[];
    }
  | { ok: false; blad: string };

/** Ręczne odświeżenie cache PKP i autobusów dla jednej wsi (sołtys). */
export async function odswiezTransportWsiSoltysa(
  dane: z.infer<typeof schemaOdswiez>,
): Promise<WynikOdswiezTransportu> {
  const parsed = schemaOdswiez.safeParse(dane);
  if (!parsed.success) return { ok: false, blad: "Nieprawidłowa wieś." };

  const user = await pobierzUzytkownikaDoAkcji();
  if (!user) return { ok: false, blad: "Zaloguj się." };

  const ids = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  if (!ids.includes(parsed.data.villageId)) return { ok: false, blad: "Brak uprawnień do tej wsi." };

  const admin = createAdminSupabaseClient();
  if (!admin) {
    return {
      ok: false,
      blad: "Brak SUPABASE_SERVICE_ROLE_KEY — synchronizacja tylko z crona.",
    };
  }

  const villageIds = [parsed.data.villageId];
  const kolej = await synchronizujTransportAutomatycznie(admin, {
    tylkoVillageIds: villageIds,
    wymus: true,
  });
  const autobus = await synchronizujAutobusyAutomatycznie(admin, { tylkoVillageIds: villageIds });

  revalidatePath("/panel/soltys/transport");
  revalidatePath(`/wies`);

  const bledy = [...kolej.errors, ...autobus.errors];
  if (!kolej.enabled && autobus.provider === "none") {
    return {
      ok: false,
      blad: "Transport wyłączony (PKP_PLK_API_KEY / TRANSPORT_SYNC_ENABLED lub brak API autobusów).",
    };
  }

  return {
    ok: true,
    kolejOdjazdy: kolej.departuresUpserted,
    autobusOdjazdy: autobus.departuresUpserted,
    bledy,
  };
}
