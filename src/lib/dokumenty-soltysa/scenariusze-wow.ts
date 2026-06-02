export type ScenariuszDokumentu = {
  id: string;
  tytul: string;
  opis: string;
  presetId: string;
  uzupelnienia: Record<string, string>;
  /** Opcjonalny tag UI (sezon, dyplom…) */
  tag?: string;
};

export type KrokLejkaSponsora = {
  krok: number;
  tytul: string;
  opis: string;
  scenariusz: ScenariuszDokumentu;
};

export type OpcjeScenariuszyWow = {
  domyslnaWies?: string;
  domyslnaGmina?: string;
  domyslnySoltysNazwa?: string;
};

/** Scenariusze z gotowym odpowiednikiem w kreatorze grafiki. */
export const GRAFIKA_DYPLOM_SCENARIUSZE: Record<string, { szablon: string; etykieta: string }> = {
  "wow-dyplom-zasluzony": { szablon: "dyplom-zasluzony-mieszkaniec", etykieta: "Wersja graficzna — pergamin premium" },
  "wow-dyplom-wolontariusz": { szablon: "dyplom-wolontariusz", etykieta: "Wersja graficzna dyplomu wolontariusza" },
  "wow-zaswiadczenie-szkolenie": { szablon: "certyfikat-szkolenie-bezpieczenstwo", etykieta: "Certyfikat graficzny szkolenia" },
  "wow-festyn-zaproszenie": { szablon: "zaproszenie-impreza-wies", etykieta: "Plakat graficzny festynu" },
  "wow-dozynki-komunikat": { szablon: "sezon-dozynki", etykieta: "Plakat dożynków w kreatorze" },
  "wow-dzien-dziecka-swietlica": { szablon: "plakat-dzien-dziecka-swietlica", etykieta: "Kolorowy plakat Dnia Dziecka" },
  "wow-regulamin-swietlicy": { szablon: "karta-regulamin-swietlicy", etykieta: "Regulamin świetlicy — wersja graficzna" },
  "wow-konkurs-plastyczny": { szablon: "plakat-konkurs-plastyczny-dzieci", etykieta: "Plakat konkursu w kreatorze" },
  "wow-zebranie-tablica": { szablon: "plakat-zebranie-tablica", etykieta: "Plakat na tablicę ogłoszeń" },
  "wow-fundusz-sołecki": { szablon: "plakat-fundusz-sołecki", etykieta: "Plan funduszu — wersja graficzna" },
  "wow-11-listopada": { szablon: "plakat-11-listopada", etykieta: "Plakat uroczystości patriotycznej" },
  "wow-program-festynu": { szablon: "karta-program-festynu", etykieta: "Program festynu do druku" },
  "wow-fundusz-plakat": { szablon: "plakat-fundusz-sołecki", etykieta: "Plakat planu funduszu" },
  "wow-podziekowanie": { szablon: "sponsor-podziekowanie", etykieta: "Podziękowanie graficzne dla sponsora" },
  "wow-zebranie-szybkie": { szablon: "plakat-zebranie-tablica", etykieta: "Plakat tablicowy — zebranie" },
  "wow-tablica-ogloszen": { szablon: "plakat-zebranie-tablica", etykieta: "Plakat na tablicę ogłoszeń" },
  "wow-fundusz-wniosek": { szablon: "plakat-fundusz-sołecki", etykieta: "Plan funduszu — plakat informacyjny" },
  "wow-osp-komunikat": { szablon: "plakat-zebranie-tablica", etykieta: "Komunikat OSP — plakat tablicowy" },
  "lejek-4-podziekowanie": { szablon: "sponsor-podziekowanie", etykieta: "Graficzne podziękowanie dla sponsora" },
};

