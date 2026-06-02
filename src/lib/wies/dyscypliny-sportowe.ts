/** Presety dyscyplin klubu sportowego — wybór w panelu sołtysa. */
export const PRESETY_DYSCYPLIN_SPORTOWYCH = [
  { kod: "pilka_nozna", etykieta: "Piłka nożna" },
  { kod: "koszykowka", etykieta: "Koszykówka" },
  { kod: "siatkowka", etykieta: "Siatkówka" },
  { kod: "tenis", etykieta: "Tenis / tenis stołowy" },
  { kod: "bieg", etykieta: "Bieganie" },
  { kod: "nordic_walking", etykieta: "Nordic walking" },
  { kod: "rower", etykieta: "Kolarstwo / rower" },
  { kod: "turystyka", etykieta: "Turystyka / wędrówki" },
  { kod: "fitness", etykieta: "Fitness / aerobik" },
  { kod: "inne", etykieta: "Inna dyscyplina" },
] as const;

export type KodPresetuDyscypliny = (typeof PRESETY_DYSCYPLIN_SPORTOWYCH)[number]["kod"];

export function etykietaPresetuDyscypliny(kod: string): string | null {
  const p = PRESETY_DYSCYPLIN_SPORTOWYCH.find((x) => x.kod === kod);
  return p?.etykieta ?? null;
}

export function dyscyplinaZPresetu(kod: string, wlasna: string): string {
  if (kod === "inne") return wlasna.trim();
  return etykietaPresetuDyscypliny(kod) ?? wlasna.trim();
}
