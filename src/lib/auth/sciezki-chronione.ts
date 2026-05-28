/**
 * Ścieżki dostępne wyłącznie po zalogowaniu (middleware + spójne z nagłówkiem).
 */

const PREFIXY_STRON = [
  "/panel",
  "/mapa",
  "/szukaj",
  "/wybierz-wies",
  "/grafika",
  "/transport",
] as const;

/** API wies/mapa — wyjątek: rejestracja (server actions). */
export const PREFIXY_API_CHRONIONE = [
  "/api/wies/katalog",
  "/api/wies/szukaj",
  "/api/wies/mapa-znaczniki",
] as const;

export function sciezkaWymagaLogowania(pathname: string): boolean {
  if (PREFIXY_STRON.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }

  const czesci = pathname.split("/").filter(Boolean);
  if (czesci[0] === "wies") {
    const glebokosc = czesci.length - 1;
    if (glebokosc >= 1 && glebokosc <= 3) {
      return true;
    }
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
