/** Wspólna wersja pakietu prawnego — zmiana wymusza ponowną akceptację w panelu. */
export const AKTUALNY_BUNDLE_WERSJI_PRAWNYCH = "2026-06-01";

export const WERSJA_REGULAMINU = AKTUALNY_BUNDLE_WERSJI_PRAWNYCH;
export const WERSJA_POLITYKI_PRYWATNOSCI = AKTUALNY_BUNDLE_WERSJI_PRAWNYCH;
export const WERSJA_BANERU_COOKIES = "cookies-v1";

export type RodzajZgody =
  | "regulamin"
  | "polityka_prywatnosci"
  | "wiek_16"
  | "cookies_info"
  | "marketing";

export type ZrodloZgody = "rejestracja" | "oauth_akceptacja" | "banner_cookies" | "profil" | "admin";
