import type { SzablonGrafiki } from "./typy";

export type PowiazanySzablon = { id: string; etykieta: string };

const KOMPLETY: Record<string, PowiazanySzablon[]> = {
  "plakat-dzien-dziecka-kolorowy": [
    { id: "dyplom-super-dziecko", etykieta: "Dyplomy uczestników (masowy druk)" },
    { id: "plakat-konkurs-plastyczny-dzieci", etykieta: "Ogłoszenie konkursu plastycznego" },
    { id: "zaproszenie-warsztaty-dzieci", etykieta: "Wakacyjne warsztaty" },
  ],
  "plakat-dzien-dziecka-swietlica": [
    { id: "dyplom-super-dziecko", etykieta: "Dyplomy dla dzieci" },
    { id: "karta-regulamin-swietlicy", etykieta: "Regulamin świetlicy" },
  ],
  "karta-regulamin-swietlicy": [
    { id: "karta-rezerwacja-swietlicy", etykieta: "Zasady rezerwacji sali" },
    { id: "plakat-godziny-swietlicy", etykieta: "Godziny otwarcia" },
    { id: "karta-bezpieczenstwo-swietlicy", etykieta: "Bezpieczeństwo pożarowe" },
  ],
  "plakat-godziny-swietlicy": [
    { id: "plakat-zajecia-swietlicy", etykieta: "Harmonogram zajęć" },
    { id: "karta-rezerwacja-swietlicy", etykieta: "Rezerwacja sali" },
  ],
  "plakat-konkurs-plastyczny-dzieci": [
    { id: "dyplom-dziecko-konkurs", etykieta: "Dyplom laureata" },
    { id: "dyplom-super-dziecko", etykieta: "Wyróżnienie specjalne" },
  ],
  "zaproszenie-otwarcie-swietlicy": [
    { id: "karta-regulamin-swietlicy", etykieta: "Regulamin do powieszenia" },
    { id: "plakat-godziny-swietlicy", etykieta: "Plakat z godzinami" },
  ],
  "plakat-zebranie-tablica": [
    { id: "zaproszenie-zebranie", etykieta: "Zaproszenie urzędowe (A4)" },
    { id: "karta-kontakt-solectwa", etykieta: "Karta kontaktowa" },
  ],
  "plakat-fundusz-sołecki": [
    { id: "plakat-zebranie-tablica", etykieta: "Ogłoszenie o zebraniu" },
    { id: "karta-program-festynu", etykieta: "Program po zatwierdzeniu" },
  ],
  "sezon-dozynki": [
    { id: "karta-program-festynu", etykieta: "Program festynu (karta)" },
    { id: "dyplom-wolontariusz", etykieta: "Dyplomy wolontariuszy" },
  ],
  "plakat-11-listopada": [
    { id: "dyplom-patriotyczny", etykieta: "Dyplom uczestnika konkursu" },
  ],
};

export function powiazaneSzablony(szablonId: string): PowiazanySzablon[] {
  return KOMPLETY[szablonId] ?? [];
}

export function podobneSzablony(
  biezacy: SzablonGrafiki,
  wszystkie: SzablonGrafiki[],
  limit = 4,
): SzablonGrafiki[] {
  const tagiB = new Set(biezacy.tagi ?? []);
  const wynik: SzablonGrafiki[] = [];
  for (const s of wszystkie) {
    if (s.id === biezacy.id) continue;
    const wspolneTagi = (s.tagi ?? []).some((t) => tagiB.has(t));
    if (s.kategoria === biezacy.kategoria || wspolneTagi) {
      wynik.push(s);
      if (wynik.length >= limit) break;
    }
  }
  return wynik;
}
