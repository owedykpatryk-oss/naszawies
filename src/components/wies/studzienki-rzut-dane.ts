/**
 * Współrzędne w **0–100%** całej bitmapy `rzut-parteru.png` (z marginesami arkusza, tytułem, legendą).
 * **Źródło geometryczne:** wymiary z tabeli i rzutu 1:100 w `studzienki-rzut-metre.ts` → przeliczenie m → % przez
 * `BUDYNEK_NA_RYSUNKU_PROC` (dopasowanie do PNG; po wymianie rastru popraw tylko ten prostokąt w pliku *-metre*).
 *
 * W papierach wiążące są **oryginał 1:100** i tabela m²; warstwa SVG służy do orientacji i gry układem stołów.
 */

import {
  STREFY_RZUTU_W_METRACH,
  UKLAD_STOLOW_STUDZIENKI_Z_METROW,
  ZNACZNIKI_RZUTU_W_METRACH,
} from "./studzienki-rzut-metre";

export { DANE_RZUTU, PROSTOKAT_SALI_DLA_STOLOW_PROC, PROSTOKAT_SALI_GLOWNEJ_PROC } from "./studzienki-rzut-metre";
export { BUDYNEK_NA_RYSUNKU_PROC, BRYLA_M } from "./studzienki-rzut-metre";

export type ProstokatProc = { x: number; y: number; w: number; h: number };

export type StrefaRzutuStudzienki = {
  id: string;
  nazwa: string;
  powierzchnia: string;
  kolor: string;
  rect: ProstokatProc;
};

export type TypZnacznikaRzutu = "wejscie" | "okno" | "rampa" | "drzwi_wew";

export type ZnacznikRzutuStudzienki = {
  typ: TypZnacznikaRzutu;
  etykieta: string;
  opis: string;
  rect: ProstokatProc;
};

export const STREFA_SALI_GLOWNEJ_ID = "1.6";

/** Szkic stołów w sali 1.6 — 0–100% całej bitmapy, ten sam co interaktywny rzut i `planSaliStudzienkiPoczatkowy`. */
export type StolWSkaliRzutu = {
  id: string;
  typ: "prostokatny" | "okragly";
  x: number;
  y: number;
  miejsca: number;
  szer: number;
  wys: number;
};

export const STREFY_RZUTU_STUDZIENKI: StrefaRzutuStudzienki[] = STREFY_RZUTU_W_METRACH;
export const ZNACZNIKI_RZUTU_STUDZIENKI = ZNACZNIKI_RZUTU_W_METRACH as ZnacznikRzutuStudzienki[];
export const UKLAD_STOLOW_W_SALI_STUDZIENKI: readonly StolWSkaliRzutu[] = UKLAD_STOLOW_STUDZIENKI_Z_METROW;

const ZAOKR2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Mapowanie z układu pełnej bitmapy rzutu na skalę edytora planu sali (viewBox 100×70, cała płaszczyzna = tylko prostokąt
 * głównej sali **8,00 m × 6,60 m**, nie doł L).
 */
export function wspRzutuDoSkaliPlanuSali(
  sala: ProstokatProc,
  x: number,
  y: number,
  szer: number,
  wys: number
): { x: number; y: number; szer: number; wys: number } {
  return {
    x: ZAOKR2(((x - sala.x) / sala.w) * 100),
    y: ZAOKR2(((y - sala.y) / sala.h) * 70),
    szer: ZAOKR2((szer / sala.w) * 100),
    wys: ZAOKR2((wys / sala.h) * 70),
  };
}

export function znajdzStrefe(id: string): StrefaRzutuStudzienki | undefined {
  return STREFY_RZUTU_STUDZIENKI.find((s) => s.id === id);
}
