import type { KontekstGrafiki, SzablonGrafiki, WartosciPolGrafiki } from "./typy";
import { SZABLONY_SEZONOWE } from "./szablony-sezonowe";
import { SZABLONY_GRUP_WIEJSKICH } from "./szablony-grupy-wiejskie";
import { SZABLONY_DWujezyczne } from "./szablony-dwujezyczne";
import { SZABLONY_DYPLOMY_ROZSZERZONE } from "./szablony-dyplomy-rozszerzone";
import { SZABLONY_SWIETLICA_DZIECI } from "./szablony-swietlica-dzieci";
import { SZABLONY_SOLECTWO_ROZSZERZONE } from "./szablony-solectwo-rozszerzone";

const polaZaproszenie = [
  { id: "naglowek", etykieta: "Nagłówek", typ: "text" as const, domysl: "Serdecznie zapraszamy" },
  { id: "tytul", etykieta: "Tytuł wydarzenia", typ: "text" as const, domysl: "Na uroczystość wiejską" },
  { id: "opis", etykieta: "Opis / szczegóły", typ: "textarea" as const, domysl: "Spotkamy się wspólnie, aby świętować razem jako społeczność." },
  { id: "data", etykieta: "Data", typ: "date" as const, domysl: "" },
  { id: "godzina", etykieta: "Godzina", typ: "time" as const, domysl: "16:00" },
  { id: "miejsce", etykieta: "Miejsce", typ: "text" as const, domysl: "Świetlica wiejska, {{wies}}" },
  { id: "organizator", etykieta: "Organizator", typ: "text" as const, domysl: "Sołectwo {{wies}}" },
  { id: "kontakt", etykieta: "Kontakt (tel. / e-mail)", typ: "text" as const, domysl: "tel. …" },
];

