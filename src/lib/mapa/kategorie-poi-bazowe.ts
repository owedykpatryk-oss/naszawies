/** Kategorie uzupełniane automatycznie z OSM — wspólna lista dla crona i oceny kompletności mapy. */
export const KATEGORIE_POI_BAZOWE = [
  "swietlica",
  "osp",
  "sklep",
  "apteka",
  "poczta",
  "przychodnia",
  "stacja_paliw",
  "kosciol",
  "szkola",
  "przedszkole",
  "biblioteka",
  "boisko",
  "urzad",
  "przystanek",
  "stacja_kolejowa",
  "cmentarz",
  "skup_zboz",
  "sklep_rolniczy",
  /** Hydranty i inne źródła wody OSP — wiele punktów na wieś (import z OSM). */
  "osp_punkt_czerpania_wody",
] as const;

/** Opcjonalne — import OSM / ręcznie sołtys, nie wpływają na % kompletności mapy. */
export const KATEGORIE_POI_OPCJONALNE = ["latarnia", "inwestycja"] as const;

/** Kategorie, dla których cron OSM może dodawać kolejne punkty (nie tylko pierwszy brak). */
export const KATEGORIE_POI_WIELOKROTNE = [
  "przystanek",
  "osp_punkt_czerpania_wody",
  "sklep",
  "boisko",
  "skup_zboz",
  "sklep_rolniczy",
  "latarnia",
  "inwestycja",
] as const;

export type KategoriaPoiBazowa = (typeof KATEGORIE_POI_BAZOWE)[number];

/** Kategorie, które mieszkaniec może zaproponować sołtysowi. */
export const KATEGORIE_PROPONOWALNE_POI = [
  ...KATEGORIE_POI_BAZOWE,
  ...KATEGORIE_POI_OPCJONALNE,
  "inne",
] as const;
