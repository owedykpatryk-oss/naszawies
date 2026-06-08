export const RODZAJE_OSTRZEZENIA_LESNEGO = [
  "zakaz_wejscia",
  "wycinka",
  "prace_zmechanizowane",
  "niebezpieczne_drzewo",
  "pozar_lasu",
  "silny_wiatr",
  "burza",
  "zbieractwo",
  "droga_zamknieta",
  "inne",
] as const;

export type RodzajOstrzezeniaLesnego = (typeof RODZAJE_OSTRZEZENIA_LESNEGO)[number];

export const ETYKIETA_RODZAJU_OSTRZEZENIA: Record<RodzajOstrzezeniaLesnego, string> = {
  zakaz_wejscia: "Zakaz wstępu",
  wycinka: "Wycinka / prace leśne",
  prace_zmechanizowane: "Prace zmechanizowane w lesie",
  niebezpieczne_drzewo: "Niebezpieczne drzewo / gałęzie",
  pozar_lasu: "Pożar lub ryzyko pożaru",
  silny_wiatr: "Silny wiatr — nie wchodź do lasu",
  burza: "Burza — unikaj lasu",
  zbieractwo: "Ograniczenia zbieractwa",
  droga_zamknieta: "Droga leśna zamknięta",
  inne: "Inne ostrzeżenie",
};

export const IKONA_RODZAJU_OSTRZEZENIA: Record<RodzajOstrzezeniaLesnego, string> = {
  zakaz_wejscia: "🚫",
  wycinka: "🪓",
  prace_zmechanizowane: "🚜",
  niebezpieczne_drzewo: "🌳",
  pozar_lasu: "🔥",
  silny_wiatr: "💨",
  burza: "⛈️",
  zbieractwo: "🍄",
  droga_zamknieta: "🚧",
  inne: "⚠️",
};

export function czyRodzajOstrzezeniaLesnego(v: string): v is RodzajOstrzezeniaLesnego {
  return (RODZAJE_OSTRZEZENIA_LESNEGO as readonly string[]).includes(v);
}

export function etykietaRodzajuOstrzezenia(kind: string): string {
  return czyRodzajOstrzezeniaLesnego(kind) ? ETYKIETA_RODZAJU_OSTRZEZENIA[kind] : "Ostrzeżenie leśne";
}

export function ikonaRodzajuOstrzezenia(kind: string): string {
  return czyRodzajOstrzezeniaLesnego(kind) ? IKONA_RODZAJU_OSTRZEZENIA[kind] : "⚠️";
}
