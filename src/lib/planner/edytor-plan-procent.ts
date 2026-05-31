/** Wspólne stałe edytorów planów 2D (świetlica, cmentarz). */
export const VB_PLAN_SZER = 100;
export const VB_PLAN_WYS = 70;
export const MAX_COFANIA_PLAN = 22;
export const KROK_SIATKI_DOMYSLNY = 2.5;

export function snapDoSiatki(wartosc: number, krok: number): number {
  if (krok <= 0) return Math.round(wartosc * 100) / 100;
  return Math.round(wartosc / krok) * krok;
}

export function snapPozycje(x: number, y: number, krok: number): { x: number; y: number } {
  return { x: snapDoSiatki(x, krok), y: snapDoSiatki(y, krok) };
}

export function snapRozmiar(wartosc: number, krok: number, min = 1): number {
  return Math.max(min, snapDoSiatki(wartosc, krok));
}
