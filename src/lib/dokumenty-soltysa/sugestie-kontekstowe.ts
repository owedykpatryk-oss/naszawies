import type { PresetDokumentu } from "./typy";

export type SugestiaKontekstowa = {
  id: string;
  /** Krótki tekst na chip */
  etykieta: string;
  /** Wartość do wstawienia */
  wartosc: string;
  /** Id pola presetu — jeśli brak, UI może pokazać wybór pola lub wstawić do pierwszego sensownego */
  poleDocelowe: string;
  /** Jeśli pole ma już treść — dopisz zamiast zastąpić */
  preferujDopisanie?: boolean;
};

export type GrupaSugestii = {
  grupa: string;
  opis?: string;
  sugestie: SugestiaKontekstowa[];
};

function dzisDataPl(): string {
  return new Date().toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function dzisIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function jutroDataPl(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function zaDniDataPl(dni: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dni);
  return d.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function rok(): number {
  return new Date().getFullYear();
}

function maPole(preset: PresetDokumentu, id: string): boolean {
  return preset.pola.some((p) => p.id === id);
}

/**
 * Sugestie oparte o kontekst (bez zewnętrznego AI): daty, typowe miejsca, szkice obrad, odwołania do gminy.
 */
export function zbudujSugestieKontekstowe(
  preset: PresetDokumentu,
  wartosci: Record<string, string>,
  opcje: { domyslnaWies: string; domyslnaGmina: string; domyslnySoltysNazwa: string },
): GrupaSugestii[] {
  const gmina = (wartosci.gmina ?? opcje.domyslnaGmina ?? "").trim();
  const wies = (wartosci.wies ?? opcje.domyslnaWies ?? "").trim();
  const soltys = (wartosci.podpis ?? opcje.domyslnySoltysNazwa ?? "").trim();
  const grupy: GrupaSugestii[] = [];

  const daty: SugestiaKontekstowa[] = [];
  if (maPole(preset, "data")) {
    daty.push({
      id: "data-dzis-iso",
      etykieta: "Dzisiaj (ISO)",
      wartosc: dzisIso(),
      poleDocelowe: "data",
    });
  }
  if (maPole(preset, "data_godzina")) {
    daty.push({
      id: "dg-dzis-18",
      etykieta: `Dziś 18:00 (${dzisDataPl()})`,
      wartosc: `${dzisDataPl()}, godz. 18:00`,
      poleDocelowe: "data_godzina",
    });
    daty.push({
      id: "dg-jutro-18",
      etykieta: "Jutro 18:00",
      wartosc: `${jutroDataPl()}, godz. 18:00`,
      poleDocelowe: "data_godzina",
    });
  }
  if (maPole(preset, "data_zebrania")) {
    daty.push({
      id: "dz-dzis",
      etykieta: "Data: dziś (tekst)",
      wartosc: dzisDataPl(),
      poleDocelowe: "data_zebrania",
    });
  }
  if (daty.length) {
    grupy.push({
      grupa: "Daty i czas",
      opis: "Wstaw do pola daty lub „data i godzina” — dopasuj do uchwały zwołującej.",
      sugestie: daty,
    });
  }

  const miejsca: SugestiaKontekstowa[] = [];
  if (maPole(preset, "miejsce")) {
    miejsca.push(
      {
        id: "msc-sw",
        etykieta: "Świetlica wiejska",
        wartosc: wies ? `Świetlica wiejska w ${wies}` : "Świetlica wiejska",
        poleDocelowe: "miejsce",
      },
      {
        id: "msc-osp",
        etykieta: "Remiza OSP",
        wartosc: "Remiza OSP",
        poleDocelowe: "miejsce",
      },
      {
        id: "msc-ug",
        etykieta: "Sala w urzędzie gminy",
        wartosc: gmina ? `Sala konferencyjna Urzędu Miasta i Gminy w ${gminieDoMiejscownika(gmina)}` : "Sala konferencyjna Urzędu Gminy",
        poleDocelowe: "miejsce",
      },
    );
  }
  if (miejsca.length) {
    grupy.push({
      grupa: "Miejsce zebrania",
      sugestie: miejsca,
    });
  }

  const zebranie: SugestiaKontekstowa[] = [];
  if (maPole(preset, "porzadek")) {
    zebranie.push(
      {
        id: "porz-klasyczny",
        etykieta: "Porządek: klasyka",
        wartosc: `1. Otwarcie zebrania i stwierdzenie prawidłowości zwołania.\n2. Wybór przewodniczącego i protokolanta.\n3. Przyjęcie porządku obrad.\n4. Sprawy różne.\n5. Zamknięcie zebrania.`,
        poleDocelowe: "porzadek",
        preferujDopisanie: true,
      },
      {
        id: "porz-fs",
        etykieta: "Porządek + fundusz sołecki",
        wartosc: `1. Otwarcie zebrania.\n2. Informacja o stanie funduszu sołeckiego i planowanych zadaniach.\n3. Dyskusja i głosowanie nad wnioskami.\n4. Sprawy różne.\n5. Zamknięcie.`,
        poleDocelowe: "porzadek",
        preferujDopisanie: true,
      },
    );
  }
  if (maPole(preset, "uchwaly")) {
    zebranie.push({
      id: "uch-szkic",
      etykieta: "Szkic uchwały (1 zdanie)",
      wartosc: `Uchwała Nr …/${new Date().getFullYear()} z dnia ${dzisDataPl()} w sprawie …\n\n§ 1. Uchwala się …\n§ 2. Wykonanie uchwały powierza się …\n§ 3. Uchwała wchodzi w życie z dniem podjęcia.`,
      poleDocelowe: "uchwaly",
      preferujDopisanie: true,
    });
  }
  if (maPole(preset, "temat")) {
    zebranie.push({
      id: "temat-fs",
      etykieta: "Temat: fundusz sołecki",
      wartosc: `Fundusz sołecki na rok ${new Date().getFullYear()} — wnioski i głosowanie`,
      poleDocelowe: "temat",
    });
  }
  if (zebranie.length) {
    grupy.push({
      grupa: "Zebranie — treści",
      opis: "Szablony do dopasowania; skróć lub rozwiń przed drukiem.",
      sugestie: zebranie,
    });
  }

  const pisma: SugestiaKontekstowa[] = [];
  if (gmina && maPole(preset, "adresat")) {
    pisma.push({
      id: "adr-ug",
      etykieta: "Nagłówek adresata (szablon)",
      wartosc: `Wójt Gminy / Burmistrz Miasta i Gminy\n${gmina}\n— adres do uzupełnienia z BIP gminy —`,
      poleDocelowe: "adresat",
    });
  }
  if (pisma.length) {
    grupy.push({
      grupa: "Pisma urzędowe",
      opis: "Nagłówek jednostki — zawsze zweryfikuj w BIP.",
      sugestie: pisma,
    });
  }

  const podpis: SugestiaKontekstowa[] = [];
  if (maPole(preset, "podpis")) {
    if (soltys) {
      podpis.push({
        id: "pod-soltys",
        etykieta: "Podpis z profilu",
        wartosc: soltys.includes("Sołtys") || soltys.includes("sołtys") ? soltys : `Sołtys sołectwa — ${soltys}`,
        poleDocelowe: "podpis",
      });
    } else if (wies) {
      podpis.push({
        id: "pod-soltys-tylko-wies",
        etykieta: "Sołtys (szablon)",
        wartosc: `Sołtys sołectwa ${wies}`,
        poleDocelowe: "podpis",
      });
    }
  }
  if (podpis.length) {
    grupy.push({
      grupa: "Podpis",
      opis: opcje.domyslnySoltysNazwa.trim() ? "Wykorzystuje dane z profilu naszawies.pl." : "Uzupełnij profil, by podpowiadać imię.",
      sugestie: podpis,
    });
  }

  const fundusz: SugestiaKontekstowa[] = [];
  if (preset.id === "wniosek-fundusz-sołecki") {
    if (maPole(preset, "wnioskodawca") && wies) {
      fundusz.push({
        id: "fs-wnioskodawca",
        etykieta: "Wnioskodawca: sołectwo",
        wartosc: gmina ? `Sołectwo ${wies}, gmina ${gmina}` : `Sołectwo ${wies}`,
        poleDocelowe: "wnioskodawca",
      });
    }
    if (maPole(preset, "uzasadnienie")) {
      fundusz.push({
        id: "fs-uzasadnienie",
        etykieta: "Uzasadnienie (szkic)",
        wartosc: `Zadanie służy bezpośrednim potrzebom mieszkańców sołectwa${wies ? ` ${wies}` : ""} i realizacji zadań wskazanych w uchwale o funduszu sołeckim. Wnioskowana kwota pozwoli na zlecenie wykonawstwa / zakup zgodnie z kosztorysem (załącznik do uzupełnienia).`,
        poleDocelowe: "uzasadnienie",
        preferujDopisanie: true,
      });
    }
    if (maPole(preset, "harmonogram")) {
      fundusz.push({
        id: "fs-harmonogram",
        etykieta: "Harmonogram (szkic)",
        wartosc: `Realizacja: od maja do września ${rok()} r.\nRozliczenie i protokół odbioru: do 31 października ${rok()} r.`,
        poleDocelowe: "harmonogram",
        preferujDopisanie: true,
      });
    }
    if (maPole(preset, "kwota")) {
      fundusz.push({
        id: "fs-kwota-przyklad",
        etykieta: "Kwota przykładowa",
        wartosc: "5 000,00",
        poleDocelowe: "kwota",
      });
    }
  }
  if (fundusz.length) {
    grupy.push({
      grupa: "Fundusz sołecki — treści",
      opis: "Szkice do uchwały gminy i kosztorysu.",
      sugestie: fundusz,
    });
  }

  const gminaPisma: SugestiaKontekstowa[] = [];
  if (maPole(preset, "dotyczy") && wies) {
    gminaPisma.push({
      id: "dot-wies",
      etykieta: "Dotyczy: sprawy sołeckiej",
      wartosc: `Sprawy sołectwa ${wies}${gmina ? ` (gmina ${gmina})` : ""}.`,
      poleDocelowe: "dotyczy",
    });
  }
  if (maPole(preset, "tresc") && preset.id === "pismo-do-gminy") {
    gminaPisma.push(
      {
        id: "pis-wstep",
        etykieta: "Wstęp formalny",
        wartosc: `Zwracam się z uprzejmą prośbą o rozpatrzenie poniższej sprawy w trybie zwyczajnym, z zachowaniem terminów wynikających z przepisów prawa lub uchwał Rady Gminy${gmina ? ` ${gminieDoMiejscownika(gmina)}` : ""}.`,
        poleDocelowe: "tresc",
        preferujDopisanie: true,
      },
      {
        id: "pis-koniec",
        etykieta: "Prośba o odpowiedź",
        wartosc: `Proszę o pisemną odpowiedź na adres sołectwa${wies ? ` ${wies}` : ""} lub na e-mail podany w stopce panelu naszawies.pl.`,
        poleDocelowe: "tresc",
        preferujDopisanie: true,
      },
    );
  }
  if (gminaPisma.length) {
    grupy.push({
      grupa: "Pismo do gminy",
      sugestie: gminaPisma,
    });
  }

  const terminyFs: SugestiaKontekstowa[] = [];
  if (preset.id === "zawiadomienie-fundusz-termin") {
    if (maPole(preset, "termin_od")) {
      terminyFs.push({
        id: "zf-od",
        etykieta: "Od: dziś",
        wartosc: dzisDataPl(),
        poleDocelowe: "termin_od",
      });
    }
    if (maPole(preset, "termin_do")) {
      terminyFs.push({
        id: "zf-do-14",
        etykieta: "Do: +14 dni",
        wartosc: zaDniDataPl(14),
        poleDocelowe: "termin_do",
      });
    }
    if (maPole(preset, "dodatkowe")) {
      terminyFs.push({
        id: "zf-dod",
        etykieta: "Info o składaniu",
        wartosc: `Wnioski składa się osobiście lub listownie w miejscu wskazanym poniżej. Wzór wniosku dostępny jest w BIP gminy${gmina ? ` ${gminieDoMiejscownika(gmina)}` : ""}.`,
        poleDocelowe: "dodatkowe",
        preferujDopisanie: true,
      });
    }
  }
  if (terminyFs.length) {
    grupy.push({
      grupa: "Terminy (fundusz)",
      sugestie: terminyFs,
    });
  }

  const protokol: SugestiaKontekstowa[] = [];
  if (preset.id === "protokol-zebrania") {
    if (maPole(preset, "przewodniczacy")) {
      protokol.push({
        id: "prz-soltys",
        etykieta: "Przewodniczący: sołtys",
        wartosc: soltys || (wies ? `Sołtys sołectwa ${wies}` : "Sołtys sołectwa"),
        poleDocelowe: "przewodniczacy",
      });
    }
    if (maPole(preset, "sekretarz")) {
      protokol.push({
        id: "sek-rada",
        etykieta: "Protokolant (szablon)",
        wartosc: "Członek rady sołeckiej — do wyboru na zebraniu",
        poleDocelowe: "sekretarz",
      });
    }
    if (maPole(preset, "frekwencja")) {
      protokol.push({
        id: "frek",
        etykieta: "Frekwencja (szablon)",
        wartosc: "Obecnych uprawnionych do głosowania: … osób; mandaty pełnomocnictw: …",
        poleDocelowe: "frekwencja",
      });
    }
  }
  if (protokol.length) {
    grupy.push({
      grupa: "Protokół zebrania",
      sugestie: protokol,
    });
  }

  const ip: SugestiaKontekstowa[] = [];
  if (preset.id === "wniosek-informacja-publiczna") {
    if (maPole(preset, "zakres")) {
      ip.push({
        id: "ip-zakres",
        etykieta: "Zakres (przykład)",
        wartosc: `1) Kopie uchwał Rady Gminy dotyczących funduszu sołeckiego na rok ${rok()} dla sołectwa${wies ? ` ${wies}` : " …"}.\n2) Informacja o liczbie złożonych wniosków i kwotach przyznanych w poprzednim roku budżetowym.`,
        poleDocelowe: "zakres",
        preferujDopisanie: true,
      });
    }
    if (maPole(preset, "formaa")) {
      ip.push({
        id: "ip-forma",
        etykieta: "Forma: e-mail / PDF",
        wartosc: "Elektroniczna kopia dokumentów (PDF) na adres e-mail wnioskodawcy podany we wniosku.",
        poleDocelowe: "formaa",
      });
    }
  }
  if (ip.length) {
    grupy.push({
      grupa: "Informacja publiczna",
      sugestie: ip,
    });
  }

  const potw: SugestiaKontekstowa[] = [];
  if (preset.id === "potwierdzenie-przyjecia-pisma" && maPole(preset, "dalsze_kroki")) {
    potw.push({
      id: "potw-krok",
      etykieta: "Dalsze kroki (szablon)",
      wartosc: `Pismo zostanie rozpatrzone w ustawowym terminie; odpowiedź zostanie przekazana listownie lub na adres e-mail, jeśli został podany. W razie pytań proszę o kontakt z sołtysem${wies ? ` sołectwa ${wies}` : ""}.`,
      poleDocelowe: "dalsze_kroki",
      preferujDopisanie: true,
    });
  }
  if (potw.length) {
    grupy.push({
      grupa: "Potwierdzenie wpływu",
      sugestie: potw,
    });
  }

  const oferta: SugestiaKontekstowa[] = [];
  if (preset.id === "zapytanie-ofertowe-proste" && maPole(preset, "przedmiot")) {
    oferta.push({
      id: "zo-przed",
      etykieta: "Przedmiot: remont świetlicy",
      wartosc: `Wykonanie robót remontowych / konserwatorskich w budynku świetlicy wiejskiej${wies ? ` w ${wies}` : ""} — zakres wg załączonego opisu technicznego (do przygotowania).`,
      poleDocelowe: "przedmiot",
      preferujDopisanie: true,
    });
  }
  if (oferta.length) {
    grupy.push({
      grupa: "Zapytanie ofertowe",
      sugestie: oferta,
    });
  }

  const swietlica: SugestiaKontekstowa[] = [];
  if (preset.id === "protokol-sali-swietlica" && maPole(preset, "stan")) {
    swietlica.push({
      id: "prot-sala-ok",
      etykieta: "Stan: bez zastrzeżeń",
      wartosc:
        "Stwierdzono, że pomieszczenia i wyposażenie pozostają w stanie zgodnym z protokołem wydania, bez uszkodzeń i braków widocznych gołym okiem. Strony nie wnoszą zastrzeżeń.",
      poleDocelowe: "stan",
      preferujDopisanie: true,
    });
  }
  if (swietlica.length) {
    grupy.push({
      grupa: "Świetlica — protokół",
      sugestie: swietlica,
    });
  }

  const fundraising: SugestiaKontekstowa[] = [];
  if (preset.id === "prosba-wsparcie-finansowe-firma") {
    if (maPole(preset, "wnioskodawca") && wies) {
      fundraising.push({
        id: "fund-wnioskodawca",
        etykieta: "Wnioskodawca: sołectwo",
        wartosc: gmina ? `Sołectwo ${wies}, gmina ${gmina}` : `Sołectwo ${wies}`,
        poleDocelowe: "wnioskodawca",
      });
    }
    if (maPole(preset, "kwota")) {
      fundraising.push({
        id: "fund-kwota-przyklad",
        etykieta: "Kwota: 3 000 zł",
        wartosc: "3 000,00 PLN",
        poleDocelowe: "kwota",
      });
    }
    if (maPole(preset, "korzysci")) {
      fundraising.push({
        id: "fund-korzysci",
        etykieta: "Pakiet korzyści sponsora",
        wartosc:
          "1) Publiczne podziękowanie na stronie sołectwa i profilu społecznościowym.\n2) Umieszczenie logo sponsora na plakacie wydarzenia.\n3) Informacja o partnerstwie podczas wydarzenia i w sprawozdaniu końcowym.",
        poleDocelowe: "korzysci",
        preferujDopisanie: true,
      });
    }
    if (maPole(preset, "uzasadnienie")) {
      fundraising.push({
        id: "fund-uzasadnienie",
        etykieta: "Uzasadnienie (gotowiec)",
        wartosc:
          "Planowana inicjatywa odpowiada na realne potrzeby mieszkańców, w tym rodzin z dziećmi i seniorów. Realizacja zadania zwiększy dostępność infrastruktury lokalnej oraz aktywność społeczną w sołectwie.",
        poleDocelowe: "uzasadnienie",
        preferujDopisanie: true,
      });
    }
  }
  if (preset.id === "prosba-wsparcie-rzeczowe-uslugowe") {
    if (maPole(preset, "zakres")) {
      fundraising.push({
        id: "fund-rzeczowe-zakres",
        etykieta: "Zakres: materiały + robocizna",
        wartosc:
          "1) Materiały budowlane / wykończeniowe do odświeżenia świetlicy.\n2) Transport materiałów na miejsce.\n3) Wsparcie robocizną (minimum 1 dzień prac).",
        poleDocelowe: "zakres",
        preferujDopisanie: true,
      });
    }
    if (maPole(preset, "rozliczenie")) {
      fundraising.push({
        id: "fund-rzeczowe-rozliczenie",
        etykieta: "Rozliczenie przekazania",
        wartosc:
          "Przekazanie wsparcia zostanie udokumentowane protokołem odbioru darowizny rzeczowej. Po zakończeniu prac przygotujemy krótkie podsumowanie efektów dla darczyńcy.",
        poleDocelowe: "rozliczenie",
        preferujDopisanie: true,
      });
    }
  }
  if (preset.id === "podziekowanie-za-wsparcie") {
    if (maPole(preset, "wsparcie")) {
      fundraising.push({
        id: "fund-podz-wsparcie",
        etykieta: "Opis wsparcia (szablon)",
        wartosc:
          "Dziękujemy za przekazane środki / materiały, które zostały przeznaczone na realizację lokalnego zadania wskazanego przez mieszkańców podczas zebrania wiejskiego.",
        poleDocelowe: "wsparcie",
        preferujDopisanie: true,
      });
    }
    if (maPole(preset, "efekt")) {
      fundraising.push({
        id: "fund-podz-efekt",
        etykieta: "Efekt dla mieszkańców",
        wartosc:
          "Dzięki wsparciu udało się poprawić warunki korzystania z infrastruktury wiejskiej i zwiększyć dostępność działań społecznych dla wszystkich grup mieszkańców.",
        poleDocelowe: "efekt",
        preferujDopisanie: true,
      });
    }
    if (maPole(preset, "publikacja")) {
      fundraising.push({
        id: "fund-podz-publikacja",
        etykieta: "Publikacja: strona + tablica",
        wartosc: "strona sołectwa, tablica ogłoszeń i profil społecznościowy",
        poleDocelowe: "publikacja",
      });
    }
  }
  if (preset.id === "potwierdzenie-darowizny-rzeczowej") {
    if (maPole(preset, "odbiorca") && wies) {
      fundraising.push({
        id: "fund-potw-odbiorca",
        etykieta: "Odbiorca: sołectwo",
        wartosc: gmina ? `Sołectwo ${wies}, gmina ${gmina}` : `Sołectwo ${wies}`,
        poleDocelowe: "odbiorca",
      });
    }
    if (maPole(preset, "cel")) {
      fundraising.push({
        id: "fund-potw-cel",
        etykieta: "Cel: doposażenie świetlicy",
        wartosc: "doposażenie i bieżące utrzymanie świetlicy wiejskiej",
        poleDocelowe: "cel",
      });
    }
  }
  if (preset.id === "przypomnienie-o-wsparcie-sponsora") {
    if (maPole(preset, "cel")) {
      fundraising.push({
        id: "fund-przyp-cel",
        etykieta: "Cel: świetlica",
        wartosc: "doposażenie świetlicy wiejskiej",
        poleDocelowe: "cel",
      });
    }
    if (maPole(preset, "data_pierwszej_prosby")) {
      fundraising.push({
        id: "fund-przyp-data",
        etykieta: "Data pierwszej prośby: dziś",
        wartosc: dzisDataPl(),
        poleDocelowe: "data_pierwszej_prosby",
      });
    }
    if (maPole(preset, "tresc")) {
      fundraising.push({
        id: "fund-przyp-tresc",
        etykieta: "Przypomnienie (krótko)",
        wartosc:
          "Uprzejmie przypominam o wcześniejszej prośbie o wsparcie. Jeśli jest możliwość krótkiej odpowiedzi lub propozycji innej formy pomocy, będę wdzięczny/a. Pozostaję do dyspozycji.",
        poleDocelowe: "tresc",
        preferujDopisanie: true,
      });
    }
  }
  if (preset.id === "potwierdzenie-wplywu-srodkow-finansowych") {
    if (maPole(preset, "odbiorca") && wies) {
      fundraising.push({
        id: "fund-fin-odbiorca",
        etykieta: "Odbiorca: sołectwo",
        wartosc: gmina ? `Sołectwo ${wies}, gmina ${gmina}` : `Sołectwo ${wies}`,
        poleDocelowe: "odbiorca",
      });
    }
    if (maPole(preset, "data_wplywu")) {
      fundraising.push({
        id: "fund-fin-data",
        etykieta: "Data wpływu: dziś (ISO)",
        wartosc: dzisIso(),
        poleDocelowe: "data_wplywu",
      });
    }
    if (maPole(preset, "kwota")) {
      fundraising.push({
        id: "fund-fin-kwota",
        etykieta: "Kwota przykładowa",
        wartosc: "3 000,00",
        poleDocelowe: "kwota",
      });
    }
    if (maPole(preset, "cel")) {
      fundraising.push({
        id: "fund-fin-cel",
        etykieta: "Przeznaczenie",
        wartosc: "realizacja zadania wskazanego w prośbie o wsparcie (świetlica / inicjatywa sołecka)",
        poleDocelowe: "cel",
      });
    }
  }
  if (fundraising.length) {
    grupy.push({
      grupa: "Fundraising i sponsorzy",
      opis: "Gotowe fragmenty pism do firm, organizacji i darczyńców.",
      sugestie: fundraising,
    });
  }

  const organizacje: SugestiaKontekstowa[] = [];
  if (preset.id === "plan-pracy-kgw-roczny") {
    if (maPole(preset, "nazwa_kgw")) {
      organizacje.push({
        id: "kgw-nazwa",
        etykieta: "Nazwa KGW (szablon)",
        wartosc: wies ? `KGW ${wies}` : "KGW [NAZWA KOŁA]",
        poleDocelowe: "nazwa_kgw",
      });
    }
    if (maPole(preset, "wies") && wies) {
      organizacje.push({
        id: "kgw-wies",
        etykieta: "Wieś z profilu",
        wartosc: wies,
        poleDocelowe: "wies",
      });
    }
    if (maPole(preset, "harmonogram")) {
      organizacje.push({
        id: "kgw-harmonogram",
        etykieta: "Harmonogram: 4 kwartały",
        wartosc:
          "I kwartał: spotkanie planistyczne i warsztat kulinarny.\nII kwartał: wydarzenie rodzinne / piknik.\nIII kwartał: udział w dożynkach i promocja lokalnych produktów.\nIV kwartał: kiermasz świąteczny i podsumowanie działań.",
        poleDocelowe: "harmonogram",
        preferujDopisanie: true,
      });
    }
  }

  if (preset.id === "wniosek-kgw-mikrodotacja") {
    if (maPole(preset, "kwota")) {
      organizacje.push({
        id: "kgw-kwota",
        etykieta: "Kwota: 4 500 zł",
        wartosc: "4 500,00 PLN",
        poleDocelowe: "kwota",
      });
    }
    if (maPole(preset, "rezultaty")) {
      organizacje.push({
        id: "kgw-rezultaty",
        etykieta: "Rezultaty (gotowiec)",
        wartosc:
          "Co najmniej 4 działania otwarte dla mieszkańców, aktywizacja min. 40 uczestników, trwałe materiały i scenariusze działań do kolejnych edycji.",
        poleDocelowe: "rezultaty",
        preferujDopisanie: true,
      });
    }
  }

  if (preset.id === "komunikat-osp-bezpieczenstwo") {
    if (maPole(preset, "zalecenia")) {
      organizacje.push({
        id: "osp-zalecenia",
        etykieta: "Zalecenia: bezpieczeństwo",
        wartosc:
          "1) Nie zbliżaj się do strefy działań służb.\n2) Nie blokuj dróg dojazdowych i hydrantów.\n3) Zgłaszaj sytuacje zagrożenia pod numer 112.",
        poleDocelowe: "zalecenia",
        preferujDopisanie: true,
      });
    }
  }

  if (organizacje.length) {
    grupy.push({
      grupa: "KGW / OSP i organizacje",
      opis: "Szybkie fragmenty pod dokumenty organizacyjne i komunikaty.",
      sugestie: organizacje,
    });
  }

  return grupy.filter((g) => g.sugestie.length > 0);
}

/** Prosta forma miejscownika dla fraz typu „w Kcyni” / „w gminie X” — heurystyka, nie pełna odmiana. */
function gminieDoMiejscownika(g: string): string {
  const t = g.trim();
  if (!t) return t;
  const lower = t.toLowerCase();
  if (lower.startsWith("gmina ")) return t.slice(6).trim() || t;
  return t;
}
