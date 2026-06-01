/** Po ilu dniach od rejestracji pokazać pierwszą ankietę (smart prompt). */
export const DNI_DO_PIERWSZEJ_ANKIETY = 14;

/** „Przypomnij później” — ile dni ukryć baner. */
export const DNI_ODROCZENIA_PROMPTU = 7;

export const ETYKIETY_OCENY = [
  { wartosc: 1, emoji: "😞", opis: "Słabo" },
  { wartosc: 2, emoji: "😐", opis: "Tak sobie" },
  { wartosc: 3, emoji: "🙂", opis: "OK" },
  { wartosc: 4, emoji: "😊", opis: "Dobrze" },
  { wartosc: 5, emoji: "🤩", opis: "Świetnie" },
] as const;

/** Szybkie chipy — ułatwiają wypełnienie bez pisania od zera. */
export const CHIPY_CO_DZIALA = [
  "Łatwa obsługa panelu",
  "Profil wsi / treści",
  "Mapa i miejsca",
  "Rezerwacja świetlicy",
  "Powiadomienia",
  "Szybkość działania",
  "Wygląd strony",
] as const;

export const CHIPY_CO_ULEPSZYC = [
  "Trudna nawigacja",
  "Brakuje funkcji",
  "Wolne ładowanie",
  "Mobilka / telefon",
  "Opisy / pomoc",
  "Błędy / coś nie działa",
  "Więcej poradników",
] as const;

export type RodzajAnkiety = "onboarding_14d" | "voluntary" | "prompt";
