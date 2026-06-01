export const AUDIENCJE_OGLOSZEN_SZKOLY = [
  "ogolne",
  "rodzice",
  "kadra",
  "klasy_1_3",
  "klasy_4_6",
  "klasy_7_8",
  "klasa",
] as const;

export type AudiencjaOgloszeniaSzkoly = (typeof AUDIENCJE_OGLOSZEN_SZKOLY)[number];

export const ETYKIETY_AUDIENCJI_SZKOLY: Record<AudiencjaOgloszeniaSzkoly, string> = {
  ogolne: "Wszyscy",
  rodzice: "Rodzice",
  kadra: "Kadra",
  klasy_1_3: "Klasy 1–3",
  klasy_4_6: "Klasy 4–6",
  klasy_7_8: "Klasy 7–8",
  klasa: "Konkretna klasa",
};

export const SZABLONY_OGLOSZEN_SZKOLY: ReadonlyArray<{
  etykieta: string;
  title: string;
  body: string;
  audience: AudiencjaOgloszeniaSzkoly;
}> = [
  {
    etykieta: "Zebranie rodziców",
    title: "Zebranie z rodzicami",
    body: "Zapraszamy na zebranie. Prosimy o punktualność. Szczegóły w załączniku lub u sekretariatu.",
    audience: "rodzice",
  },
  {
    etykieta: "Wycieczka",
    title: "Wycieczka szkolna — informacja",
    body: "Termin, miejsce zbiórki i lista rzeczy do zabrania — prosimy o potwierdzenie u wychowawcy.",
    audience: "ogolne",
  },
  {
    etykieta: "Święto szkoły",
    title: "Dzień otwarty / święto szkoły",
    body: "Zapraszamy mieszkańców i rodziców. Program wydarzeń dostępny w sekretariacie.",
    audience: "ogolne",
  },
  {
    etykieta: "Rada rodziców",
    title: "Posiedzenie rady rodziców",
    body: "Spotkanie rady rodziców — agenda w załączniku. Prosimy o obecność delegatów klas.",
    audience: "rodzice",
  },
];

export type OgloszenieSzkolyPubliczne = {
  id: string;
  title: string;
  body: string | null;
  audience: AudiencjaOgloszeniaSzkoly;
  class_label: string | null;
  is_pinned: boolean;
  attachment_url: string | null;
  valid_until: string | null;
  published_at: string;
};

/** W panelu sołtysa — także wygasłe wpisy. */
export type OgloszenieSzkolyPanel = OgloszenieSzkolyPubliczne & {
  wygasle: boolean;
  school_group_id: string | null;
};
