export const KATEGORIE_LINKOW_PRZYDATNYCH = [
  "bip_gmina",
  "urzad_gmina",
  "urzad_powiat",
  "gazeta",
  "radio",
  "portal",
  "tv",
  "social",
  "pomoc_spoleczna",
  "zdrowie",
  "edukacja",
  "inne",
] as const;

export type KategoriaLinkuPrzydatnego = (typeof KATEGORIE_LINKOW_PRZYDATNYCH)[number];

export type LinkPrzydatnyPubliczny = {
  id: string;
  category: KategoriaLinkuPrzydatnego;
  title: string;
  url: string | null;
  phone: string | null;
  email: string | null;
  note: string | null;
  display_order: number;
};

export const ETYKIETY_KATEGORII_LINKOW: Record<
  KategoriaLinkuPrzydatnego,
  { label: string; opis: string; grupa: "urzad" | "media" | "pomoc" | "inne" }
> = {
  bip_gmina: { label: "BIP gminy", opis: "Biuletyn informacji publicznej", grupa: "urzad" },
  urzad_gmina: { label: "Urząd gminy", opis: "Kontakt do urzędu, wydziały", grupa: "urzad" },
  urzad_powiat: { label: "Starostwo / powiat", opis: "Urząd powiatowy", grupa: "urzad" },
  gazeta: { label: "Gazeta / prasa lokalna", opis: "Lokalna gazeta lub portal informacyjny", grupa: "media" },
  radio: { label: "Radio lokalne", opis: "Stacja radiowa regionu", grupa: "media" },
  portal: { label: "Portal informacyjny", opis: "Wiadomości z regionu", grupa: "media" },
  tv: { label: "Telewizja lokalna", opis: "Kanał TV lub VOD regionalne", grupa: "media" },
  social: { label: "Social media", opis: "Facebook, profil gminy itp.", grupa: "media" },
  pomoc_spoleczna: { label: "Pomoc społeczna", opis: "OPS, MOPS, wsparcie", grupa: "pomoc" },
  zdrowie: { label: "Zdrowie", opis: "POZ, szpital, pogotowie", grupa: "pomoc" },
  edukacja: { label: "Edukacja", opis: "Szkoły, biblioteka", grupa: "inne" },
  inne: { label: "Inne", opis: "Pozostałe przydatne linki", grupa: "inne" },
};

export const GRUPY_KATEGORII = [
  { id: "urzad" as const, tytul: "Urzędy i samorząd" },
  { id: "media" as const, tytul: "Media lokalne" },
  { id: "pomoc" as const, tytul: "Pomoc i zdrowie" },
  { id: "inne" as const, tytul: "Inne" },
];

export type PresetLinku = {
  category: KategoriaLinkuPrzydatnego;
  title: string;
  note?: string;
};

export const PAKIETY_LINKOW_PRZYDATNYCH: { id: string; etykieta: string; opis: string; linki: PresetLinku[] }[] = [
  {
    id: "urzad-podstawowy",
    etykieta: "Urząd i BIP gminy",
    opis: "Podstawowe pola do uzupełnienia adresami Waszej gminy.",
    linki: [
      { category: "bip_gmina", title: "BIP gminy — strona główna", note: "Wklej link do bip.gmina.pl lub sekcji BIP na stronie gminy." },
      { category: "urzad_gmina", title: "Urząd gminy — kontakt", note: "Telefon do sekretariatu, godziny przyjęć." },
      { category: "urzad_gmina", title: "Harmonogram odbioru odpadów", note: "Link lub opis w notatce." },
      { category: "urzad_powiat", title: "Starostwo powiatowe", note: "Kontakt do powiatu." },
    ],
  },
  {
    id: "media-lokalne",
    etykieta: "Media lokalne",
    opis: "Gazety, radio i portale z regionu — uzupełnij linki.",
    linki: [
      { category: "gazeta", title: "Gazeta / portal lokalny", note: "Np. tygodnik powiatowy." },
      { category: "radio", title: "Radio regionalne", note: "Częstotliwość lub strona stacji." },
      { category: "portal", title: "Portal wiadomości", note: "Informacje z powiatu/województwa." },
      { category: "social", title: "Profil gminy (Facebook)", note: "Oficjalny profil gminy w mediach społecznościowych." },
    ],
  },
  {
    id: "numery-pomocowe",
    etykieta: "Numery pomocowe",
    opis: "Bez linków — wpisz telefony w polu „Telefon”.",
    linki: [
      { category: "pomoc_spoleczna", title: "Numer alarmowy 112", note: "Pogotowie ratunkowe, straż, policja." },
      { category: "zdrowie", title: "Pogotowie ratunkowe 999", note: "Lub 112." },
      { category: "pomoc_spoleczna", title: "Ośrodek pomocy społecznej (OPS)", note: "Telefon i adres w gminie." },
    ],
  },
];

export function normalizujKategorieLinku(v: string | null | undefined): KategoriaLinkuPrzydatnego {
  if (v && (KATEGORIE_LINKOW_PRZYDATNYCH as readonly string[]).includes(v)) {
    return v as KategoriaLinkuPrzydatnego;
  }
  return "inne";
}

export function pogrupujLinkiPrzydatne(linki: LinkPrzydatnyPubliczny[]) {
  const posortowane = [...linki].sort((a, b) => a.display_order - b.display_order || a.title.localeCompare(b.title, "pl"));
  const wynik: Record<(typeof GRUPY_KATEGORII)[number]["id"], LinkPrzydatnyPubliczny[]> = {
    urzad: [],
    media: [],
    pomoc: [],
    inne: [],
  };
  for (const l of posortowane) {
    const g = ETYKIETY_KATEGORII_LINKOW[l.category].grupa;
    wynik[g].push(l);
  }
  return wynik;
}
