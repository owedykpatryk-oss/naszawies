export type RolaPrzewodnika = "ogolne" | "mieszkaniec" | "soltys" | "kgw" | "osp" | "mysliwi";

export type KrokPrzewodnika = {
  tytul: string;
  opis: string;
  link?: { href: string; label: string };
};

export type SekcjaPrzewodnika = {
  id: string;
  tytul: string;
  kroki: KrokPrzewodnika[];
  wskazowki?: string[];
};

export const ETYKIETA_ROLI: Record<RolaPrzewodnika, string> = {
  ogolne: "Ogólnie o serwisie",
  mieszkaniec: "Mieszkaniec",
  soltys: "Sołtys",
  kgw: "KGW",
  osp: "OSP",
  mysliwi: "Myśliwi / łowiectwo",
};

export const PRZEWODNIKI: Record<RolaPrzewodnika, SekcjaPrzewodnika[]> = {
  ogolne: [
    {
      id: "start",
      tytul: "Co to jest naszawies.pl?",
      kroki: [
        {
          tytul: "Cyfrowy dom wsi",
          opis: "Bezpłatna platforma dla sołtysów i mieszkańców: ogłoszenia, świetlica, mapa, rynek lokalny, fotokronika i komunikacja.",
        },
        {
          tytul: "Znajdź swoją wieś",
          opis: "Po zalogowaniu: wyszukiwarka katalogu i mapa wsi. Publiczny profil miejscowości działa też z bezpośredniego linku.",
          link: { href: "/logowanie?next=/szukaj", label: "Zaloguj i szukaj wsi" },
        },
        {
          tytul: "Transport (PKP, PKS)",
          opis: "Na profilu wsi: odjazdy, sekcja „Do miasta powiatowego” i linki PKS. Po roli mieszkańca — alerty w ustawieniach transportu.",
          link: { href: "/panel/moje/transport", label: "Ustawienia transportu" },
        },
        {
          tytul: "Załóż konto",
          opis: "Rejestracja jest darmowa. Konto pozwala zgłaszać sprawy, rezerwować świetlicę i brać udział w życiu wsi.",
          link: { href: "/rejestracja", label: "Rejestracja" },
        },
      ],
    },
    {
      id: "bezpieczenstwo",
      tytul: "Bezpieczeństwo i zgłoszenia",
      kroki: [
        {
          tytul: "Zgłoszenie problemu w gminie",
          opis: "Dziury w drodze, oświetlenie, śmieci — to zgłoszenia mieszkańców do sołtysa (nie błąd strony).",
          link: { href: "/panel/mieszkaniec/zgloszenia", label: "Zgłoszenia mieszkańców" },
        },
        {
          tytul: "Problem z działaniem strony",
          opis: "Błąd logowania, panelu, mapy? Użyj formularza „Zgłoś problem ze stroną”.",
          link: { href: "/zglos-problem-strony", label: "Zgłoś problem ze stroną" },
        },
        {
          tytul: "Naruszenie treści",
          opis: "Treści naruszające prawo lub regulamin zgłaszaj osobno (DSA).",
          link: { href: "/zglos-naruszenie", label: "Zgłoś naruszenie" },
        },
      ],
    },
    {
      id: "mapa",
      tytul: "Mapa wsi — warstwy i filtry",
      kroki: [
        {
          tytul: "Katalog i wyszukiwanie",
          opis: "Wybierz województwo → powiat → gmina albo wpisz nazwę wsi. Lista sortuje się też wg odległości po włączeniu GPS.",
          link: { href: "/mapa", label: "Otwórz mapę" },
        },
        {
          tytul: "Warstwy POI",
          opis: "Pills u góry listy: transport, sklepy, inwestycje 🏗, oświetlenie. Latarnie domyślnie ukryte przy widoku „Wszystkie POI”.",
          link: { href: "/mapa?warstwa=inwestycje", label: "Warstwa inwestycji" },
        },
        {
          tytul: "Inwestycje i planowane budowy",
          opis: "Sołtys oznacza miejsca typu „tu powstanie…”, budowy w toku i link do uchwały. Część punktów importuje się z OpenStreetMap (tagi construction).",
          link: { href: "/panel/soltys/mapa", label: "Edytor mapy sołtysa" },
        },
        {
          tytul: "Zagospodarowanie (OSM)",
          opis: "Warstwa polygonów landuse z OpenStreetMap: lasy, grunty rolne, zabudowa — orientacyjnie, obok granic PRG. Nie zastępuje MPZP gminy.",
          link: { href: "/mapa?zagospodarowanie=1", label: "Warstwa zagospodarowania" },
        },
        {
          tytul: "Oświetlenie drogi",
          opis: "Latarnie z OSM lub dodane ręcznie — osobna warstwa.",
          link: { href: "/mapa?warstwa=oswietlenie", label: "Warstwa oświetlenia" },
        },
        {
          tytul: "Zgłoszenia na mapie",
          opis: "Aktywne zgłoszenia mieszkańców (np. uszkodzona latarnia) widać jako żółte markery — po zalogowaniu we wsi, której dotyczą.",
          link: { href: "/panel/mieszkaniec/zgloszenia?category=oswietlenie", label: "Zgłoś problem" },
        },
        {
          tytul: "Link z filtrami",
          opis: "Adres URL zapamiętuje filtry (woj, powiat, gmina, warstwa) — możesz wysłać link sąsiadowi lub sołtysowi.",
        },
        {
          tytul: "Warstwa Łowiectwo",
          opis: "Przełącznik 🦌 Łowiectwo: polowania, koła, tereny łowieckie (🌲). Ambony i posterunki — dla większości użytkowników strefa ~500 m; członkowie wsi widzą dokładną pinezkę.",
          link: { href: "/mapa?warstwa=lowiectwo", label: "Mapa — łowiectwo" },
        },
        {
          tytul: "POI: teren vs ambona",
          opis: "Sołtys w Mapie POI może dodać „Teren łowiecki” (publiczny obszar) oraz „Ambonę” / „Posterunek” — te drugie na mapie katalogu są zawsze z zabezpieczeniem lokalizacji.",
          link: { href: "/panel/soltys/mapa", label: "Edytor mapy sołtysa" },
        },
        {
          tytul: "Obrys powiatu",
          opis: "Po wyborze powiatu włącz „Obrys powiatu” — fioletowa otulina z granic wsi w katalogu (orientacyjnie, nie granica urzędowa TERYT).",
          link: { href: "/mapa?powiat_obrys=1", label: "Podpowiedź obrysu" },
        },
      ],
      wskazowki: [
        "Sołtys uzupełnia brakujące pinezki w Panel → Mapa POI; część punktów importuje się z OpenStreetMap (w tym budowy oznaczone w OSM).",
        "Inwestycje: status planowana / w budowie, termin i link do BIP gminy — widoczne na mapie z animowaną pinezką 🏗.",
        "Transport na mapie: filtr „Transport” pokazuje przystanki i stacje powiązane z wsią.",
        "Polowania: czerwony pulsujący obszar = trwa teraz; pomarańczowy przerywany = zaplanowane (lista z odliczaniem w panelu filtrów).",
      ],
    },
    {
      id: "gdzie-co",
      tytul: "Gdzie co znajdę?",
      kroki: [
        {
          tytul: "Panel mieszkańca",
          opis: "Zgłoszenia, rynek, świetlica, fotokronika — po zalogowaniu: Panel → Działania.",
          link: { href: "/panel/mieszkaniec", label: "Panel mieszkańca" },
        },
        {
          tytul: "Panel sołtysa",
          opis: "Moderacja, profil wsi, rezerwacje — Panel → Sołtys.",
          link: { href: "/panel/soltys", label: "Panel sołtysa" },
        },
        {
          tytul: "Mapa i szukanie wsi",
          opis: "Katalog miejscowości i mapa POI — wymaga konta.",
          link: { href: "/mapa", label: "Mapa wsi" },
        },
        {
          tytul: "Pełna mapa pomocy",
          opis: "Tabela „Chcę… → Idę do…” na stronie pomocy i w panelu głównym.",
          link: { href: "/pomoc", label: "Centrum pomocy" },
        },
      ],
    },
  ],
  mieszkaniec: [
    {
      id: "pierwsze-kroki",
      tytul: "Pierwsze kroki mieszkańca",
      kroki: [
        {
          tytul: "Wniosek o rolę we wsi",
          opis: "W panelu mieszkańca złóż wniosek o rolę (mieszkaniec, OSP, KGW itd.). Sołtys zatwierdza.",
          link: { href: "/panel/mieszkaniec", label: "Panel mieszkańca" },
        },
        {
          tytul: "Obserwuj wieś",
          opis: "Na profilu wsi możesz obserwować aktualności bez pełnej roli (ograniczone funkcje).",
        },
        {
          tytul: "Powiadomienia",
          opis: "Włącz powiadomienia o postach, wydarzeniach i odpowiedziach sołtysa.",
          link: { href: "/panel/powiadomienia", label: "Powiadomienia" },
        },
      ],
    },
    {
      id: "codziennie",
      tytul: "Co robić na co dzień",
      kroki: [
        {
          tytul: "Zgłoszenia do sołtysa",
          opis: "Dodaj zdjęcie, miejsce i krótki opis. Oznacz „pilne” tylko gdy naprawdę trzeba.",
          link: { href: "/panel/mieszkaniec/zgloszenia", label: "Twoje zgłoszenia" },
        },
        {
          tytul: "Rezerwacja świetlicy",
          opis: "Sprawdź kalendarz zajętości, zarezerwuj termin, podaj liczbę gości.",
          link: { href: "/panel/mieszkaniec/swietlica", label: "Świetlica" },
        },
        {
          tytul: "Fotokronika i konkursy",
          opis: "Dodaj zdjęcie wsi — po akceptacji sołtysa trafi na profil publiczny. W konkursie możesz głosować.",
          link: { href: "/panel/mieszkaniec/fotokronika", label: "Fotokronika" },
        },
        {
          tytul: "Pomoc sąsiedzka",
          opis: "Zaoferuj transport, zakupy lub poproś sąsiada o drobną pomoc — ogłoszenia widoczne na profilu wsi.",
          link: { href: "/panel/mieszkaniec/pomoc-sasiedzka", label: "Pomoc sąsiedzka" },
        },
        {
          tytul: "Transport (pociąg i autobus)",
          opis: "Sekcja Transport na profilu wsi: live PKP, połączenia do powiatu, cache autobusów. Progi alertów ustawiasz osobno.",
          link: { href: "/panel/moje/transport", label: "Ustawienia transportu" },
        },
      ],
    },
  ],
  soltys: [
    {
      id: "rutyna",
      tytul: "Rutyna sołtysa (10 min dziennie)",
      kroki: [
        {
          tytul: "Kolejka pracy",
          opis: "Zacznij od dashboardu — wnioski, moderacja, rezerwacje.",
          link: { href: "/panel/soltys", label: "Przegląd panelu" },
        },
        {
          tytul: "Kalendarz organizacyjny",
          opis: "Jeden widok: wydarzenia, świetlica, terminy, gmina.",
          link: { href: "/panel/soltys/kalendarz", label: "Kalendarz" },
        },
        {
          tytul: "Decyzje blokujące",
          opis: "Najpierw: wnioski o role, rezerwacje sal, moderacja postów i rynku.",
          link: { href: "/panel/soltys/rezerwacje", label: "Rezerwacje" },
        },
        {
          tytul: "Leśnictwo — zakazy i wycinki",
          opis: "Profil leśny wsi (choinki, LP) oraz ostrzeżenia z terminem — zielone obszary na mapie.",
          link: { href: "/panel/soltys/lesnictwo", label: "Leśnictwo" },
        },
        {
          tytul: "Kalendarz łowiecki i polowania",
          opis:
            "Kalendarz: kto na ambony, zebrania, polowania zbiorowe. Ostrzeżenia na mapie: rejon i termin — alert na profilu wsi.",
          link: { href: "/panel/soltys/lowiectwo/kalendarz", label: "Kalendarz łowiecki" },
        },
        {
          tytul: "Mapowanie stacji PKP",
          opis: "Gdy OSM nie pasuje do PKP — wybierz właściwą stację i odśwież rozkład dla wsi.",
          link: { href: "/panel/soltys/transport", label: "Transport PKP" },
        },
      ],
    },
    {
      id: "promocja",
      tytul: "Promocja i komunikacja wsi",
      kroki: [
        {
          tytul: "Społeczność i WOW",
          opis: "Wydarzenia, blog, organizacje, tryby KGW/OSP.",
          link: { href: "/panel/soltys/spolecznosc", label: "Społeczność" },
        },
        {
          tytul: "Kreator plakatów",
          opis: "Plakaty na zebranie, festyn, polowanie — gotowe szablony.",
          link: { href: "/panel/soltys/grafika", label: "Grafika" },
        },
        {
          tytul: "Konkurs zdjęć",
          opis: "Uruchom zgłoszenia, zatwierdź w fotokronice, otwórz głosowanie.",
          link: { href: "/panel/soltys/konkursy", label: "Konkursy" },
        },
      ],
    },
  ],
  kgw: [
    {
      id: "kgw-panel",
      tytul: "Przewodnik dla KGW",
      kroki: [
        {
          tytul: "Rola KGW",
          opis: "Przewodnicząca KGW może mieć osobną rolę — wniosek w panelu mieszkańca, akceptacja sołtysa.",
        },
        {
          tytul: "Lista zakupów",
          opis: "Wspólna lista zakupów widoczna dla członków KGW (po nadaniu roli).",
          link: { href: "/panel/mieszkaniec/lista-zakupow", label: "Lista zakupów" },
        },
        {
          tytul: "Wydarzenia i plakaty",
          opis: "Sołtys dodaje wydarzenia w panelu; KGW może prosić o publikację i plakat w kreatorze.",
          link: { href: "/panel/soltys/spolecznosc", label: "Panel sołtysa — społeczność" },
        },
      ],
      wskazowki: [
        "Ustal z sołtysem jednego „opiekuna publikacji” — mniej duplikatów ogłoszeń.",
        "Na plakacie zawsze: data, godzina, miejsce, kontakt.",
      ],
    },
  ],
  osp: [
    {
      id: "osp-panel",
      tytul: "Przewodnik dla OSP",
      kroki: [
        {
          tytul: "Rola naczelnika",
          opis: "Naczelnik OSP składa wniosek o rolę — sołtys zatwierdza w panelu.",
        },
        {
          tytul: "Komunikaty alarmowe",
          opis: "Pilne komunikaty (np. ćwiczenia, awaria wody) publikuje sołtys jako post z kategorią awaria/ogłoszenie.",
        },
        {
          tytul: "Wydarzenia OSP",
          opis: "Dni otwarte remizy, zbiórki — dodaj jako wydarzenie w społeczności wsi.",
        },
      ],
    },
  ],
  mysliwi: [
    {
      id: "lowiectwo-ostrzezenia",
      tytul: "Ostrzeżenia polowania",
      kroki: [
        {
          tytul: "Po co to jest",
          opis: "Mieszkańcy i turyści widzą na profilu wsi: gdzie trwają polowania i w jakim terminie. To nie zastępuje przepisów — to informacja społeczna.",
        },
        {
          tytul: "Kto dodaje",
          opis: "Sołtys publikuje i zatwierdza ostrzeżenia. Koło może przekazać dane (rejon, daty, telefon łowczego).",
          link: { href: "/panel/soltys/lowiectwo", label: "Panel — polowania" },
        },
        {
          tytul: "Obszar na mapie",
          opis: "W panelu Polowania zaznacz prostokąt (2 kliknięcia) lub wielokąt; możesz też użyć obrysu całej wsi. Termin ustawisz skrótem (dziś, jutro, weekend).",
          link: { href: "/panel/soltys/lowiectwo", label: "Panel — polowania" },
        },
        {
          tytul: "Mapa katalogu — warstwa Łowiectwo",
          opis: "Na /mapa widać polowania w regionie, koła łowieckie (🦌) i link do obszaru. Udostępnij adres z ?warstwa=lowiectwo.",
          link: { href: "/mapa?warstwa=lowiectwo", label: "Mapa — łowiectwo" },
        },
        {
          tytul: "Opis tekstowy",
          opis: "Krótki opis dla osób bez mapy (np. „las za stadniną”) oraz telefon łowczego.",
        },
      ],
      wskazowki: [
        "Opublikuj ostrzeżenie minimum 2–3 dni przed polowaniem.",
        "Po zakończeniu akcji oznacz jako zarchiwizowane.",
        "Link z profilu wsi prowadzi bezpośrednio do obszaru na mapie.",
        "Użyj szablonu plakatu „polowanie” w kreatorze grafiki.",
      ],
    },
    {
      id: "lesnictwo-ostrzezenia",
      tytul: "Leśnictwo — zakazy i wycinki",
      kroki: [
        {
          tytul: "Profil leśny wsi",
          opis: "Choinki, drewno opałowe, kontakt do LP — stała strona /lesnictwo dla mieszkańców.",
          link: { href: "/panel/soltys/lesnictwo", label: "Panel — leśnictwo" },
        },
        {
          tytul: "Ostrzeżenia z terminem",
          opis: "Zakaz wstępu, wycinka, prace zmechanizowane, pożar — z opisem rejonu i opcjonalnym obszarem na mapie.",
          link: { href: "/panel/soltys/lesnictwo", label: "Dodaj ostrzeżenie" },
        },
        {
          tytul: "Mapa",
          opis: "Zielone obrysy ostrzeżeń leśnych na mapie katalogu; udostępnij link ?les= do obszaru.",
          link: { href: "/mapa?ostrzezenia_lesne=1", label: "Mapa — ostrzeżenia leśne" },
        },
      ],
    },
    {
      id: "kalendarz-lowiecki",
      tytul: "Kalendarz ambony i polowań",
      kroki: [
        {
          tytul: "Harmonogram",
          opis: "Kto siedzi na ambony, polowania zbiorowe, zebrania koła — widoczne dla zalogowanych mieszkańców wsi.",
          link: { href: "/panel/soltys/lowiectwo/kalendarz", label: "Kalendarz łowiecki" },
        },
        {
          tytul: "Ambony na mapie",
          opis: "Dodaj ambony jako POI w module mapy wsi — potem wybierzesz je w kalendarzu.",
          link: { href: "/panel/soltys/mapa", label: "Mapa POI" },
        },
        {
          tytul: "Powiązanie z ostrzeżeniem",
          opis: "Z listy polowań przejdź do kalendarza z wstępnie wypełnionym terminem.",
          link: { href: "/panel/soltys/lowiectwo", label: "Ostrzeżenia polowania" },
        },
      ],
    },
  ],
};

export const KATEGORIE_ZGLOSZENIA_STRONY: { value: string; label: string }[] = [
  { value: "blad_strony", label: "Błąd strony (coś nie działa)" },
  { value: "logowanie", label: "Logowanie / konto" },
  { value: "panel", label: "Panel (mieszkaniec / sołtys)" },
  { value: "mapa", label: "Mapa wsi" },
  { value: "pomysl", label: "Pomysł na ulepszenie" },
  { value: "inny", label: "Inne" },
];
