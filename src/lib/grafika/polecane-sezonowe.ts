/** Id szablonów / paczek polecanych w danym miesiącu (1–12). */
const POLECANe_MIESIAC: Record<number, { ids: string[]; tytul: string; opis: string }> = {
  1: { ids: ["sezon-sylwester", "sezon-mikolajki"], tytul: "Styczeń — zabawa i podsumowanie", opis: "Sylwester, podziękowania za wsparcie w minionym roku." },
  2: { ids: ["sezon-dzien-kobiet", "zaproszenie-zebranie"], tytul: "Luty — KGW i spotkania", opis: "Dzień Kobiet, zebrania przygotowawcze." },
  3: { ids: ["sezon-wielkanoc", "sezon-dzien-kobiet"], tytul: "Marzec — Wielkanoc i wiosna", opis: "Spotkania wielkanocne, pierwsze wiosenne imprezy." },
  4: { ids: ["zaproszenie-impreza-wies", "plakat-dzien-dziecka"], tytul: "Kwiecień — integracja", opis: "Pikniki rodzinne, przygotowania do Dnia Dziecka." },
  5: { ids: ["plakat-dzien-dziecka-kolorowy", "plakat-dzien-dziecka-swietlica", "dyplom-super-dziecko"], tytul: "Maj–czerwiec — dzieci i święta", opis: "Dzień Dziecka w świetlicy, konkursy, dyplomy dla najmłodszych." },
  6: { ids: ["plakat-dzien-dziecka-kolorowy", "lzs-turniej", "zaproszenie-warsztaty-dzieci"], tytul: "Czerwiec — lato i sport", opis: "Pożegnanie roku szkolnego, turnieje, wakacyjne warsztaty." },
  7: { ids: ["sezon-pozegnanie-lata", "sezon-dozynki"], tytul: "Lipiec — festyny letnie", opis: "Ogniska, przygotowania do dożynkowych." },
  8: { ids: ["sezon-dozynki", "dyplom-wolontariusz"], tytul: "Sierpień — dożynki", opis: "Plakaty dożynkowe, dyplomy dla wolontariuszy festynu." },
  9: { ids: ["sezon-dni-seniora", "dyplom-senior-aktywnosc"], tytul: "Wrzesień — seniorzy i jesień", opis: "Dni Seniora, rozpoczęcie sezonu w klubie." },
  10: { ids: ["plakat-11-listopada", "dyplom-patriotyczny", "plakat-kiermasz-jesien"], tytul: "Październik — patriotyzm i jesień", opis: "11 listopada, kiermasz KGW, konkursy niepodległościowe." },
  11: { ids: ["plakat-11-listopada", "plakat-zebranie-tablica", "plakat-fundusz-sołecki"], tytul: "Listopad — pamięć i sprawy sołeckie", opis: "Uroczystości, zebrania, plan funduszu na kolejny rok." },
  12: { ids: ["sezon-mikolajki", "plakat-wigilia-wies", "sezon-sylwester"], tytul: "Grudzień — święta", opis: "Mikołajki, wigilia mieszkańców, sylwester." },
};

export function polecaneSezonoweTeraz(): { ids: string[]; tytul: string; opis: string } {
  const miesiac = new Date().getMonth() + 1;
  return POLECANe_MIESIAC[miesiac] ?? POLECANe_MIESIAC[6]!;
}
