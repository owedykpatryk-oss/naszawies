const KLUCZ = "naszawies-grafika-ostatnie-szablony";
const MAX = 6;

export type OstatniSzablon = {
  szablonId: string;
  motywId: string;
  tytul: string;
  uzytyO: string;
};

export function wczytajOstatnieSzablony(): OstatniSzablon[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(KLUCZ);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as OstatniSzablon[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function zapiszOstatniSzablon(entry: Omit<OstatniSzablon, "uzytyO">): void {
  if (typeof localStorage === "undefined") return;
  try {
    const prev = wczytajOstatnieSzablony().filter((x) => x.szablonId !== entry.szablonId);
    const next: OstatniSzablon[] = [{ ...entry, uzytyO: new Date().toISOString() }, ...prev].slice(0, MAX);
    localStorage.setItem(KLUCZ, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}
