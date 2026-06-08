/**
 * Ścieżki dostępne wyłącznie po zalogowaniu (middleware + spójne z nagłówkiem i OPIS §10).
 */

const PREFIXY_STRON = [
  "/panel",
  "/mapa",
  "/wybierz-wies",
  "/grafika",
  "/transport",
] as const;

/** Karta miejsca POI — publiczna (bez logowania i Turnstile). */
const PREFIXY_MAPY_PUBLICZNE = ["/mapa/miejsce"] as const;

/** Rozkład PKP po nazwie stacji — publiczny podgląd (bez pełnego hubu transportu). */
const PREFIXY_TRANSPORTU_PUBLICZNE = ["/transport/rozklad"] as const;

export function czyStronaMiejscePoiPubliczna(pathname: string): boolean {
  return PREFIXY_MAPY_PUBLICZNE.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function czyStronaTransportuPubliczna(pathname: string): boolean {
  return PREFIXY_TRANSPORTU_PUBLICZNE.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Strony tylko do odczytu — bez logowania, onboardingu ani akceptacji RODO. */
export function czyStronaModuluPubliczna(pathname: string): boolean {
  return czyStronaMiejscePoiPubliczna(pathname) || czyStronaTransportuPubliczna(pathname);
}

/** API wies/mapa — wyjątek: rejestracja (server actions). */
export const PREFIXY_API_CHRONIONE = [
  "/api/wies/katalog",
  "/api/wies/mapa-znaczniki",
] as const;

export function sciezkaWymagaLogowania(pathname: string): boolean {
  if (czyStronaModuluPubliczna(pathname)) {
    return false;
  }
  if (PREFIXY_STRON.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }

  return false;
}

export function sciezkaApiWymagaLogowania(pathname: string): boolean {
  return PREFIXY_API_CHRONIONE.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function urlLogowaniaZPowrotem(sciezka: string, search = ""): string {
  const next = `${sciezka}${search}`;
  return `/logowanie?next=${encodeURIComponent(next)}`;
}

/** Link bezpośredni dla zalogowanych; gość → logowanie z powrotem na docelową ścieżkę. */
export function linkChroniony(sciezka: string, zalogowany: boolean, search = ""): string {
  return zalogowany ? `${sciezka}${search}` : urlLogowaniaZPowrotem(sciezka, search);
}
