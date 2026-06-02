"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { pobierzUzytkownikaDoAkcji } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { czyUrlStrava, parsujGpx } from "@/lib/wies/parse-gpx";
import { pobierzMetadaneStrava, wyciagnijIdAktywnosciStrava } from "@/lib/wies/strava-metadata";
import { polaczRodzajAktywnosci } from "@/lib/wies/wywnioskuj-rodzaj-aktywnosci";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

const uuid = z.string().uuid();

const rodzajeAktywnosci = z.enum(["bieg", "nordic_walking", "rower", "turystyka", "inne"]);

const schemaDodaj = z.object({
  villageId: uuid,
  group_id: z.string().trim().max(40).optional().nullable(),
  activity_kind: rodzajeAktywnosci,
  title: z.string().trim().min(2).max(200),
  activity_date: z.string().trim().min(4).max(50),
  duration_seconds: z.coerce.number().int().min(1).max(86400).optional().nullable(),
  distance_meters: z.coerce.number().int().min(1).max(500_000).optional().nullable(),
  strava_url: z.string().trim().max(2048).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  gpx_xml: z.string().max(2_000_000).optional().nullable(),
});

export type WynikAktywnosciFitness = { blad: string } | { ok: true; id: string };

function groupIdDoInsert(raw: string | null | undefined): string | null {
  const t = raw?.trim();
  if (!t || !z.string().uuid().safeParse(t).success) return null;
  return t;
}

