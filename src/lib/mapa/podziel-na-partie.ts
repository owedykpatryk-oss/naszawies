/** Dzieli tablicę na partie (PostgREST `.in()` — max ~150 id na zapytanie). */
export function podzielNaPartie<T>(elementy: T[], rozmiarPartii = 120): T[][] {
  if (elementy.length === 0) return [];
  const out: T[][] = [];
  for (let i = 0; i < elementy.length; i += rozmiarPartii) {
    out.push(elementy.slice(i, i + rozmiarPartii));
  }
  return out;
}
