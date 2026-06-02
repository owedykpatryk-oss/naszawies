export type RodzajWpisuKalendarzaLowieckiego =
  | "obowiazek_ambony"
  | "polowanie_zbiorowe"
  | "zebranie_kola"
  | "szkolenie"
  | "patrol"
  | "inne";

export const RODZAJE_KALENDARZA_LOWIECKIEGO: RodzajWpisuKalendarzaLowieckiego[] = [
  "obowiazek_ambony",
  "polowanie_zbiorowe",
  "zebranie_kola",
  "szkolenie",
  "patrol",
  "inne",
];

export const ETYKIETA_RODZAJU_KALENDARZA: Record<RodzajWpisuKalendarzaLowieckiego, string> = {
  obowiazek_ambony: "Obsada ambony",
  polowanie_zbiorowe: "Polowanie zbiorowe",
  zebranie_kola: "Zebranie koła",
  szkolenie: "Szkolenie / odprawa",
  patrol: "Patrol / dzień w terenie",
  inne: "Inne",
};

export const KOLOR_RODZAJU_KALENDARZA: Record<RodzajWpisuKalendarzaLowieckiego, string> = {
  obowiazek_ambony: "bg-amber-100 text-amber-950 border-amber-400/70",
  polowanie_zbiorowe: "bg-red-100 text-red-950 border-red-400/70",
  zebranie_kola: "bg-emerald-100 text-emerald-950 border-emerald-400/70",
  szkolenie: "bg-sky-100 text-sky-950 border-sky-400/70",
  patrol: "bg-stone-100 text-stone-900 border-stone-400/70",
  inne: "bg-violet-50 text-violet-950 border-violet-300/60",
};

export type WpisKalendarzaLowieckiego = {
  id: string;
  villageId: string;
  wiesNazwa: string;
  entryKind: RodzajWpisuKalendarzaLowieckiego;
  title: string;
  startsAt: string;
  endsAt: string;
  poiId: string | null;
  standLabel: string | null;
  ambonaNazwa: string | null;
  hunterName: string | null;
  hunterPhone: string | null;
  notes: string | null;
  huntingNoticeId: string | null;
};

export function domyslnyTytulWpisu(
  kind: RodzajWpisuKalendarzaLowieckiego,
  ambonaNazwa?: string | null,
  hunterName?: string | null,
): string {
  if (kind === "obowiazek_ambony") {
    const st = ambonaNazwa?.trim() || "Ambona";
    const h = hunterName?.trim();
    return h ? `${st} — ${h}` : st;
  }
  return ETYKIETA_RODZAJU_KALENDARZA[kind];
}

export function zakresMiesiacaKalendarza(ym: string): { od: Date; doDaty: Date } {
  const [y, m] = ym.split("-").map(Number);
  const od = new Date(y!, m! - 1, 1, 0, 0, 0, 0);
  const doDaty = new Date(y!, m!, 0, 23, 59, 59, 999);
  return { od, doDaty };
}

export function miesiacZParam(miesiac?: string): string {
  const teraz = new Date();
  if (miesiac && /^\d{4}-\d{2}$/.test(miesiac)) return miesiac;
  return `${teraz.getFullYear()}-${String(teraz.getMonth() + 1).padStart(2, "0")}`;
}
