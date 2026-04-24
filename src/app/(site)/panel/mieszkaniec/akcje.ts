"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { R2_BUCKET_BOOKING_DAMAGE } from "@/lib/cloudflare/r2-bucket-znaczniki";
import { wyciagnijBucketIKluczZUrlaR2 } from "@/lib/cloudflare/r2-url-pomoc";
import {
  MAX_ZDJEC_DOKUMENTACJA_ZNISZCZEN,
  MAX_ZNAKOW_OPISU_PO_WYDARZENIU,
} from "@/lib/swietlica/limity-dokumentacji-zniszczen";
import { usunObiektR2 } from "@/lib/cloudflare/r2-s3-klient";
import { pobierzVillageIdsRoliPaneluSoltysa } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

const uuid = z.string().uuid();

export type WynikProsty = { blad: string } | { ok: true; komunikat?: string };

export async function zlozWniosekMieszkaniec(villageId: string): Promise<WynikProsty> {
  const v = uuid.safeParse(villageId);
  if (!v.success) {
    return { blad: "Niepoprawny identyfikator wsi." };
  }
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const { error } = await supabase.from("user_village_roles").insert({
    user_id: user.id,
    village_id: v.data,
    role: "mieszkaniec",
    status: "pending",
  });

  if (error) {
    if (error.code === "23505") {
      return { blad: "Masz już zapis na tę wieś (wnioskujesz lub jesteś zapisany)." };
    }
    console.error("[zlozWniosekMieszkaniec]", error.message);
    return { blad: "Nie udało się złożyć wniosku." };
  }

  revalidatePath("/panel/mieszkaniec");
  revalidatePath("/panel/soltys");
  return { ok: true, komunikat: "Wniosek wysłany — czekaj na akceptację sołtysa." };
}

export async function obserwujWies(villageId: string): Promise<WynikProsty> {
  const v = uuid.safeParse(villageId);
  if (!v.success) {
    return { blad: "Niepoprawny identyfikator wsi." };
  }
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const { error } = await supabase.from("user_follows").insert({
    user_id: user.id,
    village_id: v.data,
    notify_posts: true,
    notify_events: true,
    notify_issues: false,
    notify_alerts: true,
  });

  if (error) {
    if (error.code === "23505") {
      return { blad: "Już obserwujesz tę wieś." };
    }
    console.error("[obserwujWies]", error.message);
    return { blad: "Nie udało się dodać obserwacji." };
  }

  revalidatePath("/panel/mieszkaniec");
  return { ok: true, komunikat: "Dodano obserwację wsi (powiadomienia — w rozwoju)." };
}

const typyWydarzen = ["urodziny", "wesele", "zebranie", "zajecia", "inne"] as const;

const schemaRezerwacjaSwietlicy = z.object({
  hallId: z.string().uuid(),
  startAt: z.string().min(1),
  endAt: z.string().min(1),
  eventType: z.enum(typyWydarzen),
  eventTitle: z.string().trim().max(200).optional().nullable(),
  expectedGuests: z.coerce.number().int().min(1).max(5000),
  hasAlcohol: z.boolean(),
  contactPhone: z.string().trim().max(40).optional().nullable(),
  acceptRules: z.literal(true),
});

