import type { WpisIcs } from "@/lib/kalendarz/utworz-plik-ics";
import { nazwaDniaTygodnia } from "@/lib/wies/teksty-dotacji";

type SlotTygodniowy = {
  id: string;
  day_of_week: number;
  time_start: string;
  time_end: string | null;
  title: string;
  description: string | null;
  nazwa_grupy: string | null;
};

function parseGodzina(hhmm: string): { h: number; m: number } {
  const [h, m] = hhmm.split(":").map(Number);
  return { h: h || 0, m: m || 0 };
}

function ustawDateNaDzienTygodnia(d: Date, dayOfWeek: number): Date {
  const out = new Date(d);
  const current = out.getDay();
  let diff = dayOfWeek - current;
  if (diff < 0) diff += 7;
  out.setDate(out.getDate() + diff);
  return out;
}

/** Najbliższe wystąpienia stałych slotów tygodniowych (np. treningi) — do iCal. */
export function wpisyIcsZeSlotowTygodniowych(
  sloty: SlotTygodniowy[],
  opts: { tygodnie?: number; urlBazy?: string; sciezkaProfilu?: string } = {},
): WpisIcs[] {
  const tygodnie = opts.tygodnie ?? 8;
  const teraz = new Date();
  teraz.setHours(0, 0, 0, 0);
  const wpisy: WpisIcs[] = [];

  for (const slot of sloty) {
    const startH = parseGodzina(slot.time_start);
    const endH = slot.time_end ? parseGodzina(slot.time_end) : null;

    for (let t = 0; t < tygodnie; t++) {
      const baza = new Date(teraz);
      baza.setDate(baza.getDate() + t * 7);
      const dzien = ustawDateNaDzienTygodnia(baza, slot.day_of_week);
      dzien.setHours(startH.h, startH.m, 0, 0);

      if (dzien.getTime() < Date.now() - 60 * 60 * 1000) continue;

      const koniec = new Date(dzien);
      if (endH) {
        koniec.setHours(endH.h, endH.m, 0, 0);
      } else {
        koniec.setTime(dzien.getTime() + 90 * 60 * 1000);
      }

      const tytul = slot.nazwa_grupy ? `${slot.title} · ${slot.nazwa_grupy}` : slot.title;
      const opis = [
        `Stały termin: ${nazwaDniaTygodnia(slot.day_of_week)}`,
        slot.description,
      ]
        .filter(Boolean)
        .join("\n");

      wpisy.push({
        uid: `sport-slot-${slot.id}-${dzien.toISOString().slice(0, 10)}`,
        title: tytul,
        description: opis,
        location: null,
        startAt: dzien,
        endAt: koniec,
        url: opts.urlBazy && opts.sciezkaProfilu ? `${opts.urlBazy}${opts.sciezkaProfilu}/sport` : null,
      });
    }
  }

  return wpisy.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
}
