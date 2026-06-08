export type WpisMapyGdzieCo = {
  cel: string;
  sciezka: string;
  href: string;
  rola?: "mieszkaniec" | "soltys" | "wszystkie";
};

export const MAPA_GDZIE_CO: WpisMapyGdzieCo[] = [
  {
    cel: "Zgłosić dziurę w drodze, śmieci, oświetlenie",
    sciezka: "Panel → Działania → Zgłoszenia",
    href: "/panel/mieszkaniec/zgloszenia",
    rola: "mieszkaniec",
  },
  {
    cel: "Sprzedać coś lub dodać usługę",
    sciezka: "Panel → Działania → Rynek lokalny",
    href: "/panel/mieszkaniec/marketplace",
    rola: "mieszkaniec",
  },
  {
    cel: "Zarezerwować salę świetlicy",
    sciezka: "Panel → Działania → Świetlica",
    href: "/panel/mieszkaniec/swietlica",
    rola: "mieszkaniec",
  },
  {
    cel: "Dodać zdjęcie z imprezy",
    sciezka: "Panel → Działania → Fotokronika",
    href: "/panel/mieszkaniec/fotokronika",
    rola: "mieszkaniec",
  },
  {
    cel: "Poprosić sąsiada o pomoc lub zaoferować ją",
    sciezka: "Panel → Działania → Pomoc sąsiedzka",
    href: "/panel/mieszkaniec/pomoc-sasiedzka",
    rola: "mieszkaniec",
  },
  {
    cel: "Stworzyć plakat na imprezę",
    sciezka: "Panel → Działania → Kreator grafiki",
    href: "/panel/mieszkaniec/grafika",
    rola: "mieszkaniec",
  },
  {
    cel: "Ustawić alerty PKP / PKS",
    sciezka: "Panel → Moje → Transport",
    href: "/panel/moje/transport",
    rola: "mieszkaniec",
  },
  {
    cel: "Zatwierdzić wnioski mieszkańców",
    sciezka: "Panel → Sołtys → Przegląd",
    href: "/panel/soltys",
    rola: "soltys",
  },
  {
    cel: "Moderować ogłoszenia i rynek",
    sciezka: "Panel → Sołtys → Przegląd (kolejka)",
    href: "/panel/soltys",
    rola: "soltys",
  },
  {
    cel: "Uzupełnić profil wsi w internecie",
    sciezka: "Panel → Sołtys → Profil wsi",
    href: "/panel/soltys/moja-wies",
    rola: "soltys",
  },
  {
    cel: "Zarządzać rezerwacjami sal",
    sciezka: "Panel → Sołtys → Rezerwacje sal",
    href: "/panel/soltys/rezerwacje",
    rola: "soltys",
  },
  {
    cel: "Dodać wydarzenie, blog lub organizację",
    sciezka: "Panel → Sołtys → Społeczność i WOW",
    href: "/panel/soltys/spolecznosc",
    rola: "soltys",
  },
  {
    cel: "Opublikować ostrzeżenie o polowaniu",
    sciezka: "Panel → Sołtys → Polowania",
    href: "/panel/soltys/lowiectwo",
    rola: "soltys",
  },
  {
    cel: "Zakaz wstępu do lasu / wycinka / ostrzeżenie leśne",
    sciezka: "Panel → Sołtys → Leśnictwo",
    href: "/panel/soltys/lesnictwo",
    rola: "soltys",
  },
  {
    cel: "Profil rolniczy — ARiMR, dopłaty, skup",
    sciezka: "Panel → Sołtys → Rolnictwo",
    href: "/panel/soltys/rolnictwo",
    rola: "soltys",
  },
  {
    cel: "Zaplanować obsadę ambony lub polowanie zbiorowe",
    sciezka: "Panel → Sołtys → Kalendarz łowiecki",
    href: "/panel/soltys/lowiectwo/kalendarz",
    rola: "soltys",
  },
  {
    cel: "Wpisać rozkład PKS przy przystanku",
    sciezka: "Panel → Sołtys → Transport",
    href: "/panel/soltys/transport",
    rola: "soltys",
  },
  {
    cel: "Znaleźć swoją wieś",
    sciezka: "Szukaj wsi (po zalogowaniu)",
    href: "/szukaj",
    rola: "wszystkie",
  },
  {
    cel: "Zgłosić błąd strony (nie problem w gminie)",
    sciezka: "Stopka → Zgłoś problem ze stroną",
    href: "/zglos-problem-strony",
    rola: "wszystkie",
  },
  {
    cel: "Pełna dokumentacja pomocy",
    sciezka: "Centrum pomocy",
    href: "/pomoc",
    rola: "wszystkie",
  },
];
