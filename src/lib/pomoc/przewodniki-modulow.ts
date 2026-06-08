export type IdModuluPomocy =
  | "zgloszenia"
  | "marketplace"
  | "swietlica"
  | "fotokronika"
  | "pomoc-sasiedzka"
  | "ogloszenia"
  | "lista-zakupow"
  | "rezerwacje-soltys"
  | "spolecznosc"
  | "lesnictwo"
  | "rolnictwo"
  | "lowiectwo"
  | "kalendarz-lowiecki"
  | "transport"
  | "szkola";

export type PrzewodnikModulu = {
  tytul: string;
  kroki: { tytul: string; opis: string }[];
  linkPelny?: { href: string; label: string };
};

export const PRZEWODNIKI_MODULOW: Record<IdModuluPomocy, PrzewodnikModulu> = {
  zgloszenia: {
    tytul: "Zgłoszenia do sołtysa",
    kroki: [
      { tytul: "Co zgłaszać", opis: "Dziury w drodze, oświetlenie, śmieci, zalanie — sprawy gminne, nie błędy strony." },
      { tytul: "Jak zgłosić", opis: "Wybierz kategorię, opisz krótko, dodaj zdjęcie i lokalizację. Oznacz „pilne” tylko gdy naprawdę trzeba." },
      { tytul: "Co dalej", opis: "Sołtys widzi zgłoszenie w panelu i może zmienić status. Sprawdzaj powiadomienia." },
    ],
    linkPelny: { href: "/pomoc?rola=mieszkaniec", label: "Pełny przewodnik mieszkańca" },
  },
  marketplace: {
    tytul: "Rynek lokalny",
    kroki: [
      { tytul: "Dodaj ogłoszenie", opis: "Wybierz wieś, kategorię (produkt, maszyna, działka, usługa) i wypełnij formularz." },
      { tytul: "Akceptacja", opis: "Sołtys zatwierdza ogłoszenie — dopiero wtedy jest widoczne publicznie." },
      { tytul: "Kontakt", opis: "Kupujący piszą przez czat w serwisie lub dzwonią — rozliczacie się między sobą, bez prowizji." },
    ],
    linkPelny: { href: "/pomoc?rola=mieszkaniec", label: "Pełny przewodnik mieszkańca" },
  },
  swietlica: {
    tytul: "Rezerwacja świetlicy",
    kroki: [
      { tytul: "Sprawdź kalendarz", opis: "Zobacz, które terminy są zajęte — unikniesz kolizji." },
      { tytul: "Złóż wniosek", opis: "Podaj datę, godzinę, liczbę gości i cel spotkania." },
      { tytul: "Po zatwierdzeniu", opis: "Sołtys potwierdza rezerwację. Po imprezie możesz zgłosić ewentualne zniszczenia." },
    ],
    linkPelny: { href: "/pomoc?rola=mieszkaniec", label: "Pełny przewodnik mieszkańca" },
  },
  fotokronika: {
    tytul: "Fotokronika",
    kroki: [
      { tytul: "Dodaj zdjęcie", opis: "Wybierz wieś i prześlij zdjęcie z życia miejscowości." },
      { tytul: "Moderacja", opis: "Sołtys zatwierdza — wtedy zdjęcie pojawia się na profilu publicznym wsi." },
      { tytul: "Konkursy", opis: "Gdy sołtys uruchomi konkurs, możesz głosować na ulubione zdjęcia." },
    ],
    linkPelny: { href: "/pomoc?rola=mieszkaniec", label: "Pełny przewodnik mieszkańca" },
  },
  "pomoc-sasiedzka": {
    tytul: "Pomoc sąsiedzka",
    kroki: [
      { tytul: "Zaoferuj lub poproś", opis: "Transport do miasta, zakupy, drobna opieka — krótkie ogłoszenia między sąsiadami." },
      { tytul: "Kontakt", opis: "Podaj sposób kontaktu (telefon, wiadomość). Nie udostępniaj danych wrażliwych publicznie." },
      { tytul: "Widoczność", opis: "Oferty pojawiają się na profilu wsi po zatwierdzeniu." },
    ],
    linkPelny: { href: "/pomoc?rola=mieszkaniec", label: "Pełny przewodnik mieszkańca" },
  },
  ogloszenia: {
    tytul: "Ogłoszenia mieszkańców",
    kroki: [
      { tytul: "Typ ogłoszenia", opis: "Sprzedaż, usługa, wydarzenie, zebranie — wybierz właściwą kategorię." },
      { tytul: "Treść", opis: "Krótki tytuł i opis. Data wydarzenia pomaga sąsiadom zaplanować." },
      { tytul: "Publikacja", opis: "Sołtys zatwierdza — ogłoszenie trafia na profil wsi." },
    ],
    linkPelny: { href: "/pomoc?rola=mieszkaniec", label: "Pełny przewodnik mieszkańca" },
  },
  "lista-zakupow": {
    tytul: "Lista zakupów (KGW)",
    kroki: [
      { tytul: "Wspólna lista", opis: "Członkowie KGW widzą i edytują pozycje na imprezy i zebrania." },
      { tytul: "Druk", opis: "Użyj przycisku „Drukuj” przed wyjazdem na zakupy." },
      { tytul: "Uprawnienia", opis: "Wymaga aktywnej roli KGW lub mieszkańca z dostępem sołtysa." },
    ],
    linkPelny: { href: "/pomoc?rola=kgw", label: "Przewodnik KGW" },
  },
  "rezerwacje-soltys": {
    tytul: "Rezerwacje sal (sołtys)",
    kroki: [
      { tytul: "Kolejka", opis: "Nowe wnioski czekają na decyzję — zatwierdź lub odrzuć z krótkim komentarzem." },
      { tytul: "Kalendarz", opis: "Zatwierdzone rezerwacje widać w kalendarzu organizacyjnym." },
      { tytul: "Plan sali", opis: "Ustaw układ stołów i wyposażenie — mieszkańcy widzą to przy rezerwacji." },
    ],
    linkPelny: { href: "/pomoc?rola=soltys", label: "Pełny przewodnik sołtysa" },
  },
  spolecznosc: {
    tytul: "Społeczność i WOW",
    kroki: [
      { tytul: "Wybierz tryb", opis: "Ogólny, KGW, OSP, parafia lub myśliwi — filtruje formularze i podpowiedzi." },
      { tytul: "Organizacje i wydarzenia", opis: "Dodaj koła, harmonogram tygodnia i kalendarz imprez." },
      { tytul: "Blog i historia", opis: "Wpisy mieszkańców budują historię wsi na profilu publicznym." },
    ],
    linkPelny: { href: "/pomoc?rola=soltys", label: "Pełny przewodnik sołtysa" },
  },
  rolnictwo: {
    tytul: "Rolnictwo i skup",
    kroki: [
      { tytul: "Profil rolniczy wsi", opis: "ARiMR, ODR, terminy dopłat i skup — widoczne na /rolnictwo po publikacji." },
      { tytul: "Koło rolników", opis: "W Społeczność (tryb rolnicy) dodaj organizację z zebraniami i kontaktem." },
      { tytul: "Ceny sąsiedzkie", opis: "Mieszkańcy mogą zgłaszać ceny skupu — potwierdzenia budują wiarygodność." },
    ],
    linkPelny: { href: "/pomoc?rola=soltys", label: "Pełny przewodnik sołtysa" },
  },
  lesnictwo: {
    tytul: "Leśnictwo i las",
    kroki: [
      { tytul: "Profil leśny", opis: "Uzupełnij nadleśnictwo, choinki, drewno i zasady pobytu — widoczne na /lesnictwo po publikacji." },
      { tytul: "Ostrzeżenia", opis: "Zakaz wstępu, wycinka, pożar — z terminem i opcjonalnym obszarem na mapie (zielony obrys)." },
      { tytul: "Mapa", opis: "Warstwa „Ostrzeżenia leśne” na mapie katalogu; link ?les= do konkretnego obszaru." },
    ],
    linkPelny: { href: "/pomoc?rola=soltys", label: "Pełny przewodnik sołtysa" },
  },
  lowiectwo: {
    tytul: "Polowania na mapie",
    kroki: [
      { tytul: "Obszar i termin", opis: "Zaznacz polygon na mapie, ustaw daty skrótem (dziś, jutro, weekend)." },
      { tytul: "Publikacja", opis: "Mieszkańcy widzą czerwony obszar na mapie i baner na profilu wsi." },
      { tytul: "Kalendarz", opis: "Opcjonalnie dodaj wpis do kalendarza łowieckiego (polowanie zbiorowe)." },
    ],
    linkPelny: { href: "/pomoc?rola=mysliwi", label: "Przewodnik myśliwi" },
  },
  "kalendarz-lowiecki": {
    tytul: "Kalendarz łowiecki",
    kroki: [
      { tytul: "Obsada ambony", opis: "Wybierz ambonę z POI mapy, myśliwego i godziny — mieszkańcy wsi widzą harmonogram po zalogowaniu." },
      { tytul: "Polowania zbiorowe", opis: "Powiąż wpis z ostrzeżeniem na mapie lub dodaj osobno." },
      { tytul: "Zebrania i szkolenia", opis: "Inne rodzaje wpisów (zebranie koła, patrol) w tym samym kalendarzu." },
    ],
    linkPelny: { href: "/pomoc?rola=mysliwi", label: "Przewodnik myśliwi" },
  },
  transport: {
    tytul: "Transport PKP i PKS",
    kroki: [
      { tytul: "Automatyczne odjazdy", opis: "Przy włączonym API PKP/GTFS odśwież rozkład w panelu Transport." },
      { tytul: "Ręczny rozkład PKS", opis: "Bez API możesz wpisać godziny przy przystanku i dodać zdjęcie tabliczki." },
      { tytul: "Mapa", opis: "Przystanki i odjazdy widać na mapie wsi i w profilu publicznym." },
    ],
    linkPelny: { href: "/pomoc?rola=soltys", label: "Pełny przewodnik sołtysa" },
  },
  szkola: {
    tytul: "Tablica szkoły",
    kroki: [
      { tytul: "Ogłoszenia", opis: "Dodaj komunikaty dla rodziców — filtry klas, data ważności." },
      { tytul: "Profil placówki", opis: "W Społeczność (tryb szkoły) uzupełnij kontakt, dyrektora, zajęcia." },
      { tytul: "Profil publiczny", opis: "Tablica i profil szkoły na stronie wsi oraz kod QR do embedu." },
    ],
    linkPelny: { href: "/pomoc?rola=soltys", label: "Pełny przewodnik sołtysa" },
  },
};

/** Mapowanie ścieżek panelu na moduły pomocy. */
export function modulPomocyZeSciezki(pathname: string): IdModuluPomocy | null {
  if (pathname.includes("/zgloszenia")) return "zgloszenia";
  if (pathname.includes("/marketplace")) return "marketplace";
  if (pathname.includes("/swietlica")) return "swietlica";
  if (pathname.includes("/fotokronika")) return "fotokronika";
  if (pathname.includes("/pomoc-sasiedzka")) return "pomoc-sasiedzka";
  if (pathname.includes("/ogloszenia")) return "ogloszenia";
  if (pathname.includes("/lista-zakupow")) return "lista-zakupow";
  if (pathname.includes("/rezerwacje")) return "rezerwacje-soltys";
  if (pathname.includes("/spolecznosc")) return "spolecznosc";
  if (pathname.includes("/rolnictwo")) return "rolnictwo";
  if (pathname.includes("/lesnictwo")) return "lesnictwo";
  if (pathname.includes("/lowiectwo/kalendarz")) return "kalendarz-lowiecki";
  if (pathname.includes("/lowiectwo")) return "lowiectwo";
  if (pathname.includes("/transport")) return "transport";
  if (pathname.includes("/szkola")) return "szkola";
  return null;
}
