// cspell:disable-file -- komentarze i etykiety po polsku
/**
 * Rzut parteru — układ w **metrach** według zestawienia pomieszczeń (projekt „Rozbudowa, nadbudowa i przebudowa
 * budynku świetlicy wiejskiej”, Studzienki, 1:100) i opisu: bryła ~**13,32 m × 10,32 m**.
 *
 * Oś: **(0,0) = północno-zachodni narożnik bryły**; +X na wschód, +Y na **południe** (jak na rysunku w SVG).
 *
 * Kalibracja do PNG: prostokąt bryły na zdjęciu w **%** viewBoxu 0–100 (to samo co `studzienki-rzut-dane` overlay).
 * Po wymianie rastru w `/public/wies/studzienki/rzut-parteru.png` dopracuj tylko `BUDYNEK_NA_RYSUNKU_PROC`, nie powierzchnie m².
 */

import type { ProstokatProc, StolWSkaliRzutu, StrefaRzutuStudzienki, ZnacznikRzutuStudzienki } from "./studzienki-rzut-dane";

/** Szer. × gł. bryły (E–W × N–S) z opisu rysunku. */
export const BRYLA_M = { w: 13.32, h: 10.32 } as const;

/**
 * Szkic bryły na pliku `rzut-parteru.png` w układzie 0–100% (kompozycja arkusza, margines, legenda u góry).
 * Dopasowane tak, by bryła pokrywała rysunek; zmiana tylko przy wymianie pliku.
 */
export const BUDYNEK_NA_RYSUNKU_PROC: ProstokatProc = { x: 7.5, y: 9, w: 70, h: 78 };

export function metrProstokatDoProc(r: Readonly<{ x: number; y: number; w: number; h: number }>): ProstokatProc {
  const { w: Mw, h: Mh } = BRYLA_M;
  const b = BUDYNEK_NA_RYSUNKU_PROC;
  return {
    x: b.x + (r.x / Mw) * b.w,
    y: b.y + (r.y / Mh) * b.h,
    w: (r.w / Mw) * b.w,
    h: (r.h / Mh) * b.h,
  };
}

/* --- Szkic metryczny (Zestawienie pomieszczeń) --- */

/** Lewy słupek: wysokości w osi pionowej dzielimy zgodnie z udziałem pól z tabeli (0 → N, dół → S). */
const S_W_L = 5.32; // 13,32 - 8,00 (szer. części serwisowej)
const A_15 = 6.3;
const A_14 = 17.2;
const A_13 = 4.18;
const S_GORA = 6.6; // wys. zgrubnie linii łączącej gór (nad salą 8m)
const h15 = (S_GORA * A_15) / (A_15 + A_14 + A_13);
const h14 = (S_GORA * A_14) / (A_15 + A_14 + A_13);
const h13 = (S_GORA * A_13) / (A_15 + A_14 + A_13);
const y15 = 0;
const y14 = y15 + h15;
const y13 = y14 + h14;
const h_dol = 10.32 - S_GORA; // 3,72
const A_12 = 5.15;
const A_11 = 5.76;
const h12 = (h_dol * A_12) / (A_12 + A_11);
const h11 = h_dol - h12;
const y12 = S_GORA;
const y11 = y12 + h12;

/** Sępy pomieszczeń (metry) — zgodne z tabelą m² i 8,00 m × 6,60 m + 7,05 m × 2,805 m dla sali. */
const RM = {
  p15: { x: 0, y: y15, w: S_W_L, h: h15 },
  p14: { x: 0, y: y14, w: S_W_L, h: h14 },
  p13: { x: 0, y: y13, w: S_W_L, h: h13 },
  p12: { x: 0, y: y12, w: S_W_L, h: h12 },
  p11: { x: 0, y: y11, w: S_W_L, h: h11 },
  /** 1.6: część górna 8,00 m × 6,60 m */
  p16a: { x: S_W_L, y: 0, w: 8, h: 6.6 },
  /** 1.6: dołek L (19,78 m²) 7,05 m × 2,805 m — wyrównany do wsch. granicy bryły */
  p16b: { x: 13.32 - 7.05, y: 6.6, w: 7.05, h: 2.805 },
};

const UNIA_16: { x: number; y: number; w: number; h: number } = {
  x: RM.p16a.x,
  y: 0,
  w: 13.32 - S_W_L,
  h: 6.6 + RM.p16b.h,
};

/** Sali **główny** prostokąt 8,00 m × 6,60 m — do edytora 100×70 (nie całe L). */
const SALA_16_MAIN_M: Readonly<{ x: number; y: number; w: number; h: number }> = { x: S_W_L, y: 0, w: 8, h: 6.6 };

function strefa(
  id: string,
  nazwa: string,
  pow: string,
  kolor: string,
  m: Readonly<{ x: number; y: number; w: number; h: number }>
): StrefaRzutuStudzienki {
  return { id, nazwa, powierzchnia: pow, kolor, rect: metrProstokatDoProc(m) };
}

/**
 * Wszystkie strefy na rzucie: od metrów (wiążące) → % PNG.
 * Sala jako **dwa** prostokąty (1.6 i 1.6L) — łatwiej czytać L niż jednym bbox.
 */
