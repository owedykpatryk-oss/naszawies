/**
 * Kategorie punktów POI na mapie (kolumna `pois.category` w bazie).
 * Sołtys dodaje wpisy; mapa katalogu (po zalogowaniu) pokazuje wszystkie z `pois` dla aktywnych wsi.
 */
export const KATEGORIA_LATARNIA = "latarnia";

export const ETYKIETA_KATEGORII_POI: Record<string, string> = {
  kosciol: "Kościół",
  szkola: "Szkoła",
  przedszkole: "Przedszkole",
  swietlica: "Świetlica",
  soltys: "Sołtys / kontakt sołecki",
  biuro_solec: "Biuro sołeckie",
  sklep: "Sklep",
  apteka: "Apteka",
  poczta: "Poczta",
  przychodnia: "Przychodnia / POZ",
  stacja_paliw: "Stacja paliw",
  stacja_kolejowa: "Stacja kolejowa",
  przystanek: "Przystanek",
  cmentarz: "Cmentarz",
  osp: "OSP / straż",
  osp_punkt_czerpania_wody: "Punkt czerpania wody OSP",
  boisko: "Boisko, sport",
  biblioteka: "Biblioteka, filia",
  urzad: "Urząd, instytucja",
  ladne_miejsce: "Ładne miejsce (zdjęcie)",
  nazwa_geo: "Nazwa geograficzna (PRNG)",
  skup_zboz: "Skup / elewator zbożowy",
  sklep_rolniczy: "Sklep rolniczy",
  sprzedaz_z_gospodarstwa: "Sprzedaż z gospodarstwa",
  spoldzielnia_rolna: "Spółdzielnia rolnicza",
  latarnia: "Latarnia / oświetlenie drogi",
  inwestycja: "Inwestycja / planowana budowa",
  siedziba_kola: "Siedziba koła łowieckiego",
  zebrania_kola: "Miejsce zebrań koła łowieckiego",
  teren_lowiecki: "Teren łowiecki (obszar orientacyjny)",
  obszar_lowowy: "Obszar łowowy (strefa)",
  ambona: "Ambona (strefa / członkowie wsi)",
  posterunek_lowiecki: "Posterunek łowiecki (strefa / członkowie wsi)",
  inne: "Miejsce",
  historia_wydarzenie: "Historia wsi (wydarzenie)",
};

const EMOJI_KATEGORII: Record<string, string> = {
  kosciol: "⛪",
  szkola: "🏫",
  przedszkole: "🧒",
  swietlica: "🏛",
  soltys: "📬",
  biuro_solec: "🏠",
  sklep: "🛒",
  apteka: "💊",
  poczta: "📮",
  przychodnia: "🏥",
  stacja_paliw: "⛽",
  stacja_kolejowa: "🚉",
  przystanek: "🚌",
  cmentarz: "🕯",
  osp: "🚒",
  osp_punkt_czerpania_wody: "💧",
  boisko: "⚽",
  biblioteka: "📚",
  urzad: "🏢",
  nazwa_geo: "🏞",
  skup_zboz: "🌾",
  sklep_rolniczy: "🧑‍🌾",
  sprzedaz_z_gospodarstwa: "🚜",
  spoldzielnia_rolna: "🏭",
  latarnia: "💡",
  inwestycja: "🏗",
  siedziba_kola: "🦌",
  zebrania_kola: "🏕",
  teren_lowiecki: "🌲",
  obszar_lowowy: "📍",
  ambona: "🎯",
  posterunek_lowiecki: "⛺",
  inne: "📍",
  historia_wydarzenie: "📜",
};

const KOLOR_OBRAMOWANIA: Record<string, string> = {
  kosciol: "#5c4d7a",
  szkola: "#2563eb",
  przedszkole: "#db2777",
  swietlica: "#15803d",
  soltys: "#a16207",
  biuro_solec: "#a16207",
  sklep: "#c2410c",
  apteka: "#059669",
  poczta: "#ca8a04",
  przychodnia: "#dc2626",
  stacja_paliw: "#64748b",
  stacja_kolejowa: "#1d4ed8",
  przystanek: "#0284c7",
  cmentarz: "#44403c",
  osp: "#b91c1c",
  osp_punkt_czerpania_wody: "#1d4ed8",
  boisko: "#0d9488",
  biblioteka: "#7c3aed",
  urzad: "#475569",
  ladne_miejsce: "#b45309",
  nazwa_geo: "#0d9488",
  skup_zboz: "#ca8a04",
  sklep_rolniczy: "#65a30d",
  sprzedaz_z_gospodarstwa: "#16a34a",
  spoldzielnia_rolna: "#854d0e",
  latarnia: "#ca8a04",
  inwestycja: "#ea580c",
  siedziba_kola: "#7c2d12",
  zebrania_kola: "#92400e",
  teren_lowiecki: "#166534",
  obszar_lowowy: "#15803d",
  ambona: "#9a3412",
  posterunek_lowiecki: "#b45309",
  inne: "#57534e",
};

export { KATEGORIE_POI_LOWIECKIE_MAPA as KATEGORIE_POI_LOWIECKIE } from "@/lib/mapa/poi-lowieckie-widocznosc";

export const KATEGORIA_LADNE_MIEJSCE = "ladne_miejsce";

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
