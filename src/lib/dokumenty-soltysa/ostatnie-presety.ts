const KLUCZ = "naszawies-dokumenty-ostatnie";
const MAX = 6;

export type OstatniPreset = {
  presetId: string;
  tytul: string;
  uzytyO: string;
};

export function wczytajOstatniePresety(): OstatniPreset[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(KLUCZ);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as OstatniPreset[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function zapiszOstatniPreset(entry: Omit<OstatniPreset, "uzytyO">): void {
  if (typeof localStorage === "undefined") return;
  try {
    const prev = wczytajOstatniePresety().filter((x) => x.presetId !== entry.presetId);
    const next: OstatniPreset[] = [{ ...entry, uzytyO: new Date().toISOString() }, ...prev].slice(0, MAX);
    localStorage.setItem(KLUCZ, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}
