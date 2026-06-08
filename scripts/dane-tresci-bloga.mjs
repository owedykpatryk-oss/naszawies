/** Rozbudowane treści HTML artykułów bloga — uruchamiane przez aktualizuj-tresci-bloga.mjs */

export const aktualizacje = {
  "jak-zalozyc-profil-wsi": {
    content: `<p>Coraz więcej sołectw szuka jednego, przejrzystego miejsca w internecie — bez skomplikowanych portali i bez opłat za sam fakt bycia w sieci. <strong>naszawies.pl</strong> łączy publiczny profil miejscowości z panelem dla mieszkańców i sołtysa. Ten poradnik przeprowadzi Cię przez cały proces: od rejestracji po pierwsze ogłoszenie na tablicy wsi.</p>

<div class="blog-pullquote">Dobry profil wsi to nie fanpage — to cyfrowa wizytówka całej społeczności, dostępna przez cały rok.</div>

<h2 id="dlaczego-warto">Dlaczego warto mieć profil wsi?</h2>
<p>Mieszkańcy szukają informacji w telefonie: termin zebrania, kontakt do sołtysa, ogłoszenie o sprzedaży sadzonek. Gdy dane są rozproszone między Facebookiem, tablicą przy sklepie i SMS-ami, łatwo o chaos. Jeden profil na naszawies.pl porządkuje komunikację i jest widoczny w wyszukiwarce Google.</p>
<ul class="blog-lista-check">
<li>Stały, czytelny adres URL z nazwą województwa, powiatu i gminy</li>
<li>Moduły włączane przez sołtysa: rynek, świetlica, organizacje, kalendarz</li>
<li>Bezpłatny dostęp dla mieszkańców i sołectw</li>
<li>Indeksacja w mapie strony serwisu — lepsze SEO miejscowości</li>
</ul>

<h2 id="krok-1">Krok 1: Załóż konto</h2>
<p>Wejdź na stronę <a href="/rejestracja">rejestracji</a>, podaj e-mail i hasło. Po potwierdzeniu adresu e-mail możesz zalogować się i przejść do wyboru wsi. Formularz chroni antybot Cloudflare Turnstile — jeśli captcha się nie załaduje, sprawdź blokery reklam lub odśwież stronę.</p>
<div class="blog-callout blog-callout-uwaga"><strong>Uwaga</strong><p>Używaj adresu e-mail, do którego masz stały dostęp. Na tę skrzynkę przychodzą powiadomienia o wniosku sołtysa i akceptacji dołączenia do wsi.</p></div>

<h2 id="krok-2">Krok 2: Znajdź swoją miejscowość</h2>
<p>W katalogu <a href="/szukaj">Szukaj wsi</a> wpisz nazwę miejscowości lub gminy. Wybierz właściwą wieś z listy — system opiera się na danych TERYT, więc łatwiej trafić w dobrą lokalizację. Jeśli nie widzisz swojej wsi, sprawdź pisownię lub wyszukaj po gminie.</p>

<h2 id="krok-3">Krok 3: Wybierz rolę</h2>
<p>Możesz dołączyć jako <strong>mieszkaniec</strong> albo złożyć wniosek o rolę <strong>sołtysa</strong>. Sołtys po akceptacji zarządza treściami, moderuje ogłoszenia i ma dostęp do narzędzi takich jak rezerwacja świetlicy.</p>
<table class="blog-tabela">
<thead><tr><th>Rola</th><th>Uprawnienia</th><th>Dla kogo</th></tr></thead>
<tbody>
<tr><td>Mieszkaniec</td><td>Ogłoszenia, rynek, wnioski o świetlicę</td><td>Osoby mieszkające we wsi</td></tr>
<tr><td>Sołtys</td><td>Panel administracyjny, moderacja, moduły</td><td>Sołtys lub upoważniona osoba</td></tr>
</tbody>
</table>

<h2 id="krok-4">Krok 4: Uzupełnij profil publiczny</h2>
<p>W panelu sołtysa ustaw opis wsi, zdjęcie okładki i moduły widoczne dla gości: rynek lokalny, kalendarz, świetlica, organizacje. Publiczny adres ma postać czytelnej ścieżki URL z województwem, powiatem i gminą.</p>
<ol class="blog-lista-kroki">
<li>Wgraj zdjęcie okładki (krajobraz, kościół, rynek — co reprezentuje wieś)</li>
<li>Napisz 2–3 akapity opisu: historia, atrakcje, kontakt do urzędu gminy</li>
<li>Włącz moduły, z których faktycznie korzystacie</li>
<li>Sprawdź podgląd profilu jako gość (wyloguj się lub otwórz w trybie incognito)</li>
</ol>

<h2 id="krok-5">Krok 5: Zaproś mieszkańców</h2>
<p>Udostępnij link do profilu wsi na tablicy ogłoszeń, w grupie sąsiedzkiej lub podczas zebrania wiejskiego. Im więcej aktywnych kont, tym żywsza społeczność na platformie.</p>
<div class="blog-callout blog-callout-porada"><strong>Porada</strong><p>Przygotuj krótką ulotkę z kodem QR prowadzącym do profilu wsi — wklej ją w sklepie, świetlicy i urzędzie gminy.</p></div>

<h2 id="pierwsze-30-dni">Pierwsze 30 dni — plan minimum</h2>
<p>Nie musisz od razu włączać wszystkich modułów. Wystarczy kilka konkretnych kroków:</p>
<ul>
<li><strong>Tydzień 1:</strong> opis + okładka + zaproszenie 5–10 sąsiadów</li>
<li><strong>Tydzień 2:</strong> pierwsze ogłoszenie (np. zbiórka śmieci, termin zebrania)</li>
<li><strong>Tydzień 3:</strong> konfiguracja świetlicy lub rynku, jeśli są potrzebne</li>
<li><strong>Tydzień 4:</strong> podsumowanie na zebraniu — ile osób dołączyło, co działa</li>
</ul>

<hr class="blog-separator" />

<p>Jeśli potrzebujesz pomocy technicznej, zajrzyj do <a href="/pomoc">centrum pomocy</a> lub napisz przez <a href="/kontakt">formularz kontaktowy</a>. Więcej o roli sołtysa: <a href="/blog/rola-soltysa-narzedzia-cyfrowe">narzędzia cyfrowe sołtysa</a>.</p>`,
    faq: [
      { question: "Czy założenie profilu wsi jest płatne?", answer: "Nie — korzystanie z naszawies.pl dla wsi i mieszkańców jest bezpłatne. Nie pobieramy opłat za sam profil miejscowości w sieci." },
      { question: "Kto może zostać sołtysem w systemie?", answer: "Wniosek składa osoba pełniąca funkcję sołtysa lub upoważniona przez społeczność. Administrator platformy weryfikuje wniosek przed nadaniem uprawnień." },
      { question: "Czy profil wsi jest widoczny w Google?", answer: "Tak — publiczne profile aktywnych wsi są indeksowane i pojawiają się w mapie strony serwisu, co ułatwia znalezienie miejscowości w wyszukiwarce." },
      { question: "Czy mogę należeć do kilku wsi?", answer: "Tak — konto użytkownika może być przypisane do jednej wsi jako głównej, ale możesz przeglądać profile innych miejscowości jako gość." },
    ],
  },

  "rezerwacja-swietlicy-poradnik": {
    content: `<p>Świetlica to serce wielu wydarzeń wiejskich: zebrania, urodziny, zajęcia dla dzieci, spotkania KGW. Problem zaczyna się, gdy terminy zapisuje się w kilku miejscach naraz — zeszyt u sołtysa, kartka przy drzwiach, wiadomości na Messengerze. Moduł świetlicy na <strong>naszawies.pl</strong> porządkuje rezerwacje w jednym kalendarzu widocznym dla całej wsi.</p>

<h2 id="konfiguracja">Konfiguracja sali</h2>
<p>W panelu sołtysa dodaj salę (lub kilka), opisz wyposażenie, wgraj zdjęcia i ewentualny regulamin w formie PDF. Mieszkańcy widzą dostępność przed złożeniem wniosku.</p>
<ul class="blog-lista-check">
<li>Nazwa sali i pojemność (np. 80 miejsc)</li>
<li>Lista wyposażenia: stoły, krzesła, nagłośnienie, kuchnia</li>
<li>Regulamin: godziny ciszy, kaucja, sprzątanie po imprezie</li>
<li>Zdjęcia wnętrza — mniej pytań „czy jest projektor?”</li>
</ul>

<h2 id="workflow">Workflow rezerwacji</h2>
<p>Typowy przebieg wygląda tak:</p>
<ol class="blog-lista-kroki">
<li>Mieszkaniec składa wniosek z datą, godziną i celem wydarzenia</li>
<li>Status <em>oczekuje</em> — sołtys dostaje powiadomienie</li>
<li>Akceptacja lub odrzucenie z krótkim komentarzem</li>
<li>Po imprezie: ewentualna notatka o stanie sali</li>
</ol>
<div class="blog-callout blog-callout-wazne"><strong>Ważne</strong><p>Nie zatwierdzaj dwóch wniosków na ten sam termin bez sprawdzenia nakładania się godzin (np. sprzątanie po poprzedniej imprezie).</p></div>

<h2 id="komunikacja">Komunikacja z mieszkańcami</h2>
<p>Powiadomienia w panelu informują o nowych wnioskach. Warto ustawić jasne zasady: maksymalny czas trwania imprezy, kaucja, sprzątanie po evencie. Regulamin wgrany do systemu ogranicza liczbę pytań telefonicznych w niedzielę wieczorem.</p>
<blockquote>„Od kiedy mamy kalendarz online, nie dostaję już pięciu telefonów o ten sam weekend.” — typowa opinia sołtysów po pierwszym miesiącu</blockquote>

<h2 id="planer">Planer stołów i dokumenty</h2>
<p>Platforma rozwija narzędzia do planowania układu stołów pod wydarzenia w świetlicy — warto śledzić aktualizacje w <a href="/pomoc">centrum pomocy</a>. Regulamin i protokoły możesz trzymać jako pliki PDF dostępne z profilu sali.</p>

<h2 id="najczestsze-bledy">Najczęstsze błędy</h2>
<table class="blog-tabela">
<thead><tr><th>Problem</th><th>Rozwiązanie</th></tr></thead>
<tbody>
<tr><td>Podwójna rezerwacja</td><td>Jeden kalendarz + obowiązkowa akceptacja sołtysa</td></tr>
<tr><td>Brak regulaminu</td><td>Wgraj PDF przed sezonem wesel/komunii</td></tr>
<tr><td>Mieszkańcy nie wiedzą o systemie</td><td>Ogłoszenie na profilu wsi + QR w świetlicy</td></tr>
</tbody>
</table>

<p>Więcej o zebraniach i terminach: <a href="/blog/zebranie-wiejskie-swietlica">zebranie wiejskie bez chaosu</a>.</p>`,
    faq: [
      { question: "Czy mieszkaniec może sam zarezerwować termin bez akceptacji?", answer: "Domyślnie rezerwacja wymaga zatwierdzenia przez sołtysa lub współadmina wsi. Dzięki temu unikasz nakładających się terminów i masz kontrolę nad wykorzystaniem obiektu." },
      { question: "Ile sal można dodać?", answer: "Możesz skonfigurować wiele sal lub pomieszczeń przypisanych do jednej wsi — np. świetlica główna i mniejsza świetliczka." },
      { question: "Czy widać dane osoby rezerwującej publicznie?", answer: "Publicznie widać zajęte terminy. Szczegóły wniosku (kontakt, cel imprezy) ma sołtys w panelu moderacji." },
    ],
  },

  "rynek-lokalny-na-wsi": {
    content: `<p>Na wsi handel często opiera się na zaufaniu: ktoś sprzedaje nadwyżki z ogrodu, ktoś szuka usług przy domu, sąsiad poleca sprawdzonego fachowca. <strong>Rynek lokalny</strong> na naszawies.pl zbiera ogłoszenia w jednym miejscu przypisanym do konkretnej miejscowości — bez przepełnionych grup na Facebooku i bez ogólnopolskich portali, gdzie Twoja oferta ginie w tłumie.</p>

<h2 id="dla-sprzedajacych">Dla sprzedających</h2>
<p>Po zalogowaniu dodaj ogłoszenie z opisem, ceną i zdjęciami. Sołtys może moderować wpisy przed publikacją — to filtr antyspamowy i ochrona mieszkańców przed podejrzanymi ofertami.</p>
<div class="blog-callout blog-callout-porada"><strong>Porada</strong><p>Dodaj 2–3 zdjęcia w dobrym świetle i podaj realną cenę. Ogłoszenia ze zdjęciami dostają więcej zapytań.</p></div>

<h2 id="dla-kupujacych">Dla kupujących</h2>
<p>Przeglądaj <a href="/rynek">hub rynku</a> lub ogłoszenia na profilu swojej wsi. Filtry kategorii ułatwiają znalezienie np. warzyw, usług rolniczych czy mebli. Możesz też obserwować profile sprzedawców z sąsiedztwa.</p>

<h2 id="kategorie">Popularne kategorie na wsi</h2>
<ul>
<li>Warzywa, owoce, jajka, mleko — produkty z gospodarstwa</li>
<li>Usługi: koszenie, transport, drobne remonty</li>
<li>Sprzęt rolniczy i ogrodniczy — używany, ale sprawny</li>
<li>Meble, odzież dziecięca — przekazane „do odebrania”</li>
</ul>

<h2 id="bezpieczenstwo">Bezpieczeństwo transakcji</h2>
<p>Spotykaj się w miejscu publicznym, nie przesyłaj zaliczek nieznajomym, zgłaszaj podejrzane ogłoszenia sołtysowi lub przez <a href="/zglos-naruszenie">formularz naruszeń</a>. Szczegółowy poradnik: <a href="/blog/bezpieczny-handel-sasiedzki">bezpieczny handel sąsiedzki</a>.</p>

<h2 id="moderacja">Rola sołtysa przy rynku</h2>
<p>Moderacja nie musi być cenzurą — to szybki przegląd: czy ogłoszenie dotyczy wsi, czy nie ma oczywistego spamu. Dzięki temu mieszkańcy czują się bezpieczniej, a rynek pozostaje lokalny.</p>

<hr class="blog-separator" />
<p>Zacznij od profilu wsi: <a href="/blog/jak-zalozyc-profil-wsi">jak założyć profil miejscowości</a>.</p>`,
    faq: [
      { question: "Czy rynek jest dostępny bez logowania?", answer: "Przeglądanie publicznych ogłoszeń na profilu wsi jest możliwe dla gości. Dodawanie ofert wymaga konta mieszkańca danej miejscowości." },
      { question: "Czy pobieracie prowizję od sprzedaży?", answer: "Nie — naszawies.pl nie jest pośrednikiem płatności. Umawiacie się bezpośrednio między sobą." },
      { question: "Jak zgłosić podejrzane ogłoszenie?", answer: "Użyj przycisku zgłoszenia na ogłoszeniu lub formularza naruszeń. Sołtys może też usunąć wpis w panelu moderacji." },
    ],
  },

  "jak-znalezc-swoja-wies": {
    content: `<p>Polska ma dziesiątki tysięcy miejscowości o podobnych nazwach — „Brzóza”, „Zalesie”, „Nowa Wieś” występują w wielu gminach. <strong>Katalog naszawies.pl</strong> opiera się na rejestrze TERYT, dzięki czemu wybierasz właściwą wieś po województwie, powiecie i gminie, a nie tylko po krótkiej nazwie.</p>

<h2 id="szukaj">Wyszukiwarka miejscowości</h2>
<p>Wejdź na <a href="/szukaj">Szukaj wsi</a> i wpisz nazwę miejscowości lub gminy. Wyniki pokazują pełny kontekst administracyjny — unikniesz pomyłki między dwoma „Zalesiami” w różnych powiatach.</p>
<div class="blog-callout blog-callout-porada"><strong>Porada</strong><p>Jeśli znasz tylko nazwę gminy, wyszukaj po niej i przejrzyj listę wsí w gminie.</p></div>

<h2 id="url">Czytelne adresy URL</h2>
<p>Profil publiczny ma strukturę: województwo / powiat / gmina / wieś. To ułatwia orientację i pozycjonowanie w Google — link jest opisowy, nie losowy.</p>

<h2 id="profil-vs-panel">Profil publiczny a panel po logowaniu</h2>
<table class="blog-tabela">
<thead><tr><th>Profil publiczny</th><th>Panel po zalogowaniu</th></tr></thead>
<tbody>
<tr><td>Widoczny dla wszystkich</td><td>Tylko dla mieszkańców i sołtysa</td></tr>
<tr><td>Opis, ogłoszenia, rynek</td><td>Edycja, moderacja, wnioski</td></tr>
<tr><td>Bez konta</td><td>Wymaga rejestracji</td></tr>
</tbody>
</table>

<h2 id="mapa">Mapa po zalogowaniu</h2>
<p>Po dołączeniu do wsi zyskujesz dostęp do <a href="/blog/mapa-wsi-po-zalogowaniu">mapy interaktywnej</a> z punktami POI i warstwami — to rozszerzenie katalogu, nie zamiennik profilu publicznego.</p>

<p>Następny krok: <a href="/blog/jak-zalozyc-profil-wsi">załóż profil swojej wsi</a>.</p>`,
    faq: [
      { question: "Nie widzę swojej wsi w katalogu — co robić?", answer: "Sprawdź pisownię i wyszukaj po gminie. Jeśli miejscowość jest w SIMC/TERC, powinna być dostępna. W razie braku skontaktuj się z nami przez formularz kontaktowy." },
      { question: "Czy mogę przeglądać inne wsie bez konta?", answer: "Tak — profile publiczne aktywnych wsi są dostępne dla gości." },
    ],
  },

  "rola-soltysa-narzedzia-cyfrowe": {
    content: `<p>Funkcja sołtysa to dziś coś więcej niż podpisywanie protokołów zebrania. Mieszkańcy oczekują szybkiej informacji, przejrzystych terminów świetlicy i miejsca na lokalne ogłoszenia. <strong>Panel sołtysa</strong> na naszawies.pl zbiera te zadania w jednym miejscu — bez konieczności prowadzenia osobnej strony WWW.</p>

<h2 id="narzedzia">Kluczowe narzędzia</h2>
<ul class="blog-lista-check">
<li>Edycja profilu publicznego wsi</li>
<li>Moderacja ogłoszeń i rynku lokalnego</li>
<li>Rezerwacje świetlicy i kalendarz</li>
<li>Zarządzanie organizacjami (KGW, OSP)</li>
<li>Mapa POI i zgłoszenia mieszkańców</li>
</ul>

<h2 id="czas">Ile czasu to zajmuje?</h2>
<p>Po pierwszym miesiącu konfiguracji większość sołtysów spędza w panelu <strong>15–30 minut tygodniowo</strong> — głównie akceptacja wniosków i jedno-dwa ogłoszenia. To mniej niż seria telefonów w niedzielę.</p>

<div class="blog-callout blog-callout-wazne"><strong>Ważne</strong><p>Możesz delegować uprawnienia — np. sekretarzowi zebrania lub przewodniczącej KGW — zamiast robić wszystko sam.</p></div>

<h2 id="plan">Plan wdrożenia</h2>
<p>Szczegółowy harmonogram na pół roku: <a href="/blog/cyfryzacja-solectwa-od-czego-zaczac">cyfryzacja sołectwa od czego zacząć</a>.</p>

<h2 id="wsparcie">Wsparcie</h2>
<p>Instrukcje krok po kroku w <a href="/pomoc">centrum pomocy</a>. Problemy techniczne zgłaszaj przez <a href="/kontakt">kontakt</a>.</p>`,
    faq: [
      { question: "Czy sołtys musi mieć komputer?", answer: "Panel działa też na telefonie. Do wgrania wielu zdjęć wygodniejszy jest laptop, ale codzienna moderacja jest możliwa z telefonu." },
      { question: "Co jeśli zmieni się sołtys?", answer: "Nowa osoba składa wniosek o rolę. Administrator weryfikuje i przenosi uprawnienia — historia wsi zostaje w systemie." },
    ],
  },

  "zebranie-wiejskie-swietlica": {
    content: `<p>Zebranie wiejskie, komunię, jubileusz KGW albo poprawiny — świetlica bywa zarezerwowana na kilka weekendów do przodu. Gdy terminy żyją w zeszycie u sołtysa i na kartce przy drzwiach, łatwo o nakładające się wydarzenia i nieporozumienia.</p>

<h2 id="jeden-kalendarz">Jeden kalendarz zamiast trzech zeszytów</h2>
<p>Na <strong>naszawies.pl</strong> mieszkańcy składają wniosek o termin online, a sołtys akceptuje go w panelu. Wszyscy widzą, kiedy sala jest zajęta — bez dzwonienia po sąsiadach.</p>
<figure><img src="/blog/zebranie-wiejskie-swietlica/visual-01.webp" alt="Planowanie rezerwacji świetlicy — porządek przy stole sołtysa" width="900" height="600" loading="lazy" /><figcaption>Uporządkowany kalendarz to mniej stresu przed ważnym zebraniem.</figcaption></figure>

<h2 id="regulamin">Regulamin pod ręką</h2>
<p>Wgraj regulamin świetlicy jako PDF lub zdjęcie. Mieszkaniec przeczyta zasady przed wysłaniem wniosku — mniej pytań o sprzątanie, kaucję czy godziny ciszy.</p>

<h2 id="zebranie">Zebranie a rezerwacja</h2>
<ol class="blog-lista-kroki">
<li>Ogłoś termin zebrania w kalendarzu wydarzeń</li>
<li>Zarezerwuj świetlicę na ten sam termin</li>
<li>Po zebraniu — skrót ustaleń na tablicy ogłoszeń</li>
</ol>

<div class="blog-callout blog-callout-porada"><strong>Porada</strong><p>Na zebraniu pokaż kalendarz na dużym ekranie lub wydruk z kodem QR do profilu wsi.</p></div>

<h2 id="po-zebraniu">Po zebraniu</h2>
<p>Ważne ustalenia warto wrzucić na profil wsi jako ogłoszenie. Osoby, które nie były obecne, i tak dowiedzą się o terminie zbiórki śmieci czy prac przy drodze.</p>

<p>Więcej: <a href="/blog/rezerwacja-swietlicy-poradnik">poradnik rezerwacji świetlicy</a>.</p>`,
    gallery: [
      "/blog/zebranie-wiejskie-swietlica/cover.webp",
      "/blog/zebranie-wiejskie-swietlica/visual-01.webp",
    ],
    faq: [
      { question: "Czy mieszkańcy widzą, kto zarezerwował salę?", answer: "Widoczne są zajęte terminy; szczegóły wniosku zobaczy sołtys w panelu moderacji — zgodnie z ustawieniami prywatności wsi." },
      { question: "Co jeśli dwa wydarzenia chcą ten sam termin?", answer: "Drugi wniosek czeka na decyzję sołtysa. Dzięki temu unikasz podwójnej rezerwacji bez wiedzy zarządcy obiektu." },
    ],
  },

  "mapa-wsi-po-zalogowaniu": {
    content: `<p>Katalog <a href="/szukaj">Szukaj wsi</a> pozwala znaleźć miejscowość po nazwie. <strong>Mapa interaktywna</strong> — dostępna po zalogowaniu — pokazuje kontekst: sąsiednie wsie, punkty POI, warstwy tematyczne i granice administracyjne.</p>

<h2 id="dla-mieszkanca">Dla mieszkańca</h2>
<p>Sprawdzisz, gdzie jest przystanek, świetlica, ciekawe miejsce dodane przez sąsiadów albo organizację lokalną. To skrót, gdy ktoś pyta „jak dojechać na pole” albo „gdzie jest nowa kapliczka”.</p>
<figure><img src="/blog/mapa-wsi-po-zalogowaniu/visual-01.webp" alt="Mapa wsi na telefonie — orientacja w terenie" width="900" height="600" loading="lazy" /><figcaption>Mapa w telefonie ułatwia pokazanie gościom drogi do wydarzenia we wsi.</figcaption></figure>

<h2 id="dla-soltysa">Dla sołtysa</h2>
<p>W panelu możesz zgłaszać i edytować punkty na mapie wsi — np. miejsce zbiórki, plac zabaw po remoncie czy punkt widokowy. Mieszkańcy widzą aktualną wersję bez osobnych plakatów.</p>

<h2 id="warstwy">Warstwy i granice</h2>
<ul class="blog-lista-check">
<li>Granice administracyjne gminy i powiatu</li>
<li>Punkty POI dodane przez społeczność</li>
<li>Transport i przystanki (tam gdzie dostępne)</li>
</ul>

<div class="blog-callout blog-callout-uwaga"><strong>Ważne</strong><p>Nie umieszczaj na mapie publicznej dokładnego adresu mieszkania bez zgody właściciela — stosuj punkty zbiorcze (świetlica, sklep).</p></div>

<p>Powiązane: <a href="/blog/jak-znalezc-swoja-wies">jak znaleźć swoją wieś</a>.</p>`,
    gallery: [
      "/blog/mapa-wsi-po-zalogowaniu/cover.webp",
      "/blog/mapa-wsi-po-zalogowaniu/visual-01.webp",
    ],
    faq: [
      { question: "Czy mapa działa offline?", answer: "Wymaga połączenia z internetem do załadowania kafelków i danych. Warto otworzyć mapę wcześniej przed wyjściem w teren." },
      { question: "Kto może dodawać punkty POI?", answer: "Sołtys i uprawnione osoby w panelu; propozycje mieszkańców mogą przechodzić moderację." },
    ],
  },

  "kgw-integracja-spolecznosci": {
    content: `<p>Koło Gospodyń Wiejskich to często motor integracji — kiermasze, warsztaty, wspólne gotowanie. W internecie jednak wiele kół nie ma stałego miejsca poza przypadkowymi postami w mediach społecznościowych.</p>

<h2 id="profil-organizacji">Profil organizacji na profilu wsi</h2>
<p>Na <strong>naszawies.pl</strong> KGW może mieć podstronę z opisem, zdjęciem okładki i kalendarzem wydarzeń. Link jest stabilny i czytelny — łatwo go podać w urzędzie gminy albo w programie festynu.</p>
<figure><img src="/blog/kgw-integracja-spolecznosci/visual-01.webp" alt="Przygotowania do wiejskiego wydarzenia integracyjnego" width="900" height="600" loading="lazy" /><figcaption>Wspólne wydarzenia warto zapowiadać z wyprzedzeniem na profilu wsi.</figcaption></figure>

<h2 id="wspolpraca-z-soltysem">Współpraca z sołtysem</h2>
<p>Sołtys moderuje role w wiosce — przewodnicząca KGW może otrzymać uprawnienia do aktualizacji treści swojej organizacji. Dzięki temu ogłoszenia nie giną wśród innych modułów.</p>

<h2 id="fotorelacje">Fotorelacje i kiermasze</h2>
<p>Po kiermaszu wrzuć zdjęcia do fotokroniki wsi — <a href="/blog/fotokronika-i-historia-wsi">jak archiwizować zdjęcia</a>. Wydarzenie dodaj do <a href="/blog/kalendarz-wydarzen-wiejskich">kalendarza</a> z rocznym wyprzedzeniem, żeby turyści i sąsiedzi mogli planować.</p>

<div class="blog-callout blog-callout-porada"><strong>Porada</strong><p>W opisie KGW podaj godziny spotkań i kontakt do osoby zbierającej nowe członkinie — to najczęstsze pytanie w sezonie jesiennym.</p></div>

<p>Zobacz też: <a href="/blog/zebranie-wiejskie-swietlica">zebranie i świetlica</a>.</p>`,
    gallery: [
      "/blog/kgw-integracja-spolecznosci/cover.webp",
      "/blog/kgw-integracja-spolecznosci/visual-01.webp",
    ],
    faq: [
      { question: "Czy KGW musi mieć osobne konto?", answer: "Organizacja działa w ramach profilu wsi. Uprawnienia edycji może mieć przewodnicząca bez osobnej rejestracji całego koła." },
      { question: "Czy można promować kiermasz poza wsią?", answer: "Publiczne wydarzenia na profilu wsi są widoczne w wyszukiwarce — to naturalna promocja dla gości z okolicy." },
    ],
  },
};

