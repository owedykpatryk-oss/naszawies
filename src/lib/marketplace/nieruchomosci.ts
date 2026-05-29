/** Kategorie rynku: działki, domy, grunty. */
export const WARTOSCI_NIERUCHOMOSCI = new Set([
  "dzialka_budowlana",
  "dzialka_rolna",
  "dzialka_rekreacyjna",
  "dom_mieszkalny",
  "budynek_gospodarczy",
  "grunt_dzierzawa",
]);

export const MAX_ZDJEC_RYNEK_STANDARD = 3;
export const MAX_ZDJEC_RYNEK_NIERUCHOMOSCI = 5;

export function czyKategoriaNieruchomosci(k: string | null | undefined): boolean {
  return !!k && WARTOSCI_NIERUCHOMOSCI.has(k);
}

export function limitZdjecRynek(k: string | null | undefined): number {
  return czyKategoriaNieruchomosci(k) ? MAX_ZDJEC_RYNEK_NIERUCHOMOSCI : MAX_ZDJEC_RYNEK_STANDARD;
}

export function formatujPowierzchnieDzialki(m2: number | null | undefined): string | null {
  if (m2 == null || !Number.isFinite(m2) || m2 <= 0) return null;
  if (m2 >= 10_000) {
    const ha = m2 / 10_000;
    return `${ha.toLocaleString("pl-PL", { maximumFractionDigits: 2 })} ha (${Math.round(m2).toLocaleString("pl-PL")} m²)`;
  }
  return `${Math.round(m2).toLocaleString("pl-PL")} m²`;
}

export function formatujAreDzialki(m2: number | null | undefined): string | null {
  if (m2 == null || !Number.isFinite(m2) || m2 <= 0) return null;
  const ar = m2 / 100;
  return `${ar.toLocaleString("pl-PL", { maximumFractionDigits: 2 })} ar`;
}
