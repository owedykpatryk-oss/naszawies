/** Krótka etykieta social proof dla licznika odsłon ogłoszenia. */
export function formatujLiczbeWyswietlen(n: number): string | null {
  if (!Number.isFinite(n) || n < 1) return null;
  if (n === 1) return "1 wyświetlenie";
  if (n < 5) return `${n} wyświetlenia`;
  if (n < 1000) return `${n} wyświetleń`;
  if (n < 10000) return `${(n / 1000).toFixed(1).replace(".0", "")} tys. wyświetleń`;
  return `${Math.round(n / 1000)} tys. wyświetleń`;
}