export const noweArtykuly = [
  {
    title: "Kalendarz wydarzeń wiejskich — jak ogłaszać i nie gubić terminów",
    slug: "kalendarz-wydarzen-wiejskich",
    excerpt: "Zebrania, festyny, kiermasze KGW i mecze — jeden kalendarz na profilu wsi zamiast rozproszonych postów w mediach społecznościowych.",
    coverImage: "/blog/kalendarz-wydarzen-wiejskich/cover.webp",
    gallery: [],
    authorId: "zespol",
    categorySlug: "spolecznosc",
    tags: ["kalendarz", "wydarzenia", "festyn", "zebranie"],
    faq: [
      { question: "Kto może dodawać wydarzenia?", answer: "Sołtys i uprawnione osoby w panelu wsi oraz — zależnie od ustawień — mieszkańcy po moderacji. Organizacje (KGW, OSP) mogą mieć własne podstrony z kalendarzem." },
      { question: "Czy wydarzenia są widoczne poza wsią?", answer: "Publiczne wydarzenia zatwierdzone na profilu wsi mogą być indeksowane i widoczne dla gości oraz w wynikach wyszukiwania." },
    ],
    relatedSlugs: ["zebranie-wiejskie-swietlica", "kgw-integracja-spolecznosci"],
    featured: true,
    status: "published",
    publishedAt: "2026-06-09T08:00:00.000Z",
    seoTitle: "Kalendarz wydarzeń na wsi — poradnik naszawies.pl",
    seoDescription: "Jak prowadzić kalendarz wydarzeń wiejskich online: zebrania, festyny, spotkania organizacji — jeden harmonogram dla całej społeczności.",
    internalLinks: [
      { href: "/szukaj", label: "Znajdź swoją wieś" },
      { href: "/pomoc", label: "Pomoc" },
    ],
    generatedImages: [],
    content: `<p>Każda wieś ma swój rytm: wiosenne zebranie, letni festyn, jesienny kiermasz, wigilijne spotkanie. Gdy terminy żyją wyłącznie na Facebooku, starsi mieszkańcy często ich nie widzą, a młodzi tracą wzmiankę w scrollowaniu. <strong>Kalendarz na profilu wsi</strong> rozwiązuje ten problem — jeden harmonogram, stały link, powiadomienia w panelu.</p>

<h2 id="co-wpisac">Co wpisywać do kalendarza?</h2>
<ul class="blog-lista-check">
<li>Zebrania wiejskie i komisje</li>
<li>Festyny, dożynki, koncerty na boisku</li>
<li>Spotkania KGW, OSP, koła łowieckiego</li>
<li>Terminy nabożeństw i uroczystości (jeśli organizacja tego chce)</li>
<li>Zbiórki, akcje sprzątania, sadzenia drzew</li>
</ul>

<h2 id="jak-publikowac">Jak publikować, żeby dotrzeć do sąsiadów</h2>
<ol class="blog-lista-kroki">
<li>Dodaj wydarzenie z datą, godziną i miejscem (świetlica, boisko, kościół)</li>
<li>Dołącz krótki opis: dla kogo, czy wstęp wolny, co zabrać</li>
<li>Opublikuj ogłoszenie na profilu wsi z linkiem do wydarzenia</li>
<li>Na zebraniu podaj adres profilu — nie tylko „będzie na Facebooku”</li>
</ol>

<div class="blog-callout blog-callout-porada"><strong>Porada</strong><p>Wydarzenia cykliczne (np. „każda pierwsza sobota miesiąca”) warto opisać w regulaminie organizacji i powtarzać w kalendarzu z wyprzedzeniem na cały kwartał.</p></div>

<h2 id="integracja">Świetlica i wydarzenia</h2>
<p>Jeśli impreza wymaga sali, połącz termin w kalendarzu z <a href="/blog/rezerwacja-swietlicy-poradnik">rezerwacją świetlicy</a>. Unikniesz sytuacji, w której wydarzenie jest ogłoszone, a sala zajęta przez inną grupę.</p>

<h2 id="kgw-osp">Organizacje lokalne</h2>
<p>KGW, OSP i inne grupy mogą mieć własne podstrony z własnymi terminami — szczegóły w artykule <a href="/blog/kgw-integracja-spolecznosci">KGW w internecie</a>.</p>`,
  },
  {
    title: "Bezpieczny handel sąsiedzki — zasady dla kupujących i sprzedających",
    slug: "bezpieczny-handel-sasiedzki",
    excerpt: "Jak handlować z sąsiadami przez rynek lokalny bez zaliczek oszustom, niejasnych ustaleń i konfliktów na linii ogrodów.",
    coverImage: "/blog/bezpieczny-handel-sasiedzki/cover.webp",
    gallery: [],
    authorId: "zespol",
    categorySlug: "rynek",
    tags: ["rynek", "bezpieczenstwo", "ogloszenia", "oszustwa"],
    faq: [
      { question: "Czy naszawies.pl gwarantuje transakcję?", answer: "Nie — platforma udostępnia tablicę ogłoszeń. Płatności i odbiór towaru ustalacie bezpośrednio między stronami." },
      { question: "Co zrobić, gdy kupujący nie przyjedzie?", answer: "To kwestia ustaleń między stronami. Warto ustalać konkretną godzinę odbioru i potwierdzać SMS-em." },
    ],
    relatedSlugs: ["rynek-lokalny-na-wsi", "jak-zalozyc-profil-wsi"],
    featured: false,
    status: "published",
    publishedAt: "2026-06-10T08:00:00.000Z",
    seoTitle: "Bezpieczny handel na wsi — poradnik rynku lokalnego",
    seoDescription: "Zasady bezpiecznych transakcji między sąsiadami: spotkania, płatności, zgłaszanie nadużyć na naszawies.pl.",
    internalLinks: [{ href: "/rynek", label: "Rynek lokalny" }, { href: "/zglos-naruszenie", label: "Zgłoś naruszenie" }],
    generatedImages: [],
    content: `<p>Lokalny rynek to zaufanie — ale nie wyklucza ostrożności. Większość transakcji między sąsiadami przebiega spokojnie; problemy zwykle wynikają z niejasnych ustaleń lub ofert od osób spoza wsi. Poniżej zestaw praktycznych zasad.</p>

<h2 id="dla-kupujacych">Dla kupujących</h2>
<ul class="blog-lista-check">
<li>Spotykaj się w miejscu publicznym lub za dnia u sprzedawcy z sąsiedztwa</li>
<li>Nie płać zaliczek osobom, których nie znasz</li>
<li>Sprawdź towar przed zapłatą — szczególnie elektronikę i maszyny</li>
<li>Zgłaszaj podejrzane ogłoszenia sołtysowi</li>
</ul>

<h2 id="dla-sprzedajacych">Dla sprzedających</h2>
<p>Podawaj realny stan przedmiotu i aktualne zdjęcia. Jeśli coś jest „do naprawy”, napisz to wprost — unikniesz kłótni przy odbiorze.</p>
<div class="blog-callout blog-callout-uwaga"><strong>Uwaga</strong><p>Nie publikuj swojego pełnego adresu w opisie ogłoszenia. Ustal miejsce odbioru w wiadomości po wstępnym kontakcie.</p></div>

<h2 id="czerwone-flagi">Czerwone flagi</h2>
<table class="blog-tabela">
<thead><tr><th>Sygnał</th><th>Działanie</th></tr></thead>
<tbody>
<tr><td>Cena zaniżona „na już”, presja na przelew</td><td>Odmów, zgłoś ogłoszenie</td></tr>
<tr><td>Konto spoza wsi, brak moderacji</td><td>Poinformuj sołtysa</td></tr>
<tr><td>Prośba o kod BLIK „na zadatek”</td><td>Nie wysyłaj — spotkanie osobiste</td></tr>
</tbody>
</table>

<p>Więcej o module rynku: <a href="/blog/rynek-lokalny-na-wsi">rynek lokalny na wsi</a>.</p>`,
  },
  {
    title: "Tablica ogłoszeń cyfrowa — zamiast kartki przy sklepie",
    slug: "tablica-ogloszen-cyfrowa",
    excerpt: "Ogłoszenia parafialne, prace sezonowe, zaginione koty — jak prowadzić cyfrową tablicę na profilu wsi, żeby dotrzeć do wszystkich pokoleń.",
    coverImage: "/blog/tablica-ogloszen-cyfrowa/cover.webp",
    gallery: [],
    authorId: "zespol",
    categorySlug: "poradniki",
    tags: ["ogloszenia", "komunikacja", "tablica", "informacje"],
    faq: [
      { question: "Czy ogłoszenia znikają po czasie?", answer: "Sołtys lub autor może archiwizować nieaktualne wpisy. Warto oznaczać datę ważności w treści ogłoszenia." },
    ],
    relatedSlugs: ["jak-zalozyc-profil-wsi", "kalendarz-wydarzen-wiejskich"],
    featured: false,
    status: "published",
    publishedAt: "2026-06-11T08:00:00.000Z",
    seoTitle: "Cyfrowa tablica ogłoszeń wsi — naszawies.pl",
    seoDescription: "Jak zastąpić (lub uzupełnić) tablicę przy sklepie cyfrową tablicą ogłoszeń na profilu wsi.",
    internalLinks: [{ href: "/rejestracja", label: "Załóż konto" }],
    generatedImages: [],
    content: `<p>Tablica przy sklepie spożywczym to instytucja — ale nie każdy tam zagląda, a deszcz szybko niszczy kartkę. <strong>Cyfrowa tablica</strong> na profilu wsi działa 24/7, jest czytelna na telefonie i może mieć archiwum.</p>

<h2 id="co-oglaszac">Co ogłaszać online?</h2>
<ul>
<li>Zebrania i zmiany terminów</li>
<li>Poszukiwani zaginionych zwierząt</li>
<li>Oferty pracy sezonowej w okolicy</li>
<li>Informacje z urzędu gminy (po zebraniu)</li>
<li>Sprzedaż sadzonek, wędlin, miodu — z linkiem do rynku</li>
</ul>

<h2 id="jak-pisac">Jak pisać skuteczne ogłoszenia</h2>
<ol class="blog-lista-kroki">
<li><strong>Tytuł:</strong> konkret („Zbiórka śmieci 12 czerwca, godz. 9:00”)</li>
<li><strong>Treść:</strong> gdzie, kiedy, kogo dotyczy, kontakt</li>
<li><strong>Data ważności:</strong> usuń lub zaktualizuj po terminie</li>
</ol>

<div class="blog-callout blog-callout-porada"><strong>Porada</strong><p>Nie zakładaj, że „wszyscy wiedzą”. Starsi mieszkańcy docenią krótkie zdania i duży kontrast — unikaj żargonu.</p></div>

<p>Powiązane: <a href="/blog/jak-zalozyc-profil-wsi">założenie profilu wsi</a>.</p>`,
  },
  {
    title: "Cyfryzacja sołectwa — od czego zacząć w pierwszym semestrze",
    slug: "cyfryzacja-solectwa-od-czego-zaczac",
    excerpt: "Plan pięciu kroków dla sołtysa: profil wsi, tablica, świetlica, rynek i podsumowanie na zebraniu — bez rewolucji w jeden weekend.",
    coverImage: "/blog/cyfryzacja-solectwa-od-czego-zaczac/cover.webp",
    gallery: [],
    authorId: "zespol",
    categorySlug: "soltys",
    tags: ["soltys", "cyfryzacja", "plan", "solectwo"],
    faq: [
      { question: "Czy muszę umieć programować?", answer: "Nie. Panel sołtysa jest graficzny — jak formularz w urzędzie, tylko online." },
      { question: "Ile czasu to zajmuje tygodniowo?", answer: "Po starcie zwykle 15–30 minut tygodniowo na moderację ogłoszeń i wniosków o świetlicę." },
    ],
    relatedSlugs: ["rola-soltysa-narzedzia-cyfrowe", "jak-zalozyc-profil-wsi"],
    featured: true,
    status: "published",
    publishedAt: "2026-06-12T08:00:00.000Z",
    seoTitle: "Cyfryzacja sołectwa — plan pierwszych kroków",
    seoDescription: "Praktyczny plan cyfryzacji wsi dla sołtysa: kolejność wdrożeń, komunikacja z mieszkańcami, unikanie przeciążenia.",
    internalLinks: [{ href: "/pomoc", label: "Centrum pomocy" }],
    generatedImages: [],
    content: `<p>„Musimy wejść do internetu” — słyszy to wielu sołtysów na zebraniu. Rzadko kto mówi <em>jak</em> to zrobić bez dodatkowej pracy na wieczory. Poniżej realistyczny plan na pierwsze pół roku, oparty na modułach naszawies.pl.</p>

<h2 id="miesiac-1">Miesiąc 1: Fundament</h2>
<ul class="blog-lista-check">
<li>Założenie profilu wsi i opis miejscowości</li>
<li>Pierwsze ogłoszenie o zebraniu z linkiem do profilu</li>
<li>Zaproszenie 10–15 aktywnych mieszkańców</li>
</ul>

<h2 id="miesiac-2">Miesiąc 2: Komunikacja</h2>
<p>Cyfrowa tablica ogłoszeń zamiast powtarzania tych samych informacji telefonicznie. Kalendarz wydarzeń na kwartał do przodu.</p>

<h2 id="miesiac-3">Miesiąc 3: Usługi</h2>
<p>Świetlica online (jeśli macie salę) i rynek lokalny — często najbardziej oczekiwane przez mieszkańców.</p>

<div class="blog-callout blog-callout-wazne"><strong>Ważne</strong><p>Nie włączaj wszystkiego naraz. Lepiej dwa działające moduły niż pięć pustych zakładek.</p></div>

<h2 id="podsumowanie">Podsumowanie na zebraniu</h2>
<p>Co kwartał krótko: ile kont, ile ogłoszeń, co działa, czego brakuje. To buduje zaufanie do cyfryzacji — mieszkańcy widzą sens, nie modę.</p>

<p>Więcej narzędzi: <a href="/blog/rola-soltysa-narzedzia-cyfrowe">rola sołtysa w sieci</a>.</p>`,
  },
  {
    title: "Fotokronika wsi — jak archiwizować zdjęcia i historię miejscowości",
    slug: "fotokronika-i-historia-wsi",
    excerpt: "Zdjęcia z dożynek, starych chat, remontów — moduł fotokroniki i historii wsi pomaga zachować pamięć społeczności w jednym miejscu.",
    coverImage: "/blog/fotokronika-i-historia-wsi/cover.webp",
    gallery: [],
    authorId: "zespol",
    categorySlug: "spolecznosc",
    tags: ["fotokronika", "historia", "zdjecia", "pamiec"],
    faq: [
      { question: "Kto może dodawać zdjęcia?", answer: "Zależy od ustawień wsi — sołtys może włączyć dodawanie dla mieszkańców z moderacją lub ograniczyć do zespołu." },
      { question: "Czy zdjęcia są publiczne?", answer: "Publiczne albumy na profilu wsi są widoczne dla gości. Prywatne materiały trzymaj poza platformą." },
    ],
    relatedSlugs: ["kgw-integracja-spolecznosci", "jak-zalozyc-profil-wsi"],
    featured: false,
    status: "published",
    publishedAt: "2026-06-13T08:00:00.000Z",
    seoTitle: "Fotokronika i historia wsi online",
    seoDescription: "Jak prowadzić cyfrową fotokronikę miejscowości: archiwum zdjęć, opisy, moderacja i współpraca mieszkańców.",
    internalLinks: [{ href: "/o-nas", label: "O naszawies.pl" }],
    generatedImages: [],
    content: `<p>Każda wieś ma swoją historię — często w segregatorach u sołtysa i na dyskach u dziesięciu osób. <strong>Fotokronika</strong> na naszawies.pl porządkuje zdjęcia z imprez, remontów i codzienności, żeby po latach dało się wrócić do wspomnień bez przekopywania pendrive'ów.</p>

<h2 id="od-czego-zaczac">Od czego zacząć archiwum?</h2>
<ol class="blog-lista-kroki">
<li>Zbierz 20–30 najlepszych zdjęć z ostatnich 5 lat (festyny, zebrania, remonty)</li>
<li>Dodaj krótkie podpisy: rok, okazja, kto organizował</li>
<li>Poproś KGW i OSP o skan starej fotografii — jedna na miesiąc</li>
</ol>

<h2 id="wspolpraca">Współpraca mieszkańców</h2>
<p>Możesz poprosić o zdjęcia przez ogłoszenie na profilu wsi. Moderacja chroni przed treściami nie na miejscu lub naruszeniem prywatności (np. zdjęcia dzieci bez zgody).</p>

<div class="blog-callout blog-callout-porada"><strong>Porada</strong><p>Twórz albumy tematyczne: „Dożynki”, „Remont boiska”, „Stare chaty” — łatwiej przeglądać niż jeden wielki worek zdjęć.</p></div>

<h2 id="historia">Moduł historii wsi</h2>
<p>Oprócz zdjęć warto dopisywać krótkie artykuły: kiedy powstało sołectwo, ciekawostki architektoniczne, znani mieszkańcy. To treść, która przyciąga także osoby szukające genealogii i turystyki wiejskiej.</p>

<p>Zobacz też: <a href="/blog/kgw-integracja-spolecznosci">KGW w internecie</a>.</p>`,
  },
  {
    title: "OSP na profilu wsi — jak pokazać działalność straży w internecie",
    slug: "osp-na-profilu-wsi",
    excerpt:
      "Profil organizacji, kontakt do naczelnika, zdjęcia z akcji i zapowiedzi szkoleń — Ochotnicza Straż Pożarna może być widoczna na naszawies.pl obok KGW i parafii.",
    coverImage: "/blog/osp-na-profilu-wsi/cover.webp",
    gallery: ["/blog/osp-na-profilu-wsi/cover.webp", "/blog/osp-na-profilu-wsi/visual-01.webp"],
    authorId: "zespol",
    categorySlug: "spolecznosc",
    tags: ["osp", "straż pożarna", "organizacje", "bezpieczeństwo", "wolontariat"],
    faq: [
      {
        question: "Kto może edytować profil OSP?",
        answer:
          "Sołtys nadaje rolę naczelnika OSP lub współadmina organizacji. Dzięki temu aktualizacje nie wymagają logowania się na konto sołtysa.",
      },
      {
        question: "Czy profil OSP jest widoczny publicznie?",
        answer:
          "Tak — publiczna podstrona organizacji na profilu wsi jest dostępna dla gości, podobnie jak KGW czy parafia. Nie publikuj danych wrażliwych z akcji ratowniczych.",
      },
      {
        question: "Czy można zbierać wolontariuszy przez platformę?",
        answer:
          "W opisie i ogłoszeniach podaj kontakt do naczelnika oraz terminy szkoleń. Formularz zgłoszeniowy możesz linkować z urzędu gminy lub PSP.",
      },
    ],
    relatedSlugs: ["kgw-integracja-spolecznosci", "kalendarz-wydarzen-wiejskich", "tablica-ogloszen-cyfrowa"],
    featured: false,
    status: "published",
    publishedAt: "2026-06-14T08:00:00.000Z",
    seoTitle: "OSP na profilu wsi — widoczność straży pożarnej online",
    seoDescription:
      "Jak Ochotnicza Straż Pożarna może prowadzić profil na naszawies.pl: kontakt, wydarzenia, współpraca z sołtysem i bezpieczna komunikacja z mieszkańcami.",
    ogImage: "/blog/osp-na-profilu-wsi/cover.webp",
    internalLinks: [
      { href: "/rejestracja", label: "Załóż konto" },
      { href: "/pomoc", label: "Centrum pomocy" },
    ],
    generatedImages: ["/blog/osp-na-profilu-wsi/cover.webp", "/blog/osp-na-profilu-wsi/visual-01.webp"],
    content: `<p>Ochotnicza Straż Pożarna to dla wielu wsi twarz bezpieczeństwa — gaszenie pożarów, pomoc przy wypadkach, straże przy dożynkach. W sieci często brakuje jednego, stałego miejsca z kontaktem i aktualnymi informacjami. Na <strong>naszawies.pl</strong> OSP może mieć profil organizacji przypisany do wsi, obok KGW, parafii i innych podmiotów lokalnych.</p>

<div class="blog-pullquote">Dobry profil OSP to nie zastępstwo alarmu 112 — to miejsce, gdzie sąsiad znajdzie numer do naczelnika i datę najbliższego szkolenia.</div>

<h2 id="co-wpisac">Co umieścić na profilu OSP?</h2>
<ul class="blog-lista-check">
<li>Krótki opis jednostki: od kiedu działa, ile osób w zespole</li>
<li>Kontakt do naczelnika lub zastępcy — telefon, e-mail (bez danych prywatnych całej ekipy)</li>
<li>Zdjęcie sprzętu lub remizy — mieszkańcy rozpoznają „swoją” straż</li>
<li>Link do strony PSP lub gminy, jeśli macie wspólne materiały szkoleniowe</li>
</ul>

<h2 id="wspolpraca">Współpraca z sołtysem</h2>
<p>Sołtys zarządza rolami we wsi. Naczelnik OSP może otrzymać uprawnienia do edycji treści swojej organizacji — bez przekazywania hasła do panelu sołtysa. To ten sam model co przy <a href="/blog/kgw-integracja-spolecznosci">KGW na profilu wsi</a>.</p>
<figure><img src="/blog/osp-na-profilu-wsi/visual-01.webp" alt="Ochotnicza Straż Pożarna — remiza i zespół przy sprzęcie ratowniczym" width="900" height="600" loading="lazy" /><figcaption>Profil OSP warto uzupełnić zdjęciem remizy lub sprzętu — buduje rozpoznawalność w okolicy.</figcaption></figure>

<h2 id="wydarzenia">Szkolenia, straże i zbiórki</h2>
<p>Zapowiedzi szkoleń dla wolontariuszy, straże przy festynach czy zbiórki na sprzęt — to treści, które dobrze trafiają na <a href="/blog/tablica-ogloszen-cyfrowa">cyfrową tablicę ogłoszeń</a> i do <a href="/blog/kalendarz-wydarzen-wiejskich">kalendarza wydarzeń</a>. Dzięki temu mieszkańcy widzą, kiedy OSP jest zajęta służbą, a kiedy szuka nowych ludzi do zespołu.</p>

<div class="blog-callout blog-callout-uwaga"><strong>Ważne</strong><p>Nie publikuj szczegółów trwających akcji ratowniczych, wizerunku poszkodowanych ani informacji poufnych. Po zakończeniu interwencji wystarczy krótka informacja podziękowania dla zaangażowanych — jeśli pozwala na to regulamin PSP.</p></div>

<h2 id="rekrutacja">Jak mówić o wolontariacie</h2>
<ol class="blog-lista-kroki">
<li>Napisz wprost: „Szukamy ochotników” — bez żargonu wojskowego</li>
<li>Podaj wiek, wymagania zdrowotne i gdzie się zgłosić</li>
<li>Dodaj termin pierwszego spotkania informacyjnego</li>
<li>Odnoś się do tradycji wsi — wielu strażaków to rodziny wielopokoleniowe</li>
</ol>

<h2 id="bezpieczenstwo">Bezpieczeństwo i RODO</h2>
<p>Na profilu publicznym nie umieszczaj list członków z adresami zamieszkania. Zdjęcia z imprez publikuj po zgodzie osób widocznych na fotografii — szczególnie dzieci. Więcej o ostrożności w sieci: <a href="/polityka-prywatnosci">polityka prywatności</a> serwisu.</p>

<hr class="blog-separator" />
<p>Powiązane: <a href="/blog/fotokronika-i-historia-wsi">fotokronika wsi</a>, <a href="/blog/jak-zalozyc-profil-wsi">założenie profilu miejscowości</a>.</p>`,
  },
  {
    title: "Transport i przystanki na mapie wsi — dojazd bez zgadywania",
    slug: "transport-i-przystanki-mapa-wsi",
    excerpt:
      "Przystanki autobusowe, stacje kolejowe i odjazdy w jednym widoku — jak mapa naszawies.pl pomaga mieszkańcom i gościom zaplanować dojazd.",
    coverImage: "/blog/transport-i-przystanki-mapa-wsi/cover.webp",
    gallery: [
      "/blog/transport-i-przystanki-mapa-wsi/cover.webp",
      "/blog/transport-i-przystanki-mapa-wsi/visual-01.webp",
    ],
    authorId: "zespol",
    categorySlug: "poradniki",
    tags: ["transport", "mapa", "przystanek", "kolej", "autobus"],
    faq: [
      {
        question: "Skąd biorą się przystanki na mapie?",
        answer:
          "System uzupełnia punkty z otwartych danych (OSM, GTFS, PKP) oraz propozycji mieszkańców po moderacji. Sołtys może zatwierdzać brakujące miejsca.",
      },
      {
        question: "Czy widać rozkłady jazdy na żywo?",
        answer:
          "Tam, gdzie dostępne są dane przewoźnika lub PKP, mapa pokazuje zbliżone odjazdy i link do rozkładu. Zawsze warto sprawdzić oficjalną stronę przewoźnika przed wyjazdem.",
      },
      {
        question: "Czy mapa transportu działa bez logowania?",
        answer:
          "Podstawowy podgląd mapy wymaga konta — to chroni przed nadużyciami i pozwala dopasować warstwy do Twojej wsi. Rejestracja jest bezpłatna.",
      },
    ],
    relatedSlugs: ["mapa-wsi-po-zalogowaniu", "jak-znalezc-swoja-wies", "kalendarz-wydarzen-wiejskich"],
    featured: true,
    status: "published",
    publishedAt: "2026-06-15T08:00:00.000Z",
    seoTitle: "Transport wiejski na mapie — przystanki i kolej na naszawies.pl",
    seoDescription:
      "Przystanki PKS, autobusy gminne i stacje PKP na mapie wsi. Jak czytać warstwy transportu i planować dojazd na zebranie lub do pracy.",
    ogImage: "/blog/transport-i-przystanki-mapa-wsi/cover.webp",
    internalLinks: [
      { href: "/mapa", label: "Mapa wsi" },
      { href: "/logowanie", label: "Logowanie" },
    ],
    generatedImages: [
      "/blog/transport-i-przystanki-mapa-wsi/cover.webp",
      "/blog/transport-i-przystanki-mapa-wsi/visual-01.webp",
    ],
    content: `<p>Na wsi bez własnego samochodu dojazd do pracy, lekarza czy urzędu bywa układanką: autobus raz dziennie, przystanek „za lasem”, kolej w sąsiedniej miejscowości. Rozkład na papierze szybko się starzeje, a w wyszukiwarce Google nie zawsze widać <em>ten</em> przystanek od strony pola. Mapa na <strong>naszawies.pl</strong> zbiera transport w kontekście konkretnej wsi — razem z świetlicą, sklepem i innymi punktami POI.</p>

<h2 id="warstwy">Warstwy transportu na mapie</h2>
<p>Po zalogowaniu wejdź na <a href="/mapa">mapę</a> i włącz filtry m.in. przystanków autobusowych, stacji kolejowych i parkingów P+R. Punkty są powiązane z Twoją miejscowością lub jej bezpośrednim sąsiedztwem — nie musisz szukać po całym powiecie.</p>
<ul class="blog-lista-check">
<li>Przystanki komunikacji lokalnej i PKS</li>
<li>Stacje i przystanki kolejowe PKP — z linkiem do rozkładu</li>
<li>Miejsca postoju i przesiadki (tam gdzie oznaczone w danych)</li>
<li>Informacje o utrudnieniach — gdy dostępne z API przewoźnika</li>
</ul>

<figure><img src="/blog/transport-i-przystanki-mapa-wsi/visual-01.webp" alt="Mapa wiejskiego przystanku autobusowego przy drodze do gminy" width="900" height="600" loading="lazy" /><figcaption>Przystanek na mapie ułatwia wytłumaczenie gościom, gdzie wysiąść przed zebraniem we wsi.</figcaption></figure>

<h2 id="dla-mieszkanca">Dla mieszkańca</h2>
<p>Sprawdzisz, który przystanek jest bliżej domu, ile masz czasu po porannym kursie do miasta i gdzie jest najbliższa stacja kolejowa. Przy planowaniu wyjazdu na <a href="/blog/zebranie-wiejskie-swietlica">zebranie wiejskie</a> możesz wysłać sąsiadowi pinezkę zamiast opisywać drogę przez trzy skrzyżowania.</p>

<h2 id="dla-soltysa">Dla sołtysa i radnych</h2>
<p>Jeśli po remoncie drogi przystanek się przesunął albo uruchomiono nowy kurs gminny — zgłoś aktualizację w panelu. Społeczność widzi zmianę na mapie szybciej niż doczeka się nowej tabliczki przy słupie. To też argument na zebraniu wójtowi: widać, gdzie mieszkańcy realnie mają problem z dojazdem.</p>

<div class="blog-callout blog-callout-porada"><strong>Porada</strong><p>Przy ogłoszeniu o zebraniu dopisz: „Najbliższy przystanek na mapie wsi” z linkiem do profilu — młodsi mieszkańcy chętniej przyjadą, gdy widzą konkret.</p></div>

<h2 id="pkp">Kolej i autobus — jeden widok</h2>
<p>Wielu mieszkańców dojeżdża „combo”: PKS do stacji, potem pociąg. Mapa pokazuje oba typy punktów, żeby nie przełączać się między trzema aplikacjami. Rozkłady pochodzą z zewnętrznych źródeł — przed ważnym wyjazdem sprawdź jeszcze oficjalną stronę PKP lub przewoźnika.</p>

<table class="blog-tabela">
<thead><tr><th>Sytuacja</th><th>Co zrobić na mapie</th></tr></thead>
<tbody>
<tr><td>Pierwszy raz jadę do wsi</td><td>Włącz stację kolejową + przystanki, ustaw widok na profil wsi</td></tr>
<tr><td>Brakuje przystanku</td><td>Zgłoś punkt w panelu lub poproś sołtysa o moderację</td></tr>
<tr><td>Opóźnienie pociągu</td><td>Sprawdź baner utrudnień przy stacji na mapie, potem PKP</td></tr>
</tbody>
</table>

<h2 id="ograniczenia">Czego mapa nie zastąpi</h2>
<p>Nie zamawia biletów ani taksówek — to planowanie i orientacja. W nagłych sytuacjach zawsze dzwoń pod 112 lub numer alarmowy straży. Dane automatyczne mogą mieć opóźnienie; przy śnieżycy i remontach drogowych licz się z lokalnymi komunikatami gminy.</p>

<hr class="blog-separator" />
<p>Więcej o mapie: <a href="/blog/mapa-wsi-po-zalogowaniu">mapa wsi po zalogowaniu</a>, <a href="/blog/jak-znalezc-swoja-wies">jak znaleźć swoją wieś</a>.</p>`,
  },
];
