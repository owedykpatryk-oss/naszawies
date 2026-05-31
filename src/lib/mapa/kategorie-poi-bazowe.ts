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
] as const;

export type KategoriaPoiBazowa = (typeof KATEGORIE_POI_BAZOWE)[number];

/** Kategorie, które mieszkaniec może zaproponować sołtysowi. */
export const KATEGORIE_PROPONOWALNE_POI = [...KATEGORIE_POI_BAZOWE, "inne"] as const;
