/** Wspólne klasy pigułek nawigacji panelu. */
export function klasaPillNawigacji(aktywny: boolean, highlight?: boolean, shrink = false): string {
  const shrinkCls = shrink ? " shrink-0" : "";
  if (aktywny) {
    return `nawigacja-pill inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-green-800 to-green-900 px-2.5 py-2 text-xs font-medium text-white shadow-sm ring-1 ring-green-950/15 sm:px-3 sm:text-sm${shrinkCls}`;
  }
  if (highlight) {
    return `nawigacja-pill inline-flex items-center gap-1.5 rounded-xl bg-white/95 px-2.5 py-2 text-xs font-medium text-green-900 ring-1 ring-emerald-600/25 hover:bg-white hover:shadow-sm sm:px-3 sm:text-sm${shrinkCls}`;
  }
  return `nawigacja-pill inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs text-stone-700 hover:bg-white/90 hover:text-green-950 hover:shadow-sm sm:px-3 sm:text-sm${shrinkCls}`;
}

export function czyAktywnyHrefPanelu(href: string, pathname: string, search = ""): boolean {
  const qIndex = href.indexOf("?");
  const path = qIndex >= 0 ? href.slice(0, qIndex) : href;
  const query = qIndex >= 0 ? href.slice(qIndex + 1) : "";

  if (path === "/panel" && !query) return pathname === "/panel";
  if (path === "/panel/mieszkaniec" && !query) return pathname === "/panel/mieszkaniec";
  if (path === "/panel/moje" && !query) return pathname === "/panel/moje";
  if (path === "/panel/soltys" && !query) return pathname === "/panel/soltys";

  const pathMatches = pathname === path || pathname.startsWith(`${path}/`);
  if (!pathMatches) return false;

  if (!query) {
    if (path === "/panel/soltys/spolecznosc") return !new URLSearchParams(search).get("tryb");
    return true;
  }

  const expected = new URLSearchParams(query);
  const actual = new URLSearchParams(search);
  for (const [k, v] of Array.from(expected.entries())) {
    if (actual.get(k) !== v) return false;
  }
  return true;
}

export function czyAktywnyLinkGlownyPanelu(href: string, pathname: string): boolean {
  if (href === "/panel") return pathname === "/panel";
  if (href === "/panel/mieszkaniec") {
    return pathname === "/panel/mieszkaniec" || pathname.startsWith("/panel/mieszkaniec/");
  }
  if (href === "/panel/moje") {
    return pathname === "/panel/moje" || pathname.startsWith("/panel/moje/");
  }
  if (href === "/panel/soltys") {
    return pathname === "/panel/soltys" || pathname.startsWith("/panel/soltys/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
