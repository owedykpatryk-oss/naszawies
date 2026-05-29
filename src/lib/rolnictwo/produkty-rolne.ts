export type ProduktRolny = {
  key: string;
  label: string;
  jednostka: string;
  /** Fraza do wyszukania zmiennej w API GUS BDL */
  frazaGus: string;
};

export const PRODUKTY_ROLNE: ProduktRolny[] = [
  { key: "pszenica", label: "Pszenica", jednostka: "zł/dt", frazaGus: "pszenica" },
  { key: "zyto", label: "Żyto", jednostka: "zł/dt", frazaGus: "żyto" },
  { key: "kukurydza", label: "Kukurydza", jednostka: "zł/dt", frazaGus: "kukurydza" },
  { key: "ziemniaki", label: "Ziemniaki", jednostka: "zł/dt", frazaGus: "ziemniaki" },
  { key: "mleko", label: "Mleko", jednostka: "zł/hl", frazaGus: "mleko" },
  { key: "wolowina", label: "Wołowina", jednostka: "zł/kg", frazaGus: "wołowina" },
  { key: "wieprzowina", label: "Wieprzowina", jednostka: "zł/kg", frazaGus: "wieprzowina" },
  { key: "drob", label: "Drób", jednostka: "zł/kg", frazaGus: "drób" },
];

export const MIN_POTWIERDZEN_SPOLECZNYCH = 3;

export function etykietaProduktuRolnego(key: string): string {
  return PRODUKTY_ROLNE.find((p) => p.key === key)?.label ?? key;
}

export function jednostkaProduktuRolnego(key: string): string {
  return PRODUKTY_ROLNE.find((p) => p.key === key)?.jednostka ?? "";
}
