/** Minimalne dane oferty do obliczenia odznak zaufania sprzedawcy. */
export type OfertaZeSprzedawca = {
  owner_user_id?: string | null;
};

export type ZaufanieSprzedawcy = {
  liczbaOgloszenSprzedawcy?: number;
  znanyWWsi?: boolean;
  aktywnySprzedawca?: boolean;
};

const PROG_ZNANY_W_WSI = 3;
const PROG_AKTYWNY = 5;

export function wzbogacOfertyOZaufanie<T extends OfertaZeSprzedawca>(
  oferty: T[],
): (T & ZaufanieSprzedawcy)[] {
  const liczniki = new Map<string, number>();
  for (const o of oferty) {
    const uid = o.owner_user_id;
    if (!uid) continue;
    liczniki.set(uid, (liczniki.get(uid) ?? 0) + 1);
  }

  return oferty.map((o) => {
    const uid = o.owner_user_id;
    if (!uid) return { ...o };
    const n = liczniki.get(uid) ?? 0;
    return {
      ...o,
      liczbaOgloszenSprzedawcy: n,
      znanyWWsi: n >= PROG_ZNANY_W_WSI,
      aktywnySprzedawca: n >= PROG_AKTYWNY,
    };
  });
}

export function zaufanieZLiczby(liczba: number): ZaufanieSprzedawcy {
  return {
    liczbaOgloszenSprzedawcy: liczba,
    znanyWWsi: liczba >= PROG_ZNANY_W_WSI,
    aktywnySprzedawca: liczba >= PROG_AKTYWNY,
  };
}