export const SZABLONY_GRAFIKI: SzablonGrafiki[] = [
  {
    id: "zaproszenie-impreza-wies",
    kategoria: "zaproszenia",
    tytul: "Zaproszenie na imprezę wiejską",
    opis: "Kolorowe zaproszenie na festyn, dożynki lub piknik.",
    layout: "zaproszenie-nowoczesne",
    format: "a5",
    orientacja: "pion",
    pola: polaZaproszenie,
    domyslnyMotyw: "zielony-wies",
    dostep: "wszyscy",
    tagi: ["impreza", "festyn", "dożynki"],
  },
  {
    id: "zaproszenie-zebranie",
    kategoria: "zaproszenia",
    tytul: "Zaproszenie na zebranie wiejskie",
    opis: "Oficjalne zaproszenie mieszkańców na zebranie sołectwa.",
    layout: "zaproszenie-eleganckie",
    format: "a4",
    orientacja: "pion",
    pola: [
      { id: "naglowek", etykieta: "Nagłówek", typ: "text", domysl: "Zaproszenie" },
      { id: "tytul", etykieta: "Tytuł", typ: "text", domysl: "Zebranie wiejskie sołectwa {{wies}}" },
      { id: "opis", etykieta: "Porządek obrad / informacje", typ: "textarea", domysl: "1. Otwarcie zebrania\n2. Sprawy bieżące\n3. Sprawy różne\n4. Zakończenie" },
      { id: "data", etykieta: "Data", typ: "date", domysl: "" },
      { id: "godzina", etykieta: "Godzina", typ: "time", domysl: "18:00" },
      { id: "miejsce", etykieta: "Miejsce", typ: "text", domysl: "Świetlica, {{wies}}" },
      { id: "organizator", etykieta: "Zaprasza", typ: "text", domysl: "Sołtys sołectwa {{wies}}" },
      { id: "kontakt", etykieta: "Kontakt", typ: "text", domysl: "tel. …" },
    ],
    domyslnyMotyw: "klasyczny-bialy",
    dostep: "soltys",
    tagi: ["zebranie", "sołectwo"],
  },
  {
    id: "zaproszenie-urodziny",
    kategoria: "zaproszenia",
    tytul: "Zaproszenie urodzinowe",
    opis: "Na urodziny w świetlicy lub domu — osiemnastkę, jubileusz.",
    layout: "zaproszenie-rustykalne",
    format: "a5",
    orientacja: "pion",
    pola: [
      { id: "naglowek", etykieta: "Nagłówek", typ: "text", domysl: "Zapraszamy na urodziny!" },
      { id: "tytul", etykieta: "Imię solenizanta / okazja", typ: "text", domysl: "…" },
      { id: "opis", etykieta: "Dodatkowe info", typ: "textarea", domysl: "Będzie tort, muzyka i dobra zabawa. Prosimy o potwierdzenie obecności." },
      { id: "data", etykieta: "Data", typ: "date", domysl: "" },
      { id: "godzina", etykieta: "Godzina", typ: "time", domysl: "17:00" },
      { id: "miejsce", etykieta: "Miejsce", typ: "text", domysl: "Świetlica wiejska" },
      { id: "organizator", etykieta: "Organizator", typ: "text", domysl: "Rodzina …" },
      { id: "kontakt", etykieta: "RSVP / kontakt", typ: "text", domysl: "tel. …" },
    ],
    domyslnyMotyw: "fioletowy-festyn",
    dostep: "wszyscy",
    tagi: ["urodziny", "impreza"],
  },
  {
    id: "zaproszenie-wesele-sala",
    kategoria: "zaproszenia",
    tytul: "Zaproszenie na wesele / uroczystość",
    opis: "Eleganckie zaproszenie na wesele lub uroczystość rodzinną w sali wiejskiej.",
    layout: "zaproszenie-eleganckie",
    format: "a5",
    orientacja: "pion",
    pola: [
      { id: "naglowek", etykieta: "Nagłówek", typ: "text", domysl: "Z radością zapraszamy" },
      { id: "tytul", etykieta: "Para młoda / okazja", typ: "text", domysl: "… & …" },
      { id: "opis", etykieta: "Tekst zaproszenia", typ: "textarea", domysl: "Na uroczystość zaślubin, która odbędzie się w naszej wspólnej sali." },
      { id: "data", etykieta: "Data", typ: "date", domysl: "" },
      { id: "godzina", etykieta: "Godzina", typ: "time", domysl: "15:00" },
      { id: "miejsce", etykieta: "Miejsce", typ: "text", domysl: "Sala weselna / świetlica, {{wies}}" },
      { id: "organizator", etykieta: "Zapraszają", typ: "text", domysl: "…" },
      { id: "kontakt", etykieta: "Kontakt", typ: "text", domysl: "tel. …" },
    ],
    domyslnyMotyw: "elegancki-zloty",
    dostep: "wszyscy",
    tagi: ["wesele", "świetlica"],
  },
  {
    id: "zaproszenie-kgw-spotkanie",
    kategoria: "zaproszenia",
    tytul: "Zaproszenie KGW",
    opis: "Spotkanie Koła Gospodyń Wiejskich, warsztaty, kiermasz.",
    layout: "zaproszenie-nowoczesne",
    format: "a5",
    orientacja: "pion",
    pola: [
      { id: "naglowek", etykieta: "Nagłówek", typ: "text", domysl: "Koło Gospodyń Wiejskich zaprasza" },
      { id: "tytul", etykieta: "Nazwa wydarzenia", typ: "text", domysl: "Spotkanie KGW" },
      { id: "opis", etykieta: "Program / opis", typ: "textarea", domysl: "Wspólne gotowanie, dzielenie się przepisami i planowanie kiermaszu." },
      { id: "data", etykieta: "Data", typ: "date", domysl: "" },
      { id: "godzina", etykieta: "Godzina", typ: "time", domysl: "17:30" },
      { id: "miejsce", etykieta: "Miejsce", typ: "text", domysl: "{{wies}}" },
      { id: "organizator", etykieta: "Organizator", typ: "text", domysl: "KGW {{wies}}" },
      { id: "kontakt", etykieta: "Kontakt", typ: "text", domysl: "tel. …" },
    ],
    domyslnyMotyw: "kgw-rozowy",
    dostep: "kgw",
    tagi: ["KGW", "warsztaty"],
  },
  {
    id: "zaproszenie-osp",
    kategoria: "zaproszenia",
    tytul: "Zaproszenie OSP",
    opis: "Uroczystość strażacka, festyn charytatywny, msza za śp. strażaków.",
    layout: "zaproszenie-eleganckie",
    format: "a4",
    orientacja: "pion",
    pola: [
      { id: "naglowek", etykieta: "Nagłówek", typ: "text", domysl: "Ochotnicza Straż Pożarna zaprasza" },
      { id: "tytul", etykieta: "Nazwa uroczystości", typ: "text", domysl: "Dzień Strażaka" },
      { id: "opis", etykieta: "Program", typ: "textarea", domysl: "Msza św., parade, poczęstunek i zabawa dla dzieci." },
      { id: "data", etykieta: "Data", typ: "date", domysl: "" },
      { id: "godzina", etykieta: "Godzina", typ: "time", domysl: "10:00" },
      { id: "miejsce", etykieta: "Miejsce", typ: "text", domysl: "Remiza OSP, {{wies}}" },
      { id: "organizator", etykieta: "Organizator", typ: "text", domysl: "OSP {{wies}}" },
      { id: "kontakt", etykieta: "Kontakt", typ: "text", domysl: "tel. …" },
    ],
    domyslnyMotyw: "osp-czerwony",
    dostep: "osp",
    tagi: ["OSP", "straż"],
  },
  {
    id: "dyplom-kgw-uczestnictwo",
    kategoria: "dyplomy",
    tytul: "Dyplom uczestnictwa KGW",
    opis: "Za udział w warsztatach, kiermaszu lub projekcie KGW.",
    layout: "dyplom-ozdobny",
    format: "a4",
    orientacja: "poziom",
    pola: [
      { id: "naglowek", etykieta: "Nagłówek", typ: "text", domysl: "Dyplom uczestnictwa" },
      { id: "tytul", etykieta: "Imię i nazwisko", typ: "text", domysl: "…" },
      { id: "opis", etykieta: "Uzasadnienie / za co", typ: "textarea", domysl: "Za aktywny udział w działalności Koła Gospodyń Wiejskich oraz współorganizację wydarzeń lokalnych." },
      { id: "data", etykieta: "Data wręczenia", typ: "date", domysl: "" },
      { id: "miejsce", etykieta: "Miejsce wręczenia", typ: "text", domysl: "{{wies}}" },
      { id: "organizator", etykieta: "W imieniu", typ: "text", domysl: "KGW {{wies}}" },
      { id: "podpis1", etykieta: "Podpis 1 (funkcja + nazwisko)", typ: "text", domysl: "Przewodnicząca KGW\n…" },
      { id: "podpis2", etykieta: "Podpis 2 (opcjonalnie)", typ: "text", domysl: "Sołtys\n…" },
      { id: "podpis_cyfrowy", etykieta: "Podpis elektroniczny (imię i nazwisko)", typ: "text", domysl: "" },
    ],
    domyslnyMotyw: "kgw-rozowy",
    dostep: "kgw",
    tagi: ["dyplom", "KGW"],
  },
  {
    id: "dyplom-osp-zaslugi",
    kategoria: "dyplomy",
    tytul: "Dyplom za zasługi OSP",
    opis: "Podziękowanie dla strażaka lub współpracownika.",
    layout: "dyplom-medal",
    format: "a4",
    orientacja: "poziom",
    pola: [
      { id: "naglowek", etykieta: "Nagłówek", typ: "text", domysl: "Dyplom uznania" },
      { id: "tytul", etykieta: "Imię i nazwisko", typ: "text", domysl: "…" },
      { id: "opis", etykieta: "Treść wyróżnienia", typ: "textarea", domysl: "Za wieloletnią służbę w Ochotniczej Straży Pożarnej oraz zaangażowanie w ochronę mienia i życia mieszkańców." },
      { id: "data", etykieta: "Data", typ: "date", domysl: "" },
      { id: "miejsce", etykieta: "Miejsce", typ: "text", domysl: "{{wies}}" },
      { id: "organizator", etykieta: "Nadaje", typ: "text", domysl: "OSP {{wies}}" },
      { id: "podpis1", etykieta: "Podpis — naczelnik", typ: "text", domysl: "Naczelnik OSP\n…" },
      { id: "podpis2", etykieta: "Podpis — sołtys", typ: "text", domysl: "Sołtys\n…" },
      { id: "podpis_cyfrowy", etykieta: "Podpis elektroniczny", typ: "text", domysl: "" },
    ],
    domyslnyMotyw: "osp-czerwony",
    dostep: "osp",
    tagi: ["dyplom", "OSP"],
  },
  {
    id: "dyplom-dziecko-konkurs",
    kategoria: "dyplomy",
    tytul: "Dyplom dla dziecka / uczestnika",
    opis: "Konkurs plastyczny, święto niepodległości, mikolajki w szkole.",
    layout: "dyplom-ozdobny",
    format: "a4",
    orientacja: "poziom",
    pola: [
      { id: "naglowek", etykieta: "Nagłówek", typ: "text", domysl: "Dyplom" },
      { id: "tytul", etykieta: "Imię i nazwisko", typ: "text", domysl: "…" },
      { id: "opis", etykieta: "Za co / jaki konkurs", typ: "textarea", domysl: "Za udział w konkursie plastycznym „Moja wieś oczami dziecka”." },
      { id: "data", etykieta: "Data", typ: "date", domysl: "" },
      { id: "miejsce", etykieta: "Miejsce", typ: "text", domysl: "{{wies}}" },
      { id: "organizator", etykieta: "Organizator", typ: "text", domysl: "Sołectwo {{wies}}" },
      { id: "podpis1", etykieta: "Podpis", typ: "text", domysl: "Sołtys\n…" },
      { id: "podpis2", etykieta: "Podpis 2", typ: "text", domysl: "" },
      { id: "podpis_cyfrowy", etykieta: "Podpis elektroniczny", typ: "text", domysl: "" },
    ],
    domyslnyMotyw: "turkusowy-letni",
    dostep: "wszyscy",
    tagi: ["dyplom", "konkurs", "dzieci"],
  },
  {
    id: "plakat-wydarzenie",
    kategoria: "plakaty",
    tytul: "Plakat wydarzenia",
    opis: "Duży plakat na tablicę ogłoszeń — festyn, koncert, kiermasz.",
    layout: "plakat",
    format: "a4",
    orientacja: "pion",
    pola: [
      { id: "naglowek", etykieta: "Górny napis", typ: "text", domysl: "{{wies}} zaprasza!" },
      { id: "tytul", etykieta: "Nazwa wydarzenia", typ: "text", domysl: "Festyn wiejski" },
      { id: "opis", etykieta: "Program / atrakcje", typ: "textarea", domysl: "• Stoiska z jedzeniem\n• Koncert zespołu\n• Zabawy dla dzieci\n• Losowanie nagród" },
      { id: "data", etykieta: "Data", typ: "date", domysl: "" },
      { id: "godzina", etykieta: "Godzina", typ: "time", domysl: "14:00" },
      { id: "miejsce", etykieta: "Miejsce", typ: "text", domysl: "Plac przy świetlicy, {{wies}}" },
      { id: "organizator", etykieta: "Organizator", typ: "text", domysl: "Sołectwo {{wies}}" },
      { id: "kontakt", etykieta: "Kontakt / FB", typ: "text", domysl: "tel. …" },
    ],
    domyslnyMotyw: "zielony-wies",
    dostep: "soltys",
    tagi: ["plakat", "festyn"],
  },
  {
    id: "plakat-sprzatanie",
    kategoria: "plakaty",
    tytul: "Plakat akcji społecznej",
    opis: "Sprzątanie wsi, sadzenie drzew, zbiórka charytatywna.",
    layout: "plakat",
    format: "a4",
    orientacja: "pion",
    pola: [
      { id: "naglowek", etykieta: "Hasło", typ: "text", domysl: "Wspólnie dla naszej wsi!" },
      { id: "tytul", etykieta: "Nazwa akcji", typ: "text", domysl: "Wielkie sprzątanie" },
      { id: "opis", etykieta: "Szczegóły", typ: "textarea", domysl: "Zabierz rękawice i dobry humor. Po akcji poczęstunek dla uczestników." },
      { id: "data", etykieta: "Data", typ: "date", domysl: "" },
      { id: "godzina", etykieta: "Godzina zbiórki", typ: "time", domysl: "9:00" },
      { id: "miejsce", etykieta: "Miejsce zbiórki", typ: "text", domysl: "Przy świetlicy, {{wies}}" },
      { id: "organizator", etykieta: "Organizator", typ: "text", domysl: "Sołectwo {{wies}}" },
      { id: "kontakt", etykieta: "Kontakt", typ: "text", domysl: "tel. …" },
    ],
    domyslnyMotyw: "nowoczesny-granat",
    dostep: "wszyscy",
    tagi: ["plakat", "akcja"],
  },
  {
    id: "podziekowanie-sponsor",
    kategoria: "podziekowania",
    tytul: "Podziękowanie dla sponsora",
    opis: "Oficjalne podziękowanie firmie lub osobie wspierającej sołectwo.",
    layout: "podziekowanie",
    format: "a5",
    orientacja: "poziom",
    pola: [
      { id: "naglowek", etykieta: "Nagłówek", typ: "text", domysl: "Serdeczne podziękowania" },
      { id: "tytul", etykieta: "Dla kogo", typ: "text", domysl: "Firma …" },
      { id: "opis", etykieta: "Treść podziękowania", typ: "textarea", domysl: "Za hojne wsparcie finansowe przy remoncie świetlicy wiejskiej. Dzięki Państwa zaangażowaniu nasza wieś ma lepsze miejsce spotkań." },
      { id: "data", etykieta: "Data", typ: "date", domysl: "" },
      { id: "miejsce", etykieta: "Miejsce", typ: "text", domysl: "{{wies}}" },
      { id: "organizator", etykieta: "W imieniu", typ: "text", domysl: "Mieszkańcy sołectwa {{wies}}" },
      { id: "podpis1", etykieta: "Podpis sołtysa", typ: "text", domysl: "Sołtys\n…" },
    ],
    domyslnyMotyw: "elegancki-zloty",
    dostep: "soltys",
    tagi: ["sponsor", "fundraising"],
  },
  {
    id: "podziekowanie-wolontariusz",
    kategoria: "podziekowania",
    tytul: "Podziękowanie dla wolontariusza",
    opis: "Krótka karta wdzięczności za pomoc przy imprezie lub akcji.",
    layout: "podziekowanie",
    format: "a5",
    orientacja: "poziom",
    pola: [
      { id: "naglowek", etykieta: "Nagłówek", typ: "text", domysl: "Dziękujemy!" },
      { id: "tytul", etykieta: "Imię i nazwisko", typ: "text", domysl: "…" },
      { id: "opis", etykieta: "Za co dziękujemy", typ: "textarea", domysl: "Za nieocenioną pomoc przy organizacji festynu i zaangażowanie na rzecz naszej wspólnoty." },
      { id: "data", etykieta: "Data", typ: "date", domysl: "" },
      { id: "organizator", etykieta: "Od kogo", typ: "text", domysl: "Sołectwo {{wies}}" },
      { id: "podpis1", etykieta: "Podpis", typ: "text", domysl: "Sołtys\n…" },
    ],
    domyslnyMotyw: "zielony-wies",
    dostep: "wszyscy",
    tagi: ["wolontariat"],
  },
  {
    id: "karta-informacyjna",
    kategoria: "karty",
    tytul: "Karta informacyjna",
    opis: "Prosta karta z najważniejszymi informacjami — numery alarmowe, harmonogram.",
    layout: "karta-informacyjna",
    format: "a5",
    orientacja: "pion",
    pola: [
      { id: "naglowek", etykieta: "Tytuł karty", typ: "text", domysl: "Informacje dla mieszkańców" },
      { id: "tytul", etykieta: "Podtytuł", typ: "text", domysl: "Sołectwo {{wies}}" },
      { id: "opis", etykieta: "Treść", typ: "textarea", domysl: "• Zebranie: …\n• Wywóz śmieci: …\n• Sołtys: tel. …\n• OSP: tel. …" },
      { id: "kontakt", etykieta: "Kontakt / strona", typ: "text", domysl: "naszawies.pl" },
      { id: "organizator", etykieta: "Stopka", typ: "text", domysl: "Gmina {{gmina}}" },
    ],
    domyslnyMotyw: "nowoczesny-granat",
    dostep: "soltys",
    tagi: ["informacja"],
  },
  ...SZABLONY_SEZONOWE,
  ...SZABLONY_GRUP_WIEJSKICH,
  ...SZABLONY_DWujezyczne,
  ...SZABLONY_DYPLOMY_ROZSZERZONE,
  ...SZABLONY_SWIETLICA_DZIECI,
  ...SZABLONY_SOLECTWO_ROZSZERZONE,
];

