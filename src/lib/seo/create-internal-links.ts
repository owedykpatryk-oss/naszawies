/** Sugestie linków wewnętrznych dla topical authority naszawies.pl. */
export const LINKI_TOPIKALNE_PLATFORMY = [
  { href: "/szukaj", etykieta: "Szukaj wsi w Polsce", tematy: ["wies", "katalog", "miejscowosc", "gmina"] },
  { href: "/rynek", etykieta: "Rynek lokalny", tematy: ["rynek", "ogloszenia", "sprzedaz", "kupno"] },
  { href: "/o-nas", etykieta: "O naszawies.pl", tematy: ["platforma", "soltys", "misja"] },
  { href: "/pomoc", etykieta: "Centrum pomocy", tematy: ["pomoc", "faq", "panel"] },
  { href: "/rejestracja", etykieta: "Załóż konto", tematy: ["konto", "rejestracja", "dolacz"] },
  { href: "/kontakt", etykieta: "Kontakt", tematy: ["kontakt", "wsparcie"] },
] as const;

export type LinkWewnetrzny = { href: string; etykieta: string };

/** Dopasuj linki platformy do słów kluczowych artykułu (prosty heurystyczny matcher). */
export function createInternalLinks(
  slowaKluczowe: string[],
  istniejace: LinkWewnetrzny[] = [],
): LinkWewnetrzny[] {
  const zestaw = new Map<string, LinkWewnetrzny>();
  for (const l of istniejace) {
    if (l.href.startsWith("/") && !l.href.startsWith("//")) zestaw.set(l.href, l);
  }

  const tekst = slowaKluczowe.join(" ").toLowerCase();
  for (const kandydat of LINKI_TOPIKALNE_PLATFORMY) {
    if (zestaw.has(kandydat.href)) continue;
    const trafienie = kandydat.tematy.some((t) => tekst.includes(t));
    if (trafienie) zestaw.set(kandydat.href, { href: kandydat.href, etykieta: kandydat.etykieta });
  }

  return Array.from(zestaw.values()).slice(0, 6);
}
