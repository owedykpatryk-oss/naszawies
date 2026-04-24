/**
 * Warianty przykładowych regulaminów świetlicy — wstaw z listy, potem uzupełnij w polu poniżej.
 * Nie stanowi porady prawnej.
 */
export const REGULAMIN_SWIETLICY_SZABLONY = [
  {
    id: "pelny",
    etykieta: "Pełny (§1–5)",
    opis: "Rezerwacje, opłaty, sprzątanie, bezpieczeństwo, odpowiedzialność — klasyka na większość przypadków.",
    tresc: `REGULAMIN KORZYSTANIA ZE ŚWIETLICY
(obowiązuje wszystkich użytkowników i wynajmujących)

§1. POSTANOWIENIA OGÓLNE
1. Ze świetlicy mogą korzystać mieszkańcy sołectwa oraz osoby zaproszone zgodnie z zasadami rezerwacji.
2. Wynajem sali na imprezy i spotkania wymaga złożenia wniosku i akceptacji sołtysa lub upoważnionej osoby.
3. Użytkownicy zobowiązani są do przestrzegania niniejszego regulaminu, zasad bezpieczeństwa i higieny oraz poleceń osób nadzorujących obiekt.

§2. REZERWACJE I OPŁATY
1. Rezerwacji dokonuje się w uzgodniony sposób (np. system elektroniczny, wpis do księgi).
2. Opłaty i kaucja — zgodnie z cennikiem uchwalonym dla danej sali lub z aktualnym wpisem w systemie.
3. W razie odwołania rezerwacji obowiązują zasady przyjęte przez sołectwo.

§3. PORZĄDEK I SPRZĄTANIE
1. Po zakończeniu wydarzenia użytkownik zobowiązany jest do pozostawienia sali w stanie niepogorszonym względem stanu odbioru.
2. Śmieci należy segregować zgodnie z oznaczeniami; odpady niebezpieczne nie wolno pozostawiać w świetlicy.
3. Wyposażenie mobilne należy zwracać na wyznaczone miejsce.

§4. BEZPIECZEŃSTWO
1. Obowiązuje zakaz używania otwartego ognia i urządzeń niezgodnych z instalacją obiektu, chyba że przewiduje to odrębna zgoda.
2. W obiekcie obowiązuje przestrzeganie przepisów przeciwpożarowych i ewakuacyjnych.
3. Alkohol — zgodnie z uchwałą sołectwa / obowiązującym prawem oraz warunkami rezerwacji.

§5. ODPOWIEDZIALNOŚĆ
1. Za szkody powstałe z winy użytkownika odpowiada on materialnie na zasadach ogólnych.
2. Skargi i wnioski dotyczące działania świetlicy można składać do sołtysa.

……………………………….                ……………………………….
(miejscowość, data)                    (podpis sołtysa / zarządcy)
`,
  },
  {
    id: "krotki",
    etykieta: "Krótki",
    opis: "Zwięzły, gdy w gminie jest osobna uchwała lub wystarczają podstawy z cennikiem w systemie.",
    tresc: `REGULAMIN KORZYSTANIA ZE ŚWIETLICY
(obowiązuje użytkowników wynajmujących i organizatorów wydarzeń)

1. Rezerwacja i opłata — zgodnie z cennikiem w panelu wsi albo z uchwałą; kaucję wskazano przy zapisach.
2. Użytkownik zostawia salę w stanie niegorszym niż w momencie rozpoczęcia; odpad segregować, wyposażenie przenieść we wskazane miejsce.
3. Obowiązują przepisy ppoż., zakaz otwartego ognia bez zgody, przepisy o bezpiecznej obsłudze prądu i ograniczeniach w sprawie alkoholu — stosownie do uchwały gromady i prawa.
4. Za umyślne zniszczenie mienia odpowiada wynajmujący na zasadach ogólnych. Skargi: sołtys.
5. Regulamin wchodzi w życie z dniem ustalonym przez sołectwo (zebranie) albo z dniem wskazanym w uchwale / niniejszym zarządzeniu.

……………………               ……………………
(miejscowość, data)         (sołtys / zarządca)
`,
  },
  {
    id: "tylko-wynajem",
    etykieta: "Skup na wynajmie płatnym",
    opis: "Dla wydarzeć komercyjnych, imprez okolicznościowych — mocniej podkreśla wynajmującego i odpowiedzialność.",
    tresc: `WARUNKI WYNAJMU SALI (ŚWIETLICY) NA WYDARZENIE
(wynajmujący = osoba/organ, który dokonał rezerwacji w systemie albo w uzgodniony sposób)

1. Czas, zakres, opłata, kaucja i warunki zwrotu kaucji — wynikają z cennika i danych rezerwacji w naszawies; ewentualna umowa dodatkowa pozostawia stron swobodę (nie jest wymagana przez serwis).
2. Po zakończeniu: wyłączyć oświetlenie, zamknąć, oddać klucze; stan sali wraz z wyposażeniem własnym wynajmującego wyniesiony — porządek jak przy odbiorze.
3. Szkody w mieniu sołectwa/gminy: naprawa w naturze albo wyrównanie kosztu na podstawie wyceny, po ustaleniu winy. Obiekt wolny od ingerencji w instalację, ściany, okna, bez montażu niszczącego, chyba że inaczej przewidziano w zapisach.
4. Hałas, pora nocna, odpowiedzialność za uczestników, zgłoszenie wydarzenia: zgodnie z przepisami, uchwałami wsi (np. w sprawie głośności) i własną ostrożnością organizatora.
5. Skarga lub spór: w pierwszej kolejności sołtys sołectwa, dalej właściwe organy (np. gmina, policja) według prawa.

Wynajmujący/organizator oświadcza, że zapoznał się z warunkami i cennikiem w systemie.

……………………                    ……………………
(miejscowość, data)         (dla sołectwa: sołtys)
`,
  },
] as const;

/** Pierwsza pozycja z listy (kompatybilność wstecz). */
export const REGULAMIN_SWIETLICY_SZABLON: string = REGULAMIN_SWIETLICY_SZABLONY[0]!.tresc;
