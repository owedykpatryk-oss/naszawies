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

/** API wies/mapa — wyjątek: rejestracja (server actions). */
export const PREFIXY_API_CHRONIONE = [
  "/api/wies/katalog",
  "/api/wies/mapa-znaczniki",
] as const;

export function sciezkaWymagaLogowania(pathname: string): boolean {
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
