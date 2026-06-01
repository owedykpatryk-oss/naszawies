import type { GrupaNawigacjiPanelu, LinkPanelu } from "@/components/panel/nawigacja-panelu-grupowana";

/** Szybkie skróty — zawsze widoczne nad grupami (panel mieszkańca). */
export const SZYBKIE_LINKI_MIESZKANIEC: LinkPanelu[] = [
  { href: "/panel/mieszkaniec", label: "Przegląd" },
  { href: "/panel/mieszkaniec/ogloszenia", label: "Ogłoszenia" },
  { href: "/panel/mieszkaniec/przypomnienia", label: "Przypomnienia" },
  { href: "/panel/mieszkaniec/marketplace", label: "Rynek", highlight: true },
  { href: "/panel/mieszkaniec/zgloszenia", label: "Zgłoś sprawę" },
];

export const GRUPY_NAWIGACJI_MIESZKANIEC: GrupaNawigacjiPanelu[] = [
  {
    id: "komunikacja",
    tytul: "Komunikacja",
    opis: "Ogłoszenia sołtysa i rezerwacje",
    linki: [
      { href: "/panel/mieszkaniec/ogloszenia", label: "Ogłoszenia" },
      { href: "/panel/mieszkaniec/przypomnienia", label: "Przypomnienia", highlight: true },
      { href: "/panel/mieszkaniec/swietlica", label: "Świetlica" },
    ],
  },
  {
    id: "rynek",
    tytul: "Rynek i zakupy",
    opis: "Lokalne ogłoszenia i lista zakupów",
    linki: [
      { href: "/panel/mieszkaniec/marketplace", label: "Rynek lokalny", highlight: true },
      { href: "/panel/mieszkaniec/profil-rynek", label: "Profil sprzedawcy" },
      { href: "/panel/mieszkaniec/lista-zakupow", label: "Lista zakupów" },
      { href: "/panel/mieszkaniec/rolnictwo-ceny", label: "Ceny skupu" },
    ],
  },
  {
    id: "aktywnosc",
    tytul: "Aktywność",
    opis: "Zgłoszenia, zdjęcia, sąsiedzi",
    linki: [
      { href: "/panel/mieszkaniec/zgloszenia", label: "Zgłoszenia" },
      { href: "/panel/mieszkaniec/fotokronika", label: "Fotokronika" },
      { href: "/panel/mieszkaniec/pomoc-sasiedzka", label: "Pomoc sąsiedzka", highlight: true },
      { href: "/panel/mieszkaniec/grafika", label: "Kreator grafiki" },
    ],
  },
  {
    id: "wies",
    tytul: "Profil wsi",
    opis: "To, co widać publicznie",
    linki: [
      { href: "/panel/mieszkaniec/historia", label: "Historia i wspomnienia" },
      { href: "/panel/mieszkaniec/spolecznosc", label: "Dyskusje i blog" },
    ],
  },
  {
    id: "pomoc",
    tytul: "Pomoc",
    linki: [{ href: "/pomoc?rola=mieszkaniec", label: "Centrum pomocy" }],
  },
];

type LicznikiSoltysa = {
  wnioski: number;
  rezerwacje: number;
  posty: number;
  wiadomosci: number;
  rynek: number;
  pomoc: number;
  zgloszenia: number;
  zdjecia: number;
  raportySpolecznosci: number;
  poiWeryfikacja: number;
  propozycjePoi: number;
};

