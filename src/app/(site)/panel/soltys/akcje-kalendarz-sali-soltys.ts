"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { czyUzytkownikJestSoltysemDlaSali } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzUzytkownikaDoAkcji } from "@/lib/auth/pobierz-uzytkownika-serwer";

const uuid = z.string().uuid();

export type WynikKalendarzSali = { ok: true; id?: string } | { blad: string };

const schemaBlokada = z.object({
  hallId: z.string().uuid(),
  startAt: z.string().datetime({ offset: true }),
  endAt: z.string().datetime({ offset: true }),
  opis: z.string().trim().max(200).optional().nullable(),
});

/** Sołtys dodaje zajęty termin w kalendarzu sali (od razu approved). */
export async function dodajZajetoscKalendarzaSaliSoltysa(
  dane: z.infer<typeof schemaBlokada>,
): Promise<WynikKalendarzSali> {
  const p = schemaBlokada.safeParse(dane);
  if (!p.success) return { blad: "Podaj poprawny zakres dat i godzin." };

  const start = new Date(p.data.startAt);
  const end = new Date(p.data.endAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return { blad: "Godzina zakończenia musi być późniejsza niż rozpoczęcia." };
  }

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się." };

  const moze = await czyUzytkownikJestSoltysemDlaSali(supabase, user.id, p.data.hallId);
  if (!moze) return { blad: "Brak uprawnień do tej sali." };

  const { data: maKolizje, error: kE } = await supabase.rpc("hall_ma_kolizje_terminu", {
    p_hall_id: p.data.hallId,
    p_start: start.toISOString(),
    p_end: end.toISOString(),
  });
  if (kE) return { blad: "Nie udało się sprawdzić kolizji terminów." };
  if (maKolizje === true) return { blad: "Ten przedział nachodzi na istniejące zajęcie sali." };

  const teraz = new Date().toISOString();
  const { data: wstaw, error } = await supabase
    .from("hall_bookings")
    .insert({
      hall_id: p.data.hallId,
      booked_by: user.id,
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      event_type: "zajete",
      event_title: p.data.opis?.length ? p.data.opis : "Zajęte (sołtys)",
      expected_guests: 1,
      has_alcohol: false,
      status: "approved",
      approved_by: user.id,
      approved_at: teraz,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[dodajZajetoscKalendarzaSaliSoltysa]", error.message);
    return { blad: "Nie udało się dodać terminu." };
  }

  revalidatePath(`/panel/soltys/swietlica/${p.data.hallId}`);
  revalidatePath("/panel/soltys/rezerwacje");
  revalidatePath("/mapa");
  return { ok: true, id: wstaw?.id };
}

export async function usunZajetoscKalendarzaSaliSoltysa(
  bookingId: string,
  hallId: string,
): Promise<WynikKalendarzSali> {
  const id = uuid.safeParse(bookingId);
  const hId = uuid.safeParse(hallId);
  if (!id.success || !hId.success) return { blad: "Niepoprawny identyfikator." };

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się." };

  const moze = await czyUzytkownikJestSoltysemDlaSali(supabase, user.id, hId.data);
  if (!moze) return { blad: "Brak uprawnień." };

  const { data: b } = await supabase
    .from("hall_bookings")
    .select("id, hall_id, status")
    .eq("id", id.data)
    .eq("hall_id", hId.data)
    .maybeSingle();
  if (!b) return { blad: "Nie znaleziono wpisu." };
  if (b.status !== "approved") {
    return { blad: "Usunąć można tylko potwierdzone wpisy kalendarza (zatwierdzone rezerwacje rozpatrz w Rezerwacjach)." };
  }

  const { error } = await supabase.from("hall_bookings").delete().eq("id", id.data);
  if (error) {
    console.error("[usunZajetoscKalendarzaSaliSoltysa]", error.message);
    return { blad: "Nie udało się usunąć terminu." };
  }

  revalidatePath(`/panel/soltys/swietlica/${hId.data}`);
  revalidatePath("/mapa");
  return { ok: true };
}
