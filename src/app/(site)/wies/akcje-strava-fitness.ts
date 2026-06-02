"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { pobierzUzytkownikaDoAkcji } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { czyStravaSkonfigurowana } from "@/lib/strava/konfiguracja";
import { pobierzAktywnoscStravaPoId, pobierzOstatnieAktywnosciStrava } from "@/lib/strava/api";
import { rodzajAktywnosciZeStravy, urlAktywnosciStrava } from "@/lib/strava/mapuj-aktywnosc";
import { rozlaczStrava, statusPolaczeniaStrava } from "@/lib/strava/token-store";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

const uuid = z.string().uuid();

export type AktywnoscStravaDoImportu = {
  id: number;
  name: string;
  sport_type: string;
  start_date_local: string;
  distance_meters: number | null;
  duration_seconds: number | null;
  juzZaimportowana: boolean;
};

export async function pobierzStatusStravaFitness(): Promise<{
  skonfigurowana: boolean;
  polaczone: boolean;
  athleteName: string | null;
}> {
  const skonfigurowana = czyStravaSkonfigurowana();
  const user = await pobierzUzytkownikaDoAkcji();
  if (!user || !skonfigurowana) {
    return { skonfigurowana, polaczone: false, athleteName: null };
  }
  const s = await statusPolaczeniaStrava(user.id);
  return { skonfigurowana, polaczone: s.polaczone, athleteName: s.athleteName };
}

export async function pobierzListeAktywnosciStravaDoImportu(
  villageId: string,
): Promise<{ blad: string } | { aktywnosci: AktywnoscStravaDoImportu[] }> {
  if (!uuid.safeParse(villageId).success) return { blad: "Nieprawidłowa wieś." };
  if (!czyStravaSkonfigurowana()) return { blad: "Integracja Strava nie jest skonfigurowana." };

  const user = await pobierzUzytkownikaDoAkcji();
  if (!user) return { blad: "Zaloguj się." };

  const status = await statusPolaczeniaStrava(user.id);
  if (!status.polaczone) return { blad: "Połącz konto Strava." };

  try {
    const lista = await pobierzOstatnieAktywnosciStrava(user.id, 20);
    const supabase = utworzKlientaSupabaseSerwer();
    const ids = lista.map((a) => a.id);
    const { data: zaimportowane } = await supabase
      .from("village_fitness_activities")
      .select("strava_activity_id")
      .eq("village_id", villageId)
      .eq("user_id", user.id)
      .in("strava_activity_id", ids.length ? ids : [-1]);

    const zestaw = new Set((zaimportowane ?? []).map((r) => Number(r.strava_activity_id)));

    return {
      aktywnosci: lista.map((a) => ({
        id: a.id,
        name: a.name,
        sport_type: a.sport_type || a.type || "",
        start_date_local: a.start_date_local || a.start_date,
        distance_meters: a.distance > 0 ? Math.round(a.distance) : null,
        duration_seconds: a.moving_time > 0 ? a.moving_time : a.elapsed_time > 0 ? a.elapsed_time : null,
        juzZaimportowana: zestaw.has(a.id),
      })),
    };
  } catch (e) {
    return { blad: e instanceof Error ? e.message : "Nie udało się pobrać aktywności ze Strava." };
  }
}

export async function importujAktywnoscZeStravaOAuth(body: {
  villageId: string;
  stravaActivityId: number;
  group_id?: string | null;
}): Promise<{ blad: string } | { ok: true; id: string }> {
  const villageId = uuid.safeParse(body.villageId);
  if (!villageId.success) return { blad: "Nieprawidłowa wieś." };
  if (!Number.isFinite(body.stravaActivityId) || body.stravaActivityId <= 0) {
    return { blad: "Nieprawidłowa aktywność." };
  }
  if (!czyStravaSkonfigurowana()) return { blad: "Integracja Strava nie jest skonfigurowana." };

  const user = await pobierzUzytkownikaDoAkcji();
  if (!user) return { blad: "Zaloguj się." };

  const status = await statusPolaczeniaStrava(user.id);
  if (!status.polaczone) return { blad: "Połącz konto Strava." };

  let groupId: string | null = null;
  const g = body.group_id?.trim();
  if (g && uuid.safeParse(g).success) groupId = g;

  try {
    const a = await pobierzAktywnoscStravaPoId(user.id, body.stravaActivityId);
    const activityDate = new Date(a.start_date_local || a.start_date);
    if (Number.isNaN(activityDate.getTime())) {
      return { blad: "Nieprawidłowa data aktywności Strava." };
    }

    const supabase = utworzKlientaSupabaseSerwer();
    const { data: wstaw, error } = await supabase
      .from("village_fitness_activities")
      .insert({
        village_id: villageId.data,
        user_id: user.id,
        group_id: groupId,
        activity_kind: rodzajAktywnosciZeStravy(a),
        title: a.name.slice(0, 200),
        activity_date: activityDate.toISOString(),
        duration_seconds: a.moving_time > 0 ? a.moving_time : null,
        distance_meters: a.distance > 0 ? Math.round(a.distance) : null,
        source: "strava_oauth",
        strava_url: urlAktywnosciStrava(a.id),
        strava_activity_id: a.id,
        notes: a.description?.trim()?.slice(0, 2000) || null,
        status: "approved",
      })
      .select("id")
      .single();

    if (error || !wstaw) {
      if (error?.code === "23505") {
        return { blad: "Ta aktywność została już dodana." };
      }
      return { blad: "Nie udało się zapisać. Upewnij się, że masz rolę mieszkańca we wsi." };
    }

    revalidatePath("/wies");
    return { ok: true, id: wstaw.id };
  } catch (e) {
    return { blad: e instanceof Error ? e.message : "Import ze Strava nie powiódł się." };
  }
}

export async function rozlaczKontoStravaFitness(): Promise<{ blad: string } | { ok: true }> {
  const user = await pobierzUzytkownikaDoAkcji();
  if (!user) return { blad: "Zaloguj się." };
  await rozlaczStrava(user.id);
  revalidatePath("/wies");
  return { ok: true };
}
