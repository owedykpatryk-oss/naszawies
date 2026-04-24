/**
 * Kategorie punktów POI na mapie (kolumna `pois.category` w bazie).
 * Sołtys dodaje wpisy; mapa publiczna pokazuje wszystkie z `pois` dla aktywnych wsi.
 */
export const ETYKIETA_KATEGORII_POI: Record<string, string> = {
  kosciol: "Kościół",
  szkola: "Szkoła",
  przedszkole: "Przedszkole",
  swietlica: "Świetlica",
  soltys: "Sołtys / kontakt sołecki",
  biuro_solec: "Biuro sołeckie",
  sklep: "Sklep",
  cmentarz: "Cmentarz",
  osp: "OSP / straż",
  boisko: "Boisko, sport",
  biblioteka: "Biblioteka, filia",
  urzad: "Urząd, instytucja",
  inne: "Miejsce",
};

const EMOJI_KATEGORII: Record<string, string> = {
  kosciol: "⛪",
  szkola: "🏫",
  przedszkole: "🧒",
  swietlica: "🏛",
  soltys: "📬",
  biuro_solec: "🏠",
  sklep: "🛒",
  cmentarz: "🕯",
  osp: "🚒",
  boisko: "⚽",
  biblioteka: "📚",
  urzad: "🏢",
  inne: "📍",
};

const KOLOR_OBRAMOWANIA: Record<string, string> = {
  kosciol: "#5c4d7a",
  szkola: "#2563eb",
  przedszkole: "#db2777",
  swietlica: "#15803d",
  soltys: "#a16207",
  biuro_solec: "#a16207",
  sklep: "#c2410c",
  cmentarz: "#44403c",
  osp: "#b91c1c",
  boisko: "#0d9488",
  biblioteka: "#7c3aed",
  urzad: "#475569",
  inne: "#57534e",
};

export function etykietaKategoriiPoi(kategoria: string): string {
  const k = kategoria.trim().toLowerCase();
  return ETYKIETA_KATEGORII_POI[k] ?? (kategoria.trim() || "Miejsce");
}

export function emojiKategoriiPoi(kategoria: string): string {
  const k = kategoria.trim().toLowerCase();
  return EMOJI_KATEGORII[k] ?? "📍";
}

export function kolorObramowaniaPoi(kategoria: string): string {
  const k = kategoria.trim().toLowerCase();
  return KOLOR_OBRAMOWANIA[k] ?? "#57534e";
}
