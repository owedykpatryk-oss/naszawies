/**
 * Współrzędne w układzie 0–100% całej bitmapy `rzut-parteru.png` (łącznie z marginesami, tytułem i legendą).
 *
 * ## Czy to 1:1 z CAD?
 * **Nie** — to ręczna kalibracja „na oko” do PNG, nie import z DWG/PDF. Wymiary wiążące to **rysunek
 * w skali 1:100** i tabela metraży na oryginale; warstwa SVG służy do orientacji i zabawy układem stołów.
 *
 * ## Jak dopasować dokładniej
 * Otwórz PNG w edytorze z siatką % albo w przeglądarce (DevTools → zaznacz obrazek) i popraw `rect`
 * oraz `x,y` znaczników. Pamiętaj: po prawej na arkuszu jest **legenda techniczna** — sama bryła budynku
 * nie zajmuje całej szerokości pliku.
 */

export type ProstokatProc = { x: number; y: number; w: number; h: number };

export type StrefaRzutuStudzienki = {
  id: string;
  nazwa: string;
  powierzchnia: string;
  kolor: string;
  rect: ProstokatProc;
};

export const STREFA_SALI_GLOWNEJ_ID = "1.6";

/** Szkic stołów w sali 1.6 — współrzędne jak `rect` całej bitmapy (0–100%), ten sam układ co na rzucie PNG. */
export type StolWSkaliRzutu = {
  id: string;
  typ: "prostokatny" | "okragly";
  x: number;
  y: number;
  miejsca: number;
  szer: number;
  wys: number;
};

/**
 * Początkowy układ stołów w obrębie sali 1.6 (kolumna + grupa okrągłych) — spójny z interaktywnym rzutem
 * i z planem w edytorze sołtysa (`planSaliStudzienkiPoczatkowy`).
 */
export const UKLAD_STOLOW_W_SALI_STUDZIENKI: readonly StolWSkaliRzutu[] = [
  { id: "a", typ: "prostokatny", x: 45, y: 24, miejsca: 6, szer: 12, wys: 4.5 },
  { id: "b", typ: "prostokatny", x: 45, y: 36, miejsca: 6, szer: 12, wys: 4.5 },
  { id: "c", typ: "prostokatny", x: 45, y: 48, miejsca: 6, szer: 12, wys: 4.5 },
  { id: "d", typ: "okragly", x: 58, y: 34, miejsca: 8, szer: 7, wys: 7 },
  { id: "e", typ: "okragly", x: 58, y: 48, miejsca: 8, szer: 7, wys: 7 },
  { id: "f", typ: "okragly", x: 58, y: 62, miejsca: 8, szer: 7, wys: 7 },
];

const ZAOKR2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Mapowanie z układu pełnej bitmapy rzutu na skalę edytora planu sali (viewBox 100×70, cała płaszczyzna = tylko sala).
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

/**
 * Topologia wg opisu rysunku (04/2024): sala zajmuje prawą część bryły; kuchnia + gosp. u góry po lewej;
 * WC męski między kuchnią a salą; WC damski / niepełnosprawność na dole po lewej; wiatrołap z wejściem u dołu.
 * Wartości są przybliżone — dopracuj po wizualnym porównaniu z PNG.
 */
export const STREFY_RZUTU_STUDZIENKI: StrefaRzutuStudzienki[] = [
  {
    id: "1.1",
    nazwa: "Wiatrołap (wejście Dz1)",
    powierzchnia: "5,76 m²",
    kolor: "#d97706",
    rect: { x: 28, y: 72, w: 22, h: 14 },
  },
  {
    id: "1.2",
    nazwa: "WC damski + dla osób z niepełnosprawnością",
    powierzchnia: "5,15 m²",
    kolor: "#0ea5e9",
    rect: { x: 8, y: 54, w: 20, h: 20 },
  },
  {
    id: "1.3",
    nazwa: "WC męski",
    powierzchnia: "4,18 m²",
    kolor: "#0284c7",
    rect: { x: 24, y: 32, w: 18, h: 22 },
  },
  {
    id: "1.4",
    nazwa: "Zaplecze kuchni",
    powierzchnia: "17,20 m²",
    kolor: "#ea580c",
    rect: { x: 8, y: 14, w: 34, h: 26 },
  },
  {
    id: "1.4b",
    nazwa: "Spiżarnia / zaplecze (ok. 3 m² — na rysunku przy kuchni)",
    powierzchnia: "3,00 m²",
    kolor: "#c2410c",
    rect: { x: 8, y: 40, w: 14, h: 10 },
  },
  {
    id: "1.5",
    nazwa: "Pomieszczenie gospodarcze",
    powierzchnia: "6,30 m²",
    kolor: "#78716c",
    rect: { x: 8, y: 10, w: 14, h: 10 },
  },
  {
    id: "1.6",
    nazwa: "Sala (główna)",
    powierzchnia: "72,58 m²",
    kolor: "#15803d",
    rect: { x: 42, y: 14, w: 34, h: 72 },
  },
];

export type TypZnacznikaRzutu = "wejscie" | "okno" | "rampa" | "drzwi_wew";

export type ZnacznikRzutuStudzienki = {
  typ: TypZnacznikaRzutu;
  /** np. Dz1, O1, D3 */
  etykieta: string;
  opis: string;
  /** środek lub prostokąt */
  rect: ProstokatProc;
};

/** Symbole z legendy rysunku (pozycje orientacyjne — nie zastępują linii ścian z PNG). */
export const ZNACZNIKI_RZUTU_STUDZIENKI: ZnacznikRzutuStudzienki[] = [
  {
    typ: "wejscie",
    etykieta: "Dz1",
    opis: "Wejście główne (wiatrołap)",
    rect: { x: 36, y: 82, w: 6, h: 4 },
  },
  {
    typ: "drzwi_wew",
    etykieta: "D3",
    opis: "Drzwi z wiatrołapu do sali",
    rect: { x: 40, y: 68, w: 5, h: 4 },
  },
  {
    typ: "rampa",
    etykieta: "8%",
    opis: "Rampa / pochylnia przy wejściu (ok. 8% — wg rysunku)",
    rect: { x: 26, y: 84, w: 26, h: 3 },
  },
  {
    typ: "okno",
    etykieta: "O1",
    opis: "Okno w sali (np. 100×200 cm — wg legendy)",
    rect: { x: 44, y: 15, w: 4, h: 3 },
  },
  {
    typ: "okno",
    etykieta: "O2",
    opis: "Okno w sali (np. 180×200 cm)",
    rect: { x: 52, y: 15, w: 6, h: 3 },
  },
  {
    typ: "okno",
    etykieta: "O2",
    opis: "Okno boczne sali",
    rect: { x: 73, y: 40, w: 2.5, h: 8 },
  },
  {
    typ: "okno",
    etykieta: "O4",
    opis: "Okno w kuchni / zapleczu",
    rect: { x: 8, y: 22, w: 2.5, h: 5 },
  },
  {
    typ: "okno",
    etykieta: "O3",
    opis: "Małe okno w strefie WC (np. 70×70 cm)",
    rect: { x: 8, y: 58, w: 2, h: 2.5 },
  },
];

export function znajdzStrefe(id: string): StrefaRzutuStudzienki | undefined {
  return STREFY_RZUTU_STUDZIENKI.find((s) => s.id === id);
}
