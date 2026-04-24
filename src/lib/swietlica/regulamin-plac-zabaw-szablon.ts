/**
 * Warianty przykładowych regulaminów placu zabaw (sołectwo) — wstaw, potem dopasuj w polu poniżej.
 */
export const REGULAMIN_PLACU_ZABAW_SZABLONY = [
  {
    id: "standard",
    etykieta: "Pełny (§1–5)",
    opis: "Dzieci pod opieką, bezpieczeństwo, higiena, zwierzęta, godziny — klasyczna struktura.",
    tresc: `REGULAMIN KORZYSTANIA Z PLACU ZABAW
(obowiązuje dzieci pod opieką osób dorosłych oraz wszystkich użytkowników)

§1. WSTĘP
1. Plac zabaw przeznaczony jest do zabawy i rekreacji na własną odpowiedzialność użytkowników.
2. Dzieci do lat …………………… mogą korzystać z urządzeń wyłącznie pod nadzorem osoby dorosłej.

§2. ZASADY BEZPIECZEŃSTWA
1. Korzystać można wyłącznie z urządzeń zgodnie z ich przeznaczeniem i tabliczką informacyjną przy sprzęcie.
2. Zabrania się wchodzenia na urządzenia w obuwiu z twardą podeszwą, na rolkach lub rowerze (poza strefą dopuszczoną).
3. W przypadku uszkodzenia sprzętu lub zagrożenia należy powiadomić sołtysa lub radnego sołeckiego.

§3. PORZĄDEK I HIGIENA
1. Należy zachować czystość wokół placu; śmieci wrzucać do pojemników.
2. Zabrania się pozostawiania odpadów po remontach, zużytych baterii i odpadów niebezpiecznych.

§4. ZWIERZĘTA
1. Psy i inne zwierzęta — wyłącznie na smyczy, zgodnie z uchwałą sołectwa / przepisami o utrzymaniu czystości.

§5. GODZINY I OGRANICZENIA
1. Cisza nocna i godziny korzystania — zgodnie z uchwałą sołectwa lub zarządzeniem sołtysa (uzupełnić poniżej).
   Godziny: ………………………………………………………………………

……………………………….                ……………………………….
(miejscowość, data)                    (podpis sołtysa)
`,
  },
  {
    id: "krotki",
    etykieta: "Krótki",
    opis: "Minimum do tablicy informacyjnej, gdy szczegóły są w uchwale wsi albo w BIP.",
    tresc: `ZASADY KORZYSTANIA Z PLACU ZABAW

1. Tylko pod opieką osoby dorosłej — urządzenia w wieku czytelnym z tabliczki, nie przekraczać limitu obciążenia.
2. Zwierzęta na smyczy; odpady do koszy; odpadów zielonych, budowlanych i baterii nie zostawiać na placu.
3. Szkody i awarie: zgłaszać sołtysowi. W razie wypadku: pierwszeństwo udzielenia pierwszej pomocy, wezwanie służb 112/999 zgodnie z sytuacją.
4. Cisza nocna/ godziny — w uchwale / zarządzeniu sołtysa: uzupełnij: ………………………
5. Dalsze wymagania: zgodnie z bezpiecznym użytkowaniem urządzeń (instrukcja producenta przy zjeżdżalni, huśtawce itd.).

……………              ……………
(data)         (sołtys)
`,
  },
  {
    id: "nacisk-nadzor",
    etykieta: "Nacisk: nadzór i bezpieczeństwo",
    opis: "Gdy w gminie były wypadki albo wzmocniono kontrole — czytelne pouczenie opiekunów.",
    tresc: `PORZĄDEK I BEZPIECZEŃSTWO NA PLACU ZABAW
(obowiązuje wszystkich — karą jest zakaz wstępu tymczasowy w razie łamania reguł)

1. Dzieci do 13 r.ż. tylko pod opieką osoby dorosłej, która ponosi w całości odpowiedzialność za bezpieczeństwo podopiecznych. Starsze — na własną odpowiedzialność, z rekomendacją czytania znaków ostrzegawczych.
2. Korzystanie tylko z celem określonym (huśtawka — tylko do huśtania, piaskownica tylko do gry, nie wejście w robocze stroje, bez alkoholu).
3. Urządzenia: nie skakać wbrew przeznaczeniu, stosunek wagi i wieku wg tabliczki, jedna osoba na siedzisko huśtawki gdzie taka wskazana.
4. Cichy, sprzątanie, zwierzęta na uwięzi, nie dokarmianie dzikim drapieżnym — w razie wątpliwości opuścić strefę.
5. Mienie wspólne: obowiązuje wyrównanie szkody; zdarzenia wymagające wyceny: zgłaszać do sołtysa w terminie 7 dni.
6. Godziny, cisza, teren — w uchwale: …………; telefon do zgłoszeń: …………

……………              ……………
(data)         (sołtys / zarządca)
`,
  },
] as const;

export const REGULAMIN_PLACU_ZABAW_SZABLON: string = REGULAMIN_PLACU_ZABAW_SZABLONY[0]!.tresc;

export type WariantRegulaminuPlacuId = (typeof REGULAMIN_PLACU_ZABAW_SZABLONY)[number]["id"];
