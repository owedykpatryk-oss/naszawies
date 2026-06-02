import type { PowiazanySzablon } from "./powiazane-szablony";

export type PowiazanyDokument = {
  presetId: string;
  etykieta: string;
};

const DOKUMENTY: Record<string, PowiazanyDokument[]> = {
  "plakat-dzien-dziecka-kolorowy": [
    { presetId: "zaproszenie-dzien-dziecka-pismo", etykieta: "Pismo zaproszenie (A4)" },
  ],
  "plakat-dzien-dziecka-swietlica": [
    { presetId: "zaproszenie-dzien-dziecka-pismo", etykieta: "Zaproszenie urzędowe" },
    { presetId: "regulamin-swietlica-skrot", etykieta: "Regulamin świetlicy (tekst)" },
  ],
  "karta-regulamin-swietlicy": [
    { presetId: "zawiadomienie-wprowadzenie-regulaminu", etykieta: "Zawiadomienie o regulaminie" },
    { presetId: "protokol-sali-swietlica", etykieta: "Protokół rezerwacji sali" },
  ],
  "plakat-zebranie-tablica": [
    { presetId: "zaproszenie-zebranie", etykieta: "Zaproszenie na zebranie (pismo)" },
    { presetId: "protokol-zebrania", etykieta: "Protokół zebrania" },
  ],
  "plakat-fundusz-sołecki": [
    { presetId: "wniosek-fundusz-sołecki", etykieta: "Wniosek do funduszu sołeckiego" },
    { presetId: "zaproszenie-zebranie", etykieta: "Zaproszenie na zebranie" },
  ],
  "sezon-dozynki": [
    { presetId: "zaproszenie-dozynki-pismo", etykieta: "Zaproszenie na dożynki" },
  ],
  "plakat-11-listopada": [
    { presetId: "ogloszenie-wydarzenie-publiczne", etykieta: "Ogłoszenie urzędowe" },
  ],
  "karta-program-festynu": [
    { presetId: "ogloszenie-wydarzenie-publiczne", etykieta: "Ogłoszenie o festynie" },
  ],
};

export function powiazaneDokumenty(szablonId: string): PowiazanyDokument[] {
  return DOKUMENTY[szablonId] ?? [];
}

export function linkDoPresetuDokumentu(presetId: string): string {
  return `/panel/soltys/dokumenty?preset=${encodeURIComponent(presetId)}`;
}