export const ETYKIETY_KATEGORII: Record<string, string> = {
  zaproszenia: "Zaproszenia",
  dyplomy: "Dyplomy i certyfikaty",
  plakaty: "Plakaty",
  podziekowania: "Podziękowania",
  karty: "Karty informacyjne",
};

export function znajdzSzablon(id: string): SzablonGrafiki | undefined {
  return SZABLONY_GRAFIKI.find((s) => s.id === id);
}

export function uzupelnijPlaceholdery(tekst: string, kontekst: KontekstGrafiki): string {
  return tekst
    .replace(/\{\{wies\}\}/g, kontekst.wies?.trim() || "…")
    .replace(/\{\{gmina\}\}/g, kontekst.gmina?.trim() || "…")
    .replace(/\{\{organizator\}\}/g, kontekst.organizator?.trim() || "…")
    .replace(/\{\{telefon\}\}/g, kontekst.telefon?.trim() || "tel. …")
    .replace(/\{\{email\}\}/g, kontekst.email?.trim() || "…");
}

export function domyslneWartosciPol(
  szablon: SzablonGrafiki,
  kontekst: KontekstGrafiki,
): WartosciPolGrafiki {
  const out: WartosciPolGrafiki = {};
  for (const pole of szablon.pola) {
    out[pole.id] = uzupelnijPlaceholdery(pole.domysl ?? "", kontekst);
  }
  return out;
}

export function filtrujSzablonyDlaRoli(
  szablony: SzablonGrafiki[],
  opcje: { trybSoltys?: boolean; trybKgw?: boolean; trybOsp?: boolean },
): SzablonGrafiki[] {
  return szablony.filter((s) => {
    if (s.dostep === "wszyscy") return true;
    if (s.dostep === "soltys" && opcje.trybSoltys) return true;
    if (s.dostep === "kgw" && (opcje.trybKgw || opcje.trybSoltys)) return true;
    if (s.dostep === "osp" && (opcje.trybOsp || opcje.trybSoltys)) return true;
    return false;
  });
}

export function formatDatyPolskiej(dataIso: string): string {
  if (!dataIso.trim()) return "…";
  const d = new Date(dataIso + "T12:00:00");
  if (Number.isNaN(d.getTime())) return dataIso;
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
}