export function grupyNawigacjiSoltysa(l: LicznikiSoltysa | null, laczniePrzeglad: number): GrupaNawigacjiPanelu[] {
  const poi = (l?.poiWeryfikacja ?? 0) + (l?.propozycjePoi ?? 0);
  return [
    {
      id: "start",
      tytul: "Start",
      linki: [
        {
          href: "/panel/soltys",
          label: "Przegląd i kolejka",
          badge: laczniePrzeglad > 0 ? laczniePrzeglad : undefined,
          highlight: true,
        },
      ],
    },
    {
      id: "wies",
      tytul: "Miejscowość",
      opis: "Profil publiczny, mapa, promocja",
      linki: [
        { href: "/panel/soltys/moja-wies", label: "Profil wsi", badge: poi || undefined },
        { href: "/panel/soltys/mapa", label: "Mapa wsi", highlight: true },
        { href: "/panel/soltys/grafika", label: "Kreator grafiki" },
        { href: "/panel/soltys/konkursy", label: "Konkursy zdjęć" },
        { href: "/panel/soltys/transport", label: "Transport PKP" },
      ],
    },
    {
      id: "spolecznosc",
      tytul: "Społeczność i treści",
      opis: "Szkoła, sport, historia — jeden moduł, tryb u góry strony",
      linki: [
        { href: "/panel/soltys/spolecznosc", label: "Moduł WOW", highlight: true },
        { href: "/panel/soltys/spolecznosc?tryb=szkola", label: "Szkoła" },
        { href: "/panel/soltys/spolecznosc?tryb=sport", label: "Sport" },
        { href: "/panel/soltys/spolecznosc?tryb=parafia", label: "Parafia" },
        { href: "/panel/soltys/spolecznosc?tryb=kgw", label: "KGW" },
        { href: "/panel/soltys/spolecznosc?tryb=osp", label: "OSP" },
        { href: "/panel/soltys/kanaly-rss", label: "Kanały RSS" },
        { href: "/panel/rada", label: "Rada sołecka" },
      ],
    },
    {
      id: "organizacja",
      tytul: "Organizacja",
      opis: "Kalendarz, sale, dokumenty",
      linki: [
        { href: "/panel/soltys/kalendarz", label: "Kalendarz", highlight: true },
        { href: "/panel/soltys/rezerwacje", label: "Rezerwacje sal", badge: l?.rezerwacje || undefined },
        { href: "/panel/soltys/swietlica", label: "Świetlica" },
        { href: "/panel/soltys/cmentarz", label: "Plan cmentarza" },
        { href: "/panel/soltys/dokumenty", label: "Generator dokumentów" },
      ],
    },
    {
      id: "admin",
      tytul: "Administracja",
      linki: [
        { href: "/panel/soltys/zgloszenia", label: "Zgłoszenia", badge: l?.zgloszenia || undefined },
        { href: "/panel/soltys/zespol", label: "Zespół" },
        { href: "/panel/soltys/samorzad", label: "Samorząd" },
        { href: "/panel/soltys/informacje-lokalne", label: "Info dla mieszkańców" },
        { href: "/panel/soltys/pomoc", label: "Pomoc sołtysa" },
        { href: "/pomoc?rola=soltys", label: "Centrum pomocy" },
      ],
    },
  ];
}

export const SZYBKIE_LINKI_SOLTYS: LinkPanelu[] = [
  { href: "/panel/soltys", label: "Kolejka" },
  { href: "/panel/soltys/moja-wies", label: "Profil wsi" },
  { href: "/panel/soltys/spolecznosc", label: "Społeczność", highlight: true },
  { href: "/panel/soltys/kalendarz", label: "Kalendarz" },
];

export const GRUPY_NAWIGACJI_MOJE: GrupaNawigacjiPanelu[] = [
  {
    id: "konto",
    tytul: "Twoje konto",
    linki: [
      { href: "/panel/moje", label: "Przegląd" },
      { href: "/panel/moje/wies", label: "Moje wsie" },
      { href: "/panel/moje/firmy", label: "Firmy i sklepy", highlight: true },
      { href: "/panel/moje/ulubione", label: "Ulubione" },
    ],
  },
  {
    id: "region",
    tytul: "Region i organizacje",
    linki: [
      { href: "/panel/moje/samorzad", label: "Moja gmina" },
      { href: "/panel/moje/organizacje", label: "Parafia / KGW / OSP" },
      { href: "/panel/moje/transport", label: "Transport" },
    ],
  },
];
