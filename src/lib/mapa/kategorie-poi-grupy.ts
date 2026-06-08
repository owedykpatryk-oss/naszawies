/** Kategorie wspólne filtrów mapy i importu OSM. */

export const KATEGORIE_POI_TRANSPORT = ["przystanek", "stacja_kolejowa"] as const;

export const KATEGORIE_POI_DROGA_NOCLEG = [
  "miejsce_odpoczynku",
  "zajazd",
  "gastronomia",
  "stacja_paliw",
  "camping",
  "parking_publiczny",
] as const;

export const KATEGORIE_POI_RATUNEK_WODA = ["osp_punkt_czerpania_wody", "defibrylator"] as const;

export const KATEGORIE_POI_USLUGI = [
  "paczkomat",
  "bank",
  "bankomat",
  "drogeria",
  "weterynarz",
  "warsztat",
  "piekarnia",
  "ladowarka_ev",
  "toaleta_publiczna",
  "targowisko",
] as const;

export function nalezyDoGrupyPoi(kategoria: string, grupa: readonly string[]): boolean {
  return grupa.includes(kategoria.trim().toLowerCase());
}
