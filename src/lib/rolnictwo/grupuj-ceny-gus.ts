export type WierszCenyGus = {
  product_key: string;
  product_label: string;
  year: number;
  month: number;
  value: number;
  unit: string;
  gus_channel?: string;
  gus_region_nazwa?: string | null;
};

export type CenaGusAktualna = {
  product_key: string;
  product_label: string;
  year: number;
  month: number;
  value: number;
  unit: string;
};

export type PunktHistoriiGus = {
  year: number;
  month: number;
  value: number;
  label: string;
};

/** Najnowsza cena na produkt (po roku i miesiącu), opcjonalnie per kanał GUS. */
export function cenyGusAktualne(
  wiersze: WierszCenyGus[],
  kanal: "skup" | "targ" = "skup",
): CenaGusAktualna[] {
  const naj = new Map<string, WierszCenyGus>();
  for (const w of wiersze) {
    if (w.gus_channel && w.gus_channel !== kanal) continue;
    const pop = naj.get(w.product_key);
    if (!pop || w.year > pop.year || (w.year === pop.year && w.month > pop.month)) {
      naj.set(w.product_key, w);
    }
  }
  return Array.from(naj.values()).map((w) => ({
    product_key: w.product_key,
    product_label: w.product_label,
    year: w.year,
    month: w.month,
    value: Number(w.value),
    unit: w.unit,
  }));
}

/** Historia jednego produktu — ostatnie 12 miesięcy kalendarzowych, rosnąco. */
export function historiaProduktuGus(
  wiersze: WierszCenyGus[],
  productKey: string,
  ileMiesiecy = 12,
  kanal: "skup" | "targ" = "skup",
): PunktHistoriiGus[] {
  const MIESIACE = [
    "sty", "lut", "mar", "kwi", "maj", "cze",
    "lip", "sie", "wrz", "paź", "lis", "gru",
  ];
  const filtrowane = wiersze
    .filter((w) => w.product_key === productKey && (!w.gus_channel || w.gus_channel === kanal))
    .sort((a, b) => a.year * 100 + a.month - (b.year * 100 + b.month));
  const ostatnie = filtrowane.slice(-ileMiesiecy);
  return ostatnie.map((w) => ({
    year: w.year,
    month: w.month,
    value: Number(w.value),
    label: `${MIESIACE[w.month - 1] ?? w.month} ${w.year}`,
  }));
}
