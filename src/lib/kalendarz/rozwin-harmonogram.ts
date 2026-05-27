import type { WpisKalendarza } from "./typy-kalendarza";

type Slot = {
  id: string;
  village_id: string;
  day_of_week: number;
  time_start: string;
  time_end: string | null;
  title: string;
  description: string | null;
  nazwa_grupy?: string | null;
};

/** Rozwija tygodniowy harmonogram na konkretne dni w przedziale. */
export function rozwinHarmonogramTygodniowy(
  sloty: Slot[],
  nazwyWsi: Record<string, string>,
  od: Date,
  doDaty: Date,
): WpisKalendarza[] {
  const wynik: WpisKalendarza[] = [];
  const kursor = new Date(od);
  kursor.setHours(0, 0, 0, 0);
  const koniec = new Date(doDaty);
  koniec.setHours(23, 59, 59, 999);

  while (kursor <= koniec) {
    const dzienTygodnia = kursor.getDay();
    for (const s of sloty) {
      if (s.day_of_week !== dzienTygodnia) continue;
      const [hS, mS] = s.time_start.split(":").map(Number);
      const start = new Date(kursor);
      start.setHours(hS ?? 0, mS ?? 0, 0, 0);
      let end: Date | null = null;
      if (s.time_end) {
        const [hE, mE] = s.time_end.split(":").map(Number);
        end = new Date(kursor);
        end.setHours(hE ?? 0, mE ?? 0, 0, 0);
      }
      const tytul = s.nazwa_grupy ? `${s.title} · ${s.nazwa_grupy}` : s.title;
      wynik.push({
        id: `harmonogram-${s.id}-${start.toISOString().slice(0, 10)}`,
        rodzaj: "harmonogram",
        tytul,
        start: start.toISOString(),
        end: end?.toISOString() ?? null,
        calodniowe: false,
        wiesId: s.village_id,
        wiesNazwa: nazwyWsi[s.village_id] ?? "Wieś",
        opis: s.description,
        href: "/panel/soltys/spolecznosc",
      });
    }
    kursor.setDate(kursor.getDate() + 1);
  }
  return wynik;
}
