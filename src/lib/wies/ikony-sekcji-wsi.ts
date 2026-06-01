import type { KluczSekcjiWsi } from "@/lib/wies/ustawienia-wsi";

/** Domyślne emoji zakładek profilu wsi. */
export const DOMYSLNE_IKONY_SEKCJI_WSI: Record<KluczSekcjiWsi, string> = {
  informacje: "ℹ️",
  rynek: "🛒",
  mapa: "🗺️",
  aktualnosci: "📢",
  pomoc: "🤝",
  blog: "📖",
  historia: "📜",
  sport: "⚽",
  organizacje: "🏛️",
  szkola: "🏫",
  dotacje: "💰",
  transport: "🚌",
  rolnictwo: "🌾",
  swietlica: "🏠",
  cmentarz: "🕯️",
  fotokronika: "📷",
  grafika: "🎨",
};

/** Paleta do wyboru w panelu sołtysa. */
export const PALETA_IKON_ZAKLADEK = [
  "ℹ️",
  "🛒",
  "🗺️",
  "📢",
  "🤝",
  "📖",
  "⚽",
  "🏛️",
  "💰",
  "🚌",
  "🌾",
  "🏠",
  "🕯️",
  "📷",
  "🎨",
  "⛪",
  "🚒",
  "👋",
  "📍",
  "🔔",
  "⭐",
  "📅",
  "🛠️",
  "🌳",
  "☎️",
] as const;

export function ikonaSekcjiWsi(klucz: KluczSekcjiWsi, nadpisanie?: string | null): string {
  const e = nadpisanie?.trim();
  if (e) return e;
  return DOMYSLNE_IKONY_SEKCJI_WSI[klucz];
}