/** Mapowanie presetu dokumentu → szablon graficzny (gdy użytkownik edytuje dokument dyplomowy). */
export const GRAFIKA_DLA_PRESETU: Record<string, { szablon: string; etykieta: string }> = {
  "dyplom-honorowy-mieszkaniec": { szablon: "dyplom-zasluzony-mieszkaniec", etykieta: "Otwórz w kreatorze grafiki (pergamin)" },
  "dyplom-wolontariusz-roku": { szablon: "dyplom-wolontariusz", etykieta: "Wersja graficzna dyplomu" },
  "zaswiadczenie-uczestnictwo-szkolenie": { szablon: "certyfikat-szkolenie-bezpieczenstwo", etykieta: "Certyfikat graficzny" },
  "podziekowanie-za-sluzbe-parafialna": { szablon: "dyplom-parafia-ministrans", etykieta: "Dyplom graficzny parafii" },
  "zaproszenie-dozynki-pismo": { szablon: "sezon-dozynki", etykieta: "Plakat dożynkowy w kreatorze" },
  "ogloszenie-wydarzenie-publiczne": { szablon: "zaproszenie-impreza-wies", etykieta: "Plakat / zaproszenie graficzne" },
  "komunikat-tablica-ogloszen": { szablon: "zaproszenie-zebranie", etykieta: "Zaproszenie graficzne na zebranie" },
  "podziekowanie-za-wsparcie": { szablon: "sponsor-podziekowanie", etykieta: "Podziękowanie graficzne dla sponsora" },
  "zawiadomienie-wprowadzenie-regulaminu": { szablon: "karta-regulamin-swietlicy", etykieta: "Regulamin graficzny do wydruku" },
  "protokol-sali-swietlica": { szablon: "karta-rezerwacja-swietlicy", etykieta: "Karta rezerwacji sali" },
  "regulamin-swietlica-skrot": { szablon: "karta-regulamin-swietlicy", etykieta: "Regulamin graficzny (karta A4)" },
  "zaproszenie-dzien-dziecka-pismo": { szablon: "plakat-dzien-dziecka-kolorowy", etykieta: "Kolorowy plakat Dnia Dziecka" },
  "wniosek-fundusz-sołecki": { szablon: "plakat-fundusz-sołecki", etykieta: "Plan funduszu — plakat informacyjny" },
  "zaproszenie-zebranie": { szablon: "plakat-zebranie-tablica", etykieta: "Plakat ogłoszeniowy na zebranie" },
};

function ctx(opcje: OpcjeScenariuszyWow) {
  const nazwaWsi = (opcje.domyslnaWies ?? "").trim() || "Twojej wsi";
  const nazwaGminy = (opcje.domyslnaGmina ?? "").trim() || "Twojej gminy";
  const podpis = (opcje.domyslnySoltysNazwa ?? "").trim()
    ? `Sołtys ${opcje.domyslnySoltysNazwa!.trim()}`
    : "Sołtys sołectwa";
  const kontakt = "tel. …, e-mail …";
  const wnioskodawcaSolectwo =
    nazwaWsi !== "Twojej wsi" && nazwaGminy !== "Twojej gminy"
      ? `Sołectwo ${nazwaWsi}, gmina ${nazwaGminy}`
      : nazwaWsi !== "Twojej wsi"
        ? `Sołectwo ${nazwaWsi}`
        : "Sołectwo …";
  const wies = nazwaWsi !== "Twojej wsi" ? nazwaWsi : "";
  const gmina = nazwaGminy !== "Twojej gminy" ? nazwaGminy : "";
  return { nazwaWsi, nazwaGminy, podpis, kontakt, wnioskodawcaSolectwo, wies, gmina };
}

