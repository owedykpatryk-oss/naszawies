/** Zgodne z polem `issues.quick_flags` (jsonb) — tylko te klucze zapisujemy. */
export const SZYBKIE_OZNACZENIA = [
  { key: "bliskosc_szkoly", label: "W pobliżu szkoły / przedszkola / placu zabaw" },
  { key: "niebezpieczne", label: "Może stwarzać zagrożenie" },
  { key: "powtarzajace", label: "Problem występuje wielokrotnie" },
  { key: "noca", label: "Dotyczy sytuacji po zmroku" },
  { key: "utrudnia", label: "Utrudnia dojazd / przejazd" },
] as const;

export type KluczSzybkiegoOznaczenia = (typeof SZYBKIE_OZNACZENIA)[number]["key"];

export const kategorieZgloszen: { value: string; label: string }[] = [
  { value: "droga", label: "Droga / nawierzchnia" },
  { value: "oswietlenie", label: "Oświetlenie" },
  { value: "woda", label: "Woda / kanalizacja" },
  { value: "prad", label: "Energia / skrzynka" },
  { value: "smieci", label: "Śmieci / utylizacja" },
  { value: "infrastruktura", label: "Infrastruktura (mostek, znak…)" },
  { value: "inne", label: "Inne" },
];

export function etykietaStanuZgloszenia(s: string): string {
  const m: Record<string, string> = {
    nowe: "Nowe",
    w_trakcie: "W trakcie",
    rozwiazane: "Rozwiązane",
    odrzucone: "Odrzucone",
  };
  return m[s] ?? s;
}

export function etykietkiSzybkich(f: Record<string, unknown> | null | undefined): string[] {
  if (!f || typeof f !== "object") return [];
  return SZYBKIE_OZNACZENIA.filter((x) => f[x.key] === true).map((x) => x.label);
}