export async function dodajAktywnoscFitness(
  body: z.infer<typeof schemaDodaj>,
): Promise<WynikAktywnosciFitness> {
  const p = schemaDodaj.safeParse(body);
  if (!p.success) {
    return { blad: "Sprawdź tytuł, datę i rodzaj aktywności." };
  }

  const user = await pobierzUzytkownikaDoAkcji();
  if (!user) return { blad: "Zaloguj się, aby dodać aktywność." };

  const d = p.data;
  const activityDate = new Date(d.activity_date);
  if (Number.isNaN(activityDate.getTime())) {
    return { blad: "Nieprawidłowa data aktywności." };
  }

  let durationSeconds = d.duration_seconds ?? null;
  let distanceMeters = d.distance_meters ?? null;
  let source: "manual" | "strava_link" | "gpx" = "manual";
  let stravaUrl: string | null = d.strava_url?.trim() || null;
  let title = d.title;
  const activityKind = polaczRodzajAktywnosci(d.activity_kind, title);

  if (stravaUrl) {
    if (!czyUrlStrava(stravaUrl)) {
      return { blad: "Podaj prawidłowy link do aktywności na Strava." };
    }
    if (!/^https?:\/\//i.test(stravaUrl)) stravaUrl = `https://${stravaUrl}`;
    source = "strava_link";
    const meta = await pobierzMetadaneStrava(stravaUrl);
    if (meta.title && (title.length < 4 || title === "Aktywność Strava")) {
      title = meta.title.slice(0, 200);
    }
    if (!distanceMeters && meta.distanceMeters) distanceMeters = meta.distanceMeters;
  }

  const gpx = d.gpx_xml?.trim();
  if (gpx && gpx.length > 0) {
    const parsed = parsujGpx(gpx);
    if (parsed.distanceMeters) distanceMeters = parsed.distanceMeters;
    if (parsed.durationSeconds) durationSeconds = parsed.durationSeconds;
    if (parsed.startTime) {
      const t = new Date(parsed.startTime);
      if (!Number.isNaN(t.getTime())) activityDate.setTime(t.getTime());
    }
    if (parsed.title && title.length < 4) title = parsed.title.slice(0, 200);
    source = "gpx";
  }

  const finalKind = polaczRodzajAktywnosci(activityKind, title);

  const supabase = utworzKlientaSupabaseSerwer();

  let stravaActivityId: number | null = null;
  if (stravaUrl) {
    const rawId = wyciagnijIdAktywnosciStrava(stravaUrl);
    if (rawId) stravaActivityId = Number(rawId);
    const { data: istnieje } = await supabase
      .from("village_fitness_activities")
      .select("id")
      .eq("village_id", d.villageId)
      .eq("user_id", user.id)
      .eq("strava_url", stravaUrl)
      .neq("status", "rejected")
      .maybeSingle();
    if (istnieje) {
      return { blad: "Ta aktywność Strava została już dodana." };
    }
  }

  const { data: wstaw, error } = await supabase
    .from("village_fitness_activities")
    .insert({
      village_id: d.villageId,
      user_id: user.id,
      group_id: groupIdDoInsert(d.group_id),
      activity_kind: finalKind,
      title,
      activity_date: activityDate.toISOString(),
      duration_seconds: durationSeconds,
      distance_meters: distanceMeters,
      source,
      strava_url: stravaUrl,
      strava_activity_id: stravaActivityId,
      notes: d.notes?.trim() || null,
      status: "approved",
    })
    .select("id")
    .single();

  if (error || !wstaw) {
    if (error?.code === "23505") {
      return { blad: "Ta aktywność Strava została już dodana." };
    }
    return { blad: "Nie udało się zapisać aktywności. Upewnij się, że masz rolę mieszkańca we wsi." };
  }

  revalidatePath(`/wies`);
  return { ok: true, id: wstaw.id };
}

const schemaEdytuj = z.object({
  id: uuid,
  villageId: uuid,
  activity_kind: rodzajeAktywnosci,
  title: z.string().trim().min(2).max(200),
  activity_date: z.string().trim().min(4).max(50),
  duration_seconds: z.coerce.number().int().min(1).max(86400).optional().nullable(),
  distance_meters: z.coerce.number().int().min(1).max(500_000).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export async function edytujAktywnoscFitness(
  body: z.infer<typeof schemaEdytuj>,
): Promise<WynikAktywnosciFitness> {
  const p = schemaEdytuj.safeParse(body);
  if (!p.success) {
    return { blad: "Sprawdź tytuł, datę i rodzaj aktywności." };
  }

  const user = await pobierzUzytkownikaDoAkcji();
  if (!user) return { blad: "Zaloguj się." };

  const d = p.data;
  const activityDate = new Date(d.activity_date);
  if (Number.isNaN(activityDate.getTime())) {
    return { blad: "Nieprawidłowa data aktywności." };
  }

  const title = d.title;
  const finalKind = polaczRodzajAktywnosci(d.activity_kind, title);

  const supabase = utworzKlientaSupabaseSerwer();
  const { data: wstaw, error } = await supabase
    .from("village_fitness_activities")
    .update({
      activity_kind: finalKind,
      title,
      activity_date: activityDate.toISOString(),
      duration_seconds: d.duration_seconds ?? null,
      distance_meters: d.distance_meters ?? null,
      notes: d.notes?.trim() || null,
    })
    .eq("id", d.id)
    .eq("village_id", d.villageId)
    .eq("user_id", user.id)
    .select("id")
    .single();

  if (error || !wstaw) {
    return { blad: "Nie udało się zapisać zmian." };
  }

  revalidatePath(`/wies`);
  return { ok: true, id: wstaw.id };
}

export async function usunAktywnoscFitness(id: string, villageId: string): Promise<{ blad: string } | { ok: true }> {
  const user = await pobierzUzytkownikaDoAkcji();
  if (!user) return { blad: "Zaloguj się." };
  if (!uuid.safeParse(id).success || !uuid.safeParse(villageId).success) {
    return { blad: "Nieprawidłowe dane." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const { error } = await supabase
    .from("village_fitness_activities")
    .delete()
    .eq("id", id)
    .eq("village_id", villageId)
    .eq("user_id", user.id);

  if (error) return { blad: "Nie udało się usunąć wpisu." };
  revalidatePath(`/wies`);
  return { ok: true };
}