export const STREFY_RZUTU_W_METRACH: StrefaRzutuStudzienki[] = [
  strefa("1.5", "1.5 Pom. gosp.", "6,30 m²", "#78716c", RM.p15),
  strefa("1.4", "1.4 Zaplecze kuchni", "17,20 m²", "#ea580c", RM.p14),
  strefa("1.3", "1.3 WC męski", "4,18 m²", "#0284c7", RM.p13),
  strefa("1.2", "1.2 WC damski + niepełnosprawność", "5,15 m²", "#0ea5e9", RM.p12),
  strefa("1.1", "1.1 Wiatrołap", "5,76 m²", "#d97706", RM.p11),
  strefa("1.6", "1.6 Sala — 8,00 m × 6,60 m", "52,80 m² (cz. górna L, razem 72,58 m² z dołem)", "#15803d", RM.p16a),
  strefa("1.6L", "1.6 Sala — 7,05 m × 2,805 m", "19,78 m² (doł L; razem 1.6: 72,58 m²)", "#0f766e", RM.p16b),
];

export const DANE_RZUTU = {
  zestawienie: [
    { lp: "1.1", naz: "Wiatrołap", m2: "5,76" },
    { lp: "1.2", naz: "WC damski + niepełnosprawność", m2: "5,15" },
    { lp: "1.3", naz: "WC męski", m2: "4,18" },
    { lp: "1.4", naz: "Zaplecze kuchni", m2: "17,20" },
    { lp: "1.5", naz: "Pom. gospodarcze", m2: "6,30" },
    { lp: "1.6", naz: "Sala", m2: "72,58" },
    { lp: "Σ", naz: "Razem (netto w zestawieniu)", m2: "111,17" },
  ],
  bryla: `${BRYLA_M.w} m × ${BRYLA_M.h} m (obrys z rysunku)`,
} as const;

/** Bbox sali w **L** (dla ograniczenia przeciągania stołów na warstwie PNG). */
export const PROSTOKAT_SALI_DLA_STOLOW_PROC: ProstokatProc = metrProstokatDoProc(UNIA_16);

/** Prostokąt tylko **głównej** sali 8,00 m × 6,60 m — mapowanie do edytora planu (100×70) i taborów. */
export const PROSTOKAT_SALI_GLOWNEJ_PROC: ProstokatProc = metrProstokatDoProc(SALA_16_MAIN_M);

/* --- Stary układ (PNG) — do reskalowania piktogramów --- */
const SALA_PNG_STARA: ProstokatProc = { x: 42, y: 14, w: 34, h: 72 };
const STOLY_PRZED: readonly StolWSkaliRzutu[] = [
  { id: "a", typ: "prostokatny", x: 45, y: 24, miejsca: 6, szer: 12, wys: 4.5 },
  { id: "b", typ: "prostokatny", x: 45, y: 36, miejsca: 6, szer: 12, wys: 4.5 },
  { id: "c", typ: "prostokatny", x: 45, y: 48, miejsca: 6, szer: 12, wys: 4.5 },
  { id: "d", typ: "okragly", x: 58, y: 34, miejsca: 8, szer: 7, wys: 7 },
  { id: "e", typ: "okragly", x: 58, y: 48, miejsca: 8, szer: 7, wys: 7 },
  { id: "f", typ: "okragly", x: 58, y: 62, miejsca: 8, szer: 7, wys: 7 },
];

const ST = SALA_PNG_STARA;
const SALA_16_Nowa_PNG = PROSTOKAT_SALI_GLOWNEJ_PROC;

function przeniesPola(s: StolWSkaliRzutu): StolWSkaliRzutu {
  return {
    ...s,
    x: SALA_16_Nowa_PNG.x + ((s.x - ST.x) / ST.w) * SALA_16_Nowa_PNG.w,
    y: SALA_16_Nowa_PNG.y + ((s.y - ST.y) / ST.h) * SALA_16_Nowa_PNG.h,
    szer: (s.szer / ST.w) * SALA_16_Nowa_PNG.w,
    wys: (s.wys / ST.h) * SALA_16_Nowa_PNG.h,
  };
}

/**
 * Domyślne stoły w obrębie **głównej** 8,00 m × 6,60 m (w % bitmapy) — spójne z edytorem. Na interaktywnym
 * rzucie można przeciągnąć w doł L (`PROSTOKAT_SALI_DLA_STOLOW_PROC`).
 */
export const UKLAD_STOLOW_STUDZIENKI_Z_METROW: readonly StolWSkaliRzutu[] = STOLY_PRZED.map((t) => przeniesPola(t));

/* --- Wejścia / okna (orientacyjnie na ścianach) --- */
export const ZNACZNIKI_RZUTU_W_METRACH: ZnacznikRzutuStudzienki[] = [
  {
    typ: "wejscie",
    etykieta: "Dz1",
    opis: "Wejście główne (9×(4+2) w osi) — wiatrołap 1.1",
    rect: metrProstokatDoProc({ x: 0.3, y: 10, w: 2, h: 0.2 }),
  },
  {
    typ: "drzwi_wew",
    etykieta: "D3",
    opis: "Drzwi 9×(4+2) wiatrołap / sala 1.6 (wg legendy rysunku)",
    rect: metrProstokatDoProc({ x: S_W_L - 0.1, y: 7, w: 0.15, h: 0.4 }),
  },
  {
    typ: "rampa",
    etykieta: "8%",
    opis: "Rampa — nachylenie ok. 8% (dostęp z południa, wg projektu)",
    rect: metrProstokatDoProc({ x: 1, y: 10, w: 3, h: 0.2 }),
  },
  {
    typ: "okno",
    etykieta: "O1 / O2",
    opis: "Okna sali: O1, O2 (wymiary w szyku okiennym na rysunku)",
    rect: metrProstokatDoProc({ x: 8.5, y: 0.1, w: 6, h: 0.25 }),
  },
  {
    typ: "okno",
    etykieta: "O2",
    opis: "Drzwi okienne / oś tarasowa 180×200 (ściana wsch. sali)",
    rect: metrProstokatDoProc({ x: 12.9, y: 2.5, w: 0.2, h: 2 }),
  },
];
