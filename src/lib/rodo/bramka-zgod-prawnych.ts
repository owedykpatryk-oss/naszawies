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
  if (pathname === "/transport" || pathname.startsWith("/transport/")) return true;
  if (pathname === "/grafika" || pathname.startsWith("/grafika/")) return true;
  if (pathname === "/wybierz-wies" || pathname.startsWith("/wybierz-wies/")) return true;
  return false;
}
