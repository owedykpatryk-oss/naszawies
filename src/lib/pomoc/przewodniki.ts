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
          opis: "Użyj wyszukiwarki lub mapy wsi, aby wejść na profil miejscowości.",
          link: { href: "/szukaj", label: "Szukaj wsi" },
        },
        {
          tytul: "Transport (PKP, PKS)",
          opis: "Na profilu wsi: odjazdy pociągów i linki do rozkładów autobusów.",
          link: { href: "/transport", label: "Centrum transportu" },
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
          tytul: "Transport (pociąg i autobus)",
          opis: "Na profilu wsi sekcja Transport: PKP z opóźnieniami oraz linki PKS/bus. Ustaw relacje w panelu, by dostawać alerty.",
          link: { href: "/transport", label: "Centrum transportu" },
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
          tytul: "Ostrzeżenia o polowaniu",
          opis: "Podaj rejon i termin (od–do) — mieszkańcy zobaczą alert na profilu wsi i w kalendarzu.",
          link: { href: "/panel/soltys/lowiectwo", label: "Polowania" },
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
          tytul: "Co wpisać",
          opis: "Rejon (np. „las za stadniną”, „pole na wschód od drogi gminnej”), dokładny termin od–do, numer kontaktowy.",
        },
      ],
      wskazowki: [
        "Opublikuj ostrzeżenie minimum 2–3 dni przed polowaniem.",
        "Po zakończeniu akcji oznacz jako zarchiwizowane.",
        "Użyj szablonu plakatu „polowanie” w kreatorze grafiki.",
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