export function zbudujScenariuszeWowDokumentow(opcje: OpcjeScenariuszyWow): ScenariuszDokumentu[] {
  const { podpis, kontakt, wnioskodawcaSolectwo, wies, nazwaWsi } = ctx(opcje);

  return [
    {
      id: "wow-finanse-firma",
      tytul: "Kampania sponsora (finanse)",
      opis: "Prośba o środki do firmy — start z gotowym uzasadnieniem i pakietem korzyści.",
      presetId: "prosba-wsparcie-finansowe-firma",
      uzupelnienia: {
        adresat: "Do Zarządu / Właściciela\n[NAZWA FIRMY]\n[ADRES]",
        wnioskodawca: wnioskodawcaSolectwo,
        cel: "doposażenie świetlicy wiejskiej",
        kwota: "3 000,00 PLN",
        uzasadnienie:
          "Celem projektu jest doposażenie świetlicy i zwiększenie dostępności zajęć dla dzieci, seniorów oraz spotkań integracyjnych mieszkańców. Inicjatywa realnie poprawi warunki życia społecznego w sołectwie.",
        korzysci:
          "Publiczne podziękowanie na stronie wsi i tablicy ogłoszeń, informacja o partnerstwie podczas wydarzenia, możliwość oznaczenia sponsora na materiałach promocyjnych.",
        kontakt,
        podpis,
      },
    },
    {
      id: "wow-rzeczowe-uslugi",
      tytul: "Wsparcie rzeczowe/usługowe",
      opis: "Pismo o materiały, transport lub robociznę z gotową sekcją rozliczenia.",
      presetId: "prosba-wsparcie-rzeczowe-uslugowe",
      uzupelnienia: {
        adresat: "Do [NAZWA FIRMY / SKLEPU / WYKONAWCY]",
        cel: "odświeżenie i naprawy w świetlicy wiejskiej",
        zakres:
          "1) Materiały wykończeniowe.\n2) Transport materiałów.\n3) Wsparcie robocizną przy pracach przygotowawczych.",
        termin: "do uzupełnienia (preferowany termin realizacji)",
        rozliczenie:
          "Przekazanie wsparcia zostanie udokumentowane protokołem odbioru. Po realizacji przygotujemy krótkie podsumowanie efektów dla darczyńcy.",
        kontakt,
        podpis,
      },
    },
    {
      id: "wow-podziekowanie",
      tytul: "Podziękowanie po realizacji",
      opis: "Gotowe eleganckie podziękowanie dla sponsora po zakończonym działaniu.",
      presetId: "podziekowanie-za-wsparcie",
      uzupelnienia: {
        adresat: "Do [NAZWA FIRMY / ORGANIZACJI]",
        projekt: "doposażenie świetlicy wiejskiej",
        wsparcie:
          "Dziękujemy za przekazane wsparcie finansowe / rzeczowe, które umożliwiło realizację zadania wskazanego przez mieszkańców.",
        efekt:
          "Dzięki wsparciu poprawiono warunki korzystania ze świetlicy i zwiększono dostępność wydarzeń społecznych dla mieszkańców.",
        publikacja: "strona sołectwa, tablica ogłoszeń i profil społecznościowy",
        podpis,
      },
    },
    {
      id: "wow-potwierdzenie-darowizny",
      tytul: "Protokół odbioru darowizny",
      opis: "Potwierdzenie dla darczyńcy do podpisu, gotowe do wydruku.",
      presetId: "potwierdzenie-darowizny-rzeczowej",
      uzupelnienia: {
        darczyca: "[NAZWA DARCZYŃCY / FIRMY]",
        odbiorca: wnioskodawcaSolectwo,
        cel: "doposażenie i utrzymanie świetlicy wiejskiej",
        przedmiot: "Lista przekazanych materiałów / sprzętu / usług (ilość, stan, wartość orientacyjna).",
        uwagi: "Przekazanie zgodne z ustaleniami stron.",
        podpis,
      },
    },
    {
      id: "wow-kgw-plan-roczny",
      tytul: "KGW: plan roczny",
      opis: "Gotowy układ działań, harmonogramu i budżetu dla koła gospodyń.",
      presetId: "plan-pracy-kgw-roczny",
      uzupelnienia: {
        nazwa_kgw: "KGW [NAZWA KOŁA]",
        wies: wies || "Sołectwo …",
        rok_plan: String(new Date().getFullYear()),
        cele:
          "1) Integracja mieszkańców przez wydarzenia lokalne.\n2) Wzmocnienie współpracy międzypokoleniowej.\n3) Promocja tradycji kulinarnych i rękodzielniczych.",
        harmonogram:
          "I kwartał: warsztaty kulinarne.\nII kwartał: piknik rodzinny.\nIII kwartał: udział w dożynkach.\nIV kwartał: kiermasz świąteczny i podsumowanie.",
        budzet:
          "Składki członkowskie, wsparcie sponsorskie, mikrodotacje gminne i dochód z wydarzeń lokalnych.",
        podpis: "Przewodnicząca KGW …",
      },
    },
    {
      id: "wow-kgw-dotacja",
      tytul: "KGW: wniosek o mikrodotację",
      opis: "Start do naboru gminnego z gotowym opisem projektu i rezultatami.",
      presetId: "wniosek-kgw-mikrodotacja",
      uzupelnienia: {
        adresat: "Do [NAZWA PROGRAMU / GMINY / FUNDACJI]",
        nazwa_kgw: "KGW [NAZWA KOŁA]",
        wies: wies || "Sołectwo …",
        tytul_projektu: "Tradycja i integracja pokoleń",
        kwota: "4 500,00 PLN",
        opis:
          "Projekt obejmuje cykl otwartych warsztatów i wydarzeń sąsiedzkich budujących integrację oraz aktywność mieszkańców.",
        rezultaty:
          "Min. 4 wydarzenia, wzrost udziału mieszkańców w działaniach społecznych, trwałe materiały i know-how dla kolejnych edycji.",
        podpis: "Przewodnicząca KGW …",
      },
    },
    {
      id: "wow-osp-komunikat",
      tytul: "OSP: komunikat bezpieczeństwa",
      opis: "Szybki szablon informacji dla mieszkańców o ćwiczeniach i zaleceniach.",
      presetId: "komunikat-osp-bezpieczenstwo",
      uzupelnienia: {
        jednostka: "OSP [NAZWA JEDNOSTKI]",
        temat: "Ćwiczenia OSP i czasowe utrudnienia",
        data_miejsce: "Data: …\nMiejsce: …",
        tresc:
          "W wyznaczonym czasie odbędą się ćwiczenia służb. Mogą wystąpić chwilowe utrudnienia w ruchu i wzmożony ruch pojazdów ratowniczych.",
        zalecenia:
          "Prosimy o zachowanie ostrożności, nieblokowanie dojazdów i stosowanie się do poleceń służb porządkowych.",
        kontakt,
      },
    },
    {
      id: "wow-dyplom-zasluzony",
      tag: "dyplom",
      tytul: "Dyplom: zasłużony mieszkaniec",
      opis: "Honorowe wyróżnienie do wręczenia na zebraniu lub festynie.",
      presetId: "dyplom-honorowy-mieszkaniec",
      uzupelnienia: {
        nagroda: "Zasłużony Mieszkaniec Sołectwa",
        laureat: "[IMIĘ I NAZWISKO]",
        uzasadnienie:
          "Za wieloletnie zaangażowanie w życie społeczne sołectwa, wspieranie inicjatyw lokalnych oraz wzorową postawę obywatelską na rzecz dobra wspólnoty.",
        miejsce: nazwaWsi !== "Twojej wsi" ? `Świetlica, ${nazwaWsi}` : "Świetlica wiejska",
        podpis1: podpis,
        podpis2: "Przewodniczący Rady Sołeckiej …",
      },
    },
    {
      id: "wow-dyplom-wolontariusz",
      tag: "dyplom",
      tytul: "Dyplom: Wolontariusz Roku",
      opis: "Gotowy dyplom dla osoby szczególnie zaangażowanej przy imprezach.",
      presetId: "dyplom-wolontariusz-roku",
      uzupelnienia: {
        laureat: "[IMIĘ I NAZWISKO]",
        rok: String(new Date().getFullYear()),
        uzasadnienie:
          "Za nieocenioną, bezinteresowną pomoc przy organizacji festynu dożynkowego oraz zaangażowanie na rzecz mieszkańców sołectwa.",
        podpis1: podpis,
        podpis2: "Przewodnicząca KGW …",
      },
    },
    {
      id: "wow-zaswiadczenie-szkolenie",
      tag: "dyplom",
      tytul: "Zaświadczenie o szkoleniu",
      opis: "Certyfikat uczestnictwa — OSP, pierwsza pomoc, warsztaty KGW.",
      presetId: "zaswiadczenie-uczestnictwo-szkolenie",
      uzupelnienia: {
        organizator: "OSP / Sołectwo",
        tytul_szkolenia: "Pierwsza pomoc przedmedyczna",
        uczestnik: "[IMIĘ I NAZWISKO]",
        program:
          "• Ocena stanu poszkodowanego\n• RKO i AED\n• Postępowanie do przyjazdu służb\n• Ćwiczenia praktyczne",
        podpis: "Instruktor szkolenia …",
      },
    },
    {
      id: "wow-lista-dyplomow",
      tag: "dyplom",
      tytul: "Protokół wręczenia dyplomów",
      opis: "Lista laureatów do archiwum po festynie lub zakończeniu roku szkolnego.",
      presetId: "lista-wreczenia-dyplomow",
      uzupelnienia: {
        wydarzenie: "Festyn dożynkowy / zakończenie roku szkolnego",
        miejsce: nazwaWsi !== "Twojej wsi" ? `Boisko, ${nazwaWsi}` : "Boisko / świetlica",
        lista:
          "1. Jan Kowalski — dyplom uczestnictwa KGW\n2. Anna Nowak — dyplom konkursu plastycznego\n3. …",
        uwagi: "Dyplomy wręczono podczas części oficjalnej wydarzenia.",
        podpis,
      },
    },
    {
      id: "wow-dozynki-komunikat",
      tag: "sezon",
      tytul: "Dożynki: zaproszenie urzędowe",
      opis: "Pismo zapraszające mieszkańców i gości na festyn dożynkowy.",
      presetId: "zaproszenie-dozynki-pismo",
      uzupelnienia: {
        tytul_wyd: "Dożynki Gminne / Festyn Dożynkowy",
        data_miejsce: "Data: …\nGodzina: od 14:00\nMiejsce: plac przy świetlicy, " + (wies || "…"),
        opis:
          "Program: korowód dożynkowy · występy zespołów · kiermasz KGW · poczęstunek chlebem i solą · zabawa do późnego wieczora.",
        kontakt,
        podpis,
      },
    },
    {
      id: "wow-festyn-zaproszenie",
      tag: "sezon",
      tytul: "Festyn wiejski: ogłoszenie",
      opis: "Krótkie ogłoszenie wydarzenia na tablicę i stronę wsi.",
      presetId: "ogloszenie-wydarzenie-publiczne",
      uzupelnienia: {
        tytul_wyd: "Festyn rodzinny sołectwa",
        data_miejsce: "Data: …\nMiejsce: boisko / plac, " + (wies || "…"),
        opis: "Koncert · stoiska KGW · animacje dla dzieci · grill · losowanie nagród.",
        kontakt,
      },
    },
    {
      id: "wow-fundusz-wniosek",
      tytul: "Fundusz sołecki: szybki wniosek",
      opis: "Gotowy szkic wniosku z uzasadnieniem i harmonogramem.",
      presetId: "wniosek-fundusz-sołecki",
      uzupelnienia: {
        wnioskodawca: wnioskodawcaSolectwo,
        nazwa_zadania: "Remont podłogi w świetlicy wiejskiej",
        kwota: "5 000,00",
        uzasadnienie:
          "Zadanie odpowiada potrzebom mieszkańców — poprawa warunków korzystania ze świetlicy i zwiększenie dostępności zajęć dla dzieci i seniorów.",
        harmonogram: "I kwartał: przygotowanie\nII kwartał: realizacja\nIII kwartał: rozliczenie",
        podpis,
      },
    },
    {
      id: "wow-zebranie-szybkie",
      tag: "zebranie",
      tytul: "Zebranie wiejskie — szybki start",
      opis: "Zaproszenie z gotowym porządkiem obrad.",
      presetId: "zaproszenie-zebranie",
      uzupelnienia: {
        porzadek:
          "1. Otwarcie zebrania\n2. Sprawozdanie sołtysa\n3. Fundusz sołecki — plan na rok\n4. Sprawy bieżące\n5. Sprawy różne\n6. Zakończenie",
        podpis,
      },
    },
    {
      id: "wow-tablica-ogloszen",
      tag: "sezon",
      tytul: "Komunikat na tablicę ogłoszeń",
      opis: "Krótkie ogłoszenie do powieszenia w sklepie lub na tablicy wsi.",
      presetId: "komunikat-tablica-ogloszen",
      uzupelnienia: {
        tytul: "Zebranie mieszkańców sołectwa",
        tresc:
          "Zapraszamy wszystkich mieszkańców na zebranie wiejskie.\n\nData i godzina: …\nMiejsce: świetlica wiejska\n\nPorządek obrad zostanie podany w kolejnym ogłoszeniu.",
        kontakt: podpis,
      },
    },
    {
      id: "wow-dzien-dziecka-swietlica",
      tag: "dzieci",
      tytul: "Dzień Dziecka w świetlicy",
      opis: "Kolorowy plakat z animacjami, warsztatami i poczęstunkiem.",
      presetId: "zaproszenie-dzien-dziecka-pismo",
      uzupelnienia: {
        tytul_wyd: "Dzień Dziecka — impreza w świetlicy",
        data_miejsce: "Data: 1 czerwca (lub najbliższa sobota)\nGodzina: od 15:00\nMiejsce: świetlica wiejska, " + (wies || "…"),
        opis: "Animacje · kącik plastyczny · konkursy z nagrodami · poczęstunek dla dzieci.",
        kontakt,
        podpis,
      },
    },
    {
      id: "wow-regulamin-swietlicy",
      tag: "swietlica",
      tytul: "Regulamin świetlicy — szybki start",
      opis: "Zawiadomienie urzędowe + gotowa karta regulaminu do wydruku.",
      presetId: "zawiadomienie-wprowadzenie-regulaminu",
      uzupelnienia: {
        obiekt: "świetlicy wiejskiej",
        podstawa: "Uchwała zebrania sołeckiego z dnia … — przyjęcie regulaminu korzystania ze świetlicy.",
        publikacja: "Pełny tekst dostępny u sołtysa oraz na tablicy ogłoszeń przy świetlicy.",
        kontakt: podpis,
      },
    },
    {
      id: "wow-konkurs-plastyczny",
      tag: "dzieci",
      tytul: "Konkurs plastyczny — ogłoszenie",
      opis: "Zaproszenie do konkursu + link do plakatu graficznego.",
      presetId: "zaproszenie-dzien-dziecka-pismo",
      uzupelnienia: {
        tytul_wyd: "Konkurs plastyczny „Moja wieś oczami dziecka”",
        data_miejsce: "Termin oddania prac: …\nWręczenie nagród: …\nMiejsce: szkoła / świetlica, " + (wies || "…"),
        opis: "Kategorie: 6–9 lat · 10–13 lat\nTechnika dowolna, format A4.\nNagrody wręczymy podczas festynu!",
        kontakt,
        podpis,
      },
    },
    {
      id: "wow-zebranie-tablica",
      tag: "zebranie",
      tytul: "Zebranie — plakat na tablicę",
      opis: "Wyraźne ogłoszenie z datą, godziną i porządkiem obrad.",
      presetId: "zaproszenie-zebranie",
      uzupelnienia: {
        porzadek:
          "1. Otwarcie zebrania\n2. Sprawozdanie sołtysa\n3. Fundusz sołecki — plan zadań\n4. Sprawy bieżące\n5. Sprawy różne",
        podpis,
      },
    },
    {
      id: "wow-fundusz-plakat",
      tag: "zebranie",
      tytul: "Fundusz sołecki — plakat planu",
      opis: "Graficzna lista zadań do powieszenia po zebraniu sołeckim.",
      presetId: "wniosek-fundusz-sołecki",
      uzupelnienia: {
        nazwa_zadania: "Plan zadań funduszu sołeckiego na rok …",
        kwota: "16 000,00",
        uzasadnienie:
          "Zadania zatwierdzone na zebraniu sołeckim — publikacja do wiadomości mieszkańców zgodnie z procedurą gminy.",
        harmonogram: "I–II kwartał: realizacja\nIII kwartał: rozliczenie",
        podpis,
      },
    },
    {
      id: "wow-11-listopada",
      tag: "sezon",
      tytul: "11 listopada — uroczystość",
      opis: "Patriotyczny plakat z programem mszy i koncertu.",
      presetId: "ogloszenie-wydarzenie-publiczne",
      uzupelnienia: {
        tytul_wyd: "Uroczystość z okazji Narodowego Święta Niepodległości",
        data_miejsce: "11 listopada\nGodzina: 10:00\nMiejsce: kościół / pomnik, " + (wies || "…"),
        opis: "Msza św. · złożenie kwiatów · koncert pieśni patriotycznych · wspólne spotkanie",
        kontakt,
      },
    },
  ];
}

