export function sciezkaPomijaAkceptacjePrawnej(pathname: string): boolean {
  if (pathname === "/panel/akceptacja-regulaminu" || pathname.startsWith("/panel/akceptacja-regulaminu/")) {
    return true;
  }
  if (pathname === "/wyloguj") return true;
  return false;
}

export function sciezkaWymagaAkceptacjiPrawnej(pathname: string): boolean {
  if (sciezkaPomijaAkceptacjePrawnej(pathname)) return false;
  if (pathname === "/panel" || pathname.startsWith("/panel/")) return true;
  if (pathname === "/mapa" || pathname.startsWith("/mapa/")) return true;
  return false;
}