export async function zlozRezerwacjeSwietlicy(
  dane: z.infer<typeof schemaRezerwacjaSwietlicy>
): Promise<WynikProsty> {
  const parsed = schemaRezerwacjaSwietlicy.safeParse(dane);
  if (!parsed.success) {
    return { blad: "Uzupełnij formularz i zaakceptuj regulamin sali." };
  }

  const start = new Date(parsed.data.startAt);
  const end = new Date(parsed.data.endAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { blad: "Niepoprawny zakres dat." };
  }
  if (end <= start) {
    return { blad: "Godzina zakończenia musi być późniejsza niż rozpoczęcia." };
  }
  const maxMs = 1000 * 60 * 60 * 24 * 7;
  if (end.getTime() - start.getTime() > maxMs) {
    return { blad: "Jedna rezerwacja może trwać maksymalnie 7 dni." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const p = parsed.data;
  const startIso = start.toISOString();
  const endIso = end.toISOString();
  const { data: maKolizje, error: kE } = await supabase.rpc("hall_ma_kolizje_terminu", {
    p_hall_id: p.hallId,
    p_start: startIso,
    p_end: endIso,
  });

  if (kE) {
    console.error("[zlozRezerwacjeSwietlicy] kolid", kE.message);
    return { blad: "Nie udało się sprawdzić wolnych terminów — spróbuj ponownie." };
  }
  if (maKolizje === true) {
    return {
      blad: "W tym przedziale sala jest już wstępnie lub ostatecznie zarezerwowana — wybierz inne godziny lub dzień.",
    };
  }

  const { error } = await supabase.from("hall_bookings").insert({
    hall_id: p.hallId,
    booked_by: user.id,
    start_at: startIso,
    end_at: endIso,
    event_type: p.eventType,
    event_title: p.eventTitle?.length ? p.eventTitle : null,
    expected_guests: p.expectedGuests,
    has_alcohol: p.hasAlcohol,
    contact_phone: p.contactPhone?.length ? p.contactPhone : null,
    rules_accepted_at: new Date().toISOString(),
    status: "pending",
  });

  if (error) {
    console.error("[zlozRezerwacjeSwietlicy]", error.message);
    return { blad: "Nie udało się złożyć rezerwacji (sprawdź dostęp do sali lub dane)." };
  }

  revalidatePath(`/panel/mieszkaniec/swietlica/${p.hallId}`);
  revalidatePath("/panel/soltys/rezerwacje");
  return { ok: true, komunikat: "Wniosek o rezerwację wysłany — sołtys zatwierdzi w panelu." };
}

const schemaUrlZniszczenia = z.string().url().max(2048);

type WierszRezerwacjiZniszczenia = {
  hall_id: string;
  urls: string[];
};

async function pobierzRezerwacjeDoDokumentacjiZniszczen(
  supabase: Awaited<ReturnType<typeof utworzKlientaSupabaseSerwer>>,
  bookingId: string,
  userId: string
): Promise<WierszRezerwacjiZniszczenia | null> {
  const { data: b, error } = await supabase
    .from("hall_bookings")
    .select("id, hall_id, booked_by, status, damage_documentation_urls, halls!inner(village_id)")
    .eq("id", bookingId)
    .maybeSingle();

  if (error || !b || !["approved", "completed"].includes(b.status)) {
    return null;
  }

  const halls = b.halls as { village_id: string } | { village_id: string }[] | null;
  const wiesId = Array.isArray(halls) ? halls[0]?.village_id : halls?.village_id;
  if (!wiesId) return null;

  const jestWynajmujacym = b.booked_by === userId;
  let jestSoltysem = false;
  if (!jestWynajmujacym) {
    const villageIds = await pobierzVillageIdsRoliPaneluSoltysa(supabase, userId);
    jestSoltysem = villageIds.includes(wiesId);
  }

  if (!jestWynajmujacym && !jestSoltysem) {
    return null;
  }

  const urls = Array.isArray(b.damage_documentation_urls)
    ? (b.damage_documentation_urls as string[])
    : [];
  return { hall_id: b.hall_id, urls };
}

function prefixPublicznegoUrlaZniszczenSupabase(bookingId: string): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return null;
  return `${base}/storage/v1/object/public/hall_booking_damage/${bookingId}/`;
}

function czyUrlZdjeciaZniszczenDlaRezerwacji(publicUrl: string, bookingId: string): boolean {
  const parsed = schemaUrlZniszczenia.safeParse(publicUrl);
  if (!parsed.success) return false;
  const supa = prefixPublicznegoUrlaZniszczenSupabase(bookingId);
  if (supa && publicUrl.startsWith(supa)) return true;
  const r2 = wyciagnijBucketIKluczZUrlaR2(publicUrl);
  return r2?.bucket === R2_BUCKET_BOOKING_DAMAGE && r2.key.startsWith(`${bookingId}/`);
}

function sciezkaObiektuStorageZniszczenia(publicUrl: string, bookingId: string): string | null {
  const r2 = wyciagnijBucketIKluczZUrlaR2(publicUrl);
  if (r2?.bucket === R2_BUCKET_BOOKING_DAMAGE && r2.key.startsWith(`${bookingId}/`)) {
    return r2.key;
  }
  const marker = "/hall_booking_damage/";
  const i = publicUrl.indexOf(marker);
  if (i === -1) return null;
  const path = publicUrl.slice(i + marker.length);
  if (!path.startsWith(`${bookingId}/`)) return null;
  return path;
}

export async function dodajUrlDokumentacjiZniszczen(
  bookingId: string,
  publicUrl: string
): Promise<WynikProsty> {
  const id = uuid.safeParse(bookingId);
  if (!id.success || !czyUrlZdjeciaZniszczenDlaRezerwacji(publicUrl, id.data)) {
    return { blad: "Niepoprawny identyfikator rezerwacji lub adres zdjęcia." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const wiersz = await pobierzRezerwacjeDoDokumentacjiZniszczen(supabase, id.data, user.id);
  if (!wiersz) {
    return { blad: "Brak uprawnień lub rezerwacja nie pozwala na dokumentację." };
  }

  if (wiersz.urls.includes(publicUrl)) {
    return { ok: true };
  }
  if (wiersz.urls.length >= MAX_ZDJEC_DOKUMENTACJA_ZNISZCZEN) {
    return { blad: `Możesz dodać maksymalnie ${MAX_ZDJEC_DOKUMENTACJA_ZNISZCZEN} zdjęć.` };
  }

  const nowe = [...wiersz.urls, publicUrl];
  const { error } = await supabase
    .from("hall_bookings")
    .update({ damage_documentation_urls: nowe })
    .eq("id", id.data);

  if (error) {
    console.error("[dodajUrlDokumentacjiZniszczen]", error.message);
    return { blad: "Nie udało się zapisać zdjęcia w dokumentacji." };
  }

  const hid = wiersz.hall_id;
  revalidatePath(`/panel/mieszkaniec/swietlica/${hid}`);
  revalidatePath(`/panel/mieszkaniec/swietlica/${hid}/dokument`);
  revalidatePath(`/panel/soltys/swietlica/${hid}/dokument`);
  revalidatePath("/panel/soltys/rezerwacje");
  return { ok: true };
}

export async function usunUrlDokumentacjiZniszczen(
  bookingId: string,
  publicUrl: string
): Promise<WynikProsty> {
  const id = uuid.safeParse(bookingId);
  if (!id.success || !czyUrlZdjeciaZniszczenDlaRezerwacji(publicUrl, id.data)) {
    return { blad: "Niepoprawny identyfikator lub adres zdjęcia." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const wiersz = await pobierzRezerwacjeDoDokumentacjiZniszczen(supabase, id.data, user.id);
  if (!wiersz || !wiersz.urls.includes(publicUrl)) {
    return { blad: "Nie znaleziono zdjęcia na liście lub brak uprawnień." };
  }

  const nowe = wiersz.urls.filter((u) => u !== publicUrl);
  const { error } = await supabase
    .from("hall_bookings")
    .update({ damage_documentation_urls: nowe })
    .eq("id", id.data);

  if (error) {
    console.error("[usunUrlDokumentacjiZniszczen]", error.message);
    return { blad: "Nie udało się usunąć zdjęcia z listy." };
  }

  const r2 = wyciagnijBucketIKluczZUrlaR2(publicUrl);
  if (r2?.bucket === R2_BUCKET_BOOKING_DAMAGE) {
    const w = await usunObiektR2(r2.bucket, r2.key);
    if (!w.ok) console.warn("[usunUrlDokumentacjiZniszczen] R2:", w.blad);
  } else {
    const sciezka = sciezkaObiektuStorageZniszczenia(publicUrl, id.data);
    if (sciezka) {
      const { error: rmErr } = await supabase.storage.from("hall_booking_damage").remove([sciezka]);
      if (rmErr) {
        console.warn("[usunUrlDokumentacjiZniszczen] storage:", rmErr.message);
      }
    }
  }

  const hid = wiersz.hall_id;
  revalidatePath(`/panel/mieszkaniec/swietlica/${hid}`);
  revalidatePath(`/panel/mieszkaniec/swietlica/${hid}/dokument`);
  revalidatePath(`/panel/soltys/swietlica/${hid}/dokument`);
  revalidatePath("/panel/soltys/rezerwacje");
  return { ok: true };
}

const schemaOpisPoWydarzeniu = z.object({
  was_damaged: z.boolean(),
  completion_notes: z.string().trim().max(MAX_ZNAKOW_OPISU_PO_WYDARZENIU).nullable().optional(),
});

export async function zapiszOpisPoWydarzeniuSwietlica(
  bookingId: string,
  dane: z.infer<typeof schemaOpisPoWydarzeniu>
): Promise<WynikProsty> {
  const id = uuid.safeParse(bookingId);
  if (!id.success) {
    return { blad: "Niepoprawny identyfikator rezerwacji." };
  }
  const parsed = schemaOpisPoWydarzeniu.safeParse(dane);
  if (!parsed.success) {
    return { blad: `Sprawdź treść uwag (maks. ${MAX_ZNAKOW_OPISU_PO_WYDARZENIU} znaków).` };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const wiersz = await pobierzRezerwacjeDoDokumentacjiZniszczen(supabase, id.data, user.id);
  if (!wiersz) {
    return { blad: "Brak uprawnień lub rezerwacja nie pozwala na uzupełnienie opisu." };
  }

  const notatki =
    parsed.data.completion_notes != null && parsed.data.completion_notes.length > 0
      ? parsed.data.completion_notes
      : null;

  const { error } = await supabase
    .from("hall_bookings")
    .update({
      was_damaged: parsed.data.was_damaged,
      completion_notes: notatki,
    })
    .eq("id", id.data);

  if (error) {
    console.error("[zapiszOpisPoWydarzeniuSwietlica]", error.message);
    return { blad: "Nie udało się zapisać opisu." };
  }

  const hid = wiersz.hall_id;
  revalidatePath(`/panel/mieszkaniec/swietlica/${hid}`);
  revalidatePath(`/panel/mieszkaniec/swietlica/${hid}/dokument`);
  revalidatePath(`/panel/soltys/swietlica/${hid}/dokument`);
  revalidatePath("/panel/soltys/rezerwacje");
  return { ok: true };
}