export function zbudujLejekSponsora(opcje: OpcjeScenariuszyWow): KrokLejkaSponsora[] {
  const { podpis, kontakt, wnioskodawcaSolectwo } = ctx(opcje);
  const celSwietlica = "doposażenie świetlicy wiejskiej";

  return [
    {
      krok: 1,
      tytul: "Prośba",
      opis: "Pierwsze pismo z uzasadnieniem i korzyściami dla sponsora.",
      scenariusz: {
        id: "lejek-1-prosba",
        tytul: "",
        opis: "",
        presetId: "prosba-wsparcie-finansowe-firma",
        uzupelnienia: {
          adresat: "Do Zarządu / Właściciela\n[NAZWA FIRMY]\n[ADRES]",
          wnioskodawca: wnioskodawcaSolectwo,
          cel: celSwietlica,
          kwota: "3 000,00 PLN",
          uzasadnienie:
            "Celem projektu jest doposażenie świetlicy i zwiększenie dostępności zajęć dla dzieci, seniorów oraz spotkań integracyjnych mieszkańców. Inicjatywa realnie poprawi warunki życia społecznego w sołectwie.",
          korzysci:
            "Publiczne podziękowanie na stronie wsi i tablicy ogłoszeń, informacja o partnerstwie podczas wydarzenia, możliwość oznaczenia sponsora na materiałach promocyjnych.",
          kontakt,
          podpis,
        },
      },
    },
    {
      krok: 2,
      tytul: "Przypomnienie",
      opis: "Delikatne przypomnienie po pierwszej prośbie.",
      scenariusz: {
        id: "lejek-2-przypomnienie",
        tytul: "",
        opis: "",
        presetId: "przypomnienie-o-wsparcie-sponsora",
        uzupelnienia: {
          adresat: "Do Zarządu / Właściciela\n[NAZWA FIRMY]\n[ADRES]",
          cel: celSwietlica,
          data_pierwszej_prosby: "… (uzupełnij datę pierwszego pisma)",
          tresc:
            "Uprzejmie przypominam o wcześniejszej prośbie o wsparcie inicjatywy sołeckiej. Jeśli jest możliwość krótkiej odpowiedzi lub propozycji innej formy pomocy, będę wdzięczny/a. Pozostaję do dyspozycji.",
          kontakt,
          podpis,
        },
      },
    },
    {
      krok: 3,
      tytul: "Potwierdzenie wpływu",
      opis: "Notatka po otrzymaniu przelewu — do archiwum.",
      scenariusz: {
        id: "lejek-3-finanse",
        tytul: "",
        opis: "",
        presetId: "potwierdzenie-wplywu-srodkow-finansowych",
        uzupelnienia: {
          darczyca: "[NAZWA FIRMY / DARCZYŃCY]",
          odbiorca: wnioskodawcaSolectwo,
          kwota: "3 000,00",
          nr_operacji: "… (z wyciągu bankowego)",
          cel: `realizacja zadania: ${celSwietlica}`,
          uwagi: "Dokument ma charakter informacyjny — dopasuj do praktyki księgowej w sołectwie / gminie.",
          podpis,
        },
      },
    },
    {
      krok: 4,
      tytul: "Podziękowanie",
      opis: "Domknięcie współpracy z podziękowaniem i informacją o publikacji.",
      scenariusz: {
        id: "lejek-4-podziekowanie",
        tytul: "",
        opis: "",
        presetId: "podziekowanie-za-wsparcie",
        uzupelnienia: {
          adresat: "Do [NAZWA FIRMY / ORGANIZACJI]",
          projekt: celSwietlica,
          wsparcie:
            "Dziękujemy za przekazane wsparcie finansowe, które umożliwiło realizację zadania wskazanego przez mieszkańców.",
          efekt:
            "Dzięki wsparciu poprawiono warunki korzystania ze świetlicy i zwiększono dostępność wydarzeń społecznych dla mieszkańców.",
          publikacja: "strona sołectwa, tablica ogłoszeń i profil społecznościowy",
          podpis,
        },
      },
    },
  ];
}
