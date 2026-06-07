/** Szacowany czas czytania w minutach (język polski ~180 słów/min). */
export function szacujCzasCzytania(tekst: string): number {
  const slowa = tekst
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;
  return Math.max(1, Math.round(slowa / 180));
}
