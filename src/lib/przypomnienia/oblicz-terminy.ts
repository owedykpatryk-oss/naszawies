export type RegulaDoObliczenia = {
  recurrence: "weekly" | "monthly" | "yearly";
  day_of_week: number | null;
  day_of_month: number | null;
  month: number | null;
  days_before: number;
};

function naPoczatekDnia(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function formatujDateIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function tenSamDzien(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Data wydarzenia (terminu), o którym przypominamy. */
export function dataWydarzeniaDlaReguly(regula: RegulaDoObliczenia, odniesienie: Date): Date | null {
  const ref = naPoczatekDnia(odniesienie);

  if (regula.recurrence === "weekly" && regula.day_of_week != null) {
    const dow = ref.getDay();
    const delta = (regula.day_of_week - dow + 7) % 7;
    const event = new Date(ref);
    event.setDate(event.getDate() + delta);
    return event;
  }

  if (regula.recurrence === "monthly" && regula.day_of_month != null) {
    const ostatniDzien = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
    const dzien = Math.min(regula.day_of_month, ostatniDzien);
    let event = new Date(ref.getFullYear(), ref.getMonth(), dzien);
    if (event < ref) {
      const nextMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 1);
      const ostatniNext = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
      event = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), Math.min(regula.day_of_month, ostatniNext));
    }
    return event;
  }

  if (regula.recurrence === "yearly" && regula.month != null && regula.day_of_month != null) {
    const miesiac = regula.month - 1;
    const ostatni = new Date(ref.getFullYear(), miesiac + 1, 0).getDate();
    const dzien = Math.min(regula.day_of_month, ostatni);
    let event = new Date(ref.getFullYear(), miesiac, dzien);
    if (event < ref) {
      const ostatniNext = new Date(ref.getFullYear() + 1, miesiac + 1, 0).getDate();
      event = new Date(ref.getFullYear() + 1, miesiac, Math.min(regula.day_of_month, ostatniNext));
    }
    return event;
  }

  return null;
}

/** Czy dziś wysłać przypomnienie (dzień notify = event - days_before). */
export function czyDzisWyslacPrzypomnienie(regula: RegulaDoObliczenia, dzis = new Date()): {
  wyslij: boolean;
  fire_on: string | null;
} {
  const event = dataWydarzeniaDlaReguly(regula, dzis);
  if (!event) return { wyslij: false, fire_on: null };

  const notify = new Date(event);
  notify.setDate(notify.getDate() - regula.days_before);
  const dzisNorm = naPoczatekDnia(dzis);

  if (!tenSamDzien(dzisNorm, naPoczatekDnia(notify))) {
    return { wyslij: false, fire_on: null };
  }

  return { wyslij: true, fire_on: formatujDateIso(event) };
}

/** Najbliższe wydarzenie w ciągu ~400 dni (podgląd w panelu). */
export function najblizszeWydarzenie(regula: RegulaDoObliczenia, od: Date = new Date()): Date | null {
  return dataWydarzeniaDlaReguly(regula, od);
}
