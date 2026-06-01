/** Strony z własnym układem — bez globalnego nagłówka witryny. */
export function czyStronaBezNaglowkaWitryny(pathname: string): boolean {
  return (
    pathname.startsWith("/panel") ||
    pathname.startsWith("/logowanie") ||
    pathname.startsWith("/rejestracja") ||
    pathname.startsWith("/reset-hasla") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/embed/")
  );
}
