/** Dni tygodnia — zgodnie z JS Date (0 = niedziela). */
export const NAZWY_DNI: Record<number, string> = {
  0: "Niedziela",
  1: "Poniedziałek",
  2: "Wtorek",
  3: "Środa",
  4: "Czwartek",
  5: "Piątek",
  6: "Sobota",
};

export type RodzajOdpadow = "zmieszane" | "segregowane" | "gabaryty" | "pszok" | "bio" | "inne";

export const ETYKIETY_ODPADOW: Record<RodzajOdpadow, string> = {
  zmieszane: "Zmieszane",
  segregowane: "Segregowane",
  gabaryty: "Gabaryty",
  pszok: "PSZOK",
  bio: "Bio / ogród",
  inne: "Inne",
};

export type WpisHarmonogramuSmieci = {
  id: string;
  kind: RodzajOdpadow;
  day_of_week: number;
  time_hint: string | null;
  notes: string | null;
};

export function nastepnyWywoz(wpis: WpisHarmonogramuSmieci): Date | null {
  const teraz = new Date();
  const celDzien = wpis.day_of_week;
  for (let i = 0; i <= 7; i++) {
    const d = new Date(teraz);
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    if (d.getDay() === celDzien) return d;
  }
  return null;
}
