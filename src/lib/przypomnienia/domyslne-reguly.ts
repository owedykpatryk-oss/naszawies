import type { RodzajPrzypomnienia } from "@/lib/przypomnienia/rodzaje";

export type WpisDomyslnejReguly = {
  kind: RodzajPrzypomnienia;
  title: string;
  body: string;
  recurrence: "weekly" | "monthly" | "yearly";
  day_of_week?: number;
  day_of_month?: number;
  month?: number;
  days_before: number;
  sort_order: number;
};

/** Szablony do jednego kliknięcia — sołtys dopasuje dni do harmonogramu gminy. */
export const DOMYSLNE_REGULY_WSI: WpisDomyslnejReguly[] = [
  {
    kind: "smieci",
    title: "Wywóz śmieci zmieszanych",
    body: "Jutro wywóz — wystaw pojemniki wieczorem. Szczegóły w przewodniku wsi (śmieci / PSZOK).",
    recurrence: "weekly",
    day_of_week: 4,
    days_before: 1,
    sort_order: 10,
  },
  {
    kind: "smieci",
    title: "Wywóz śmieci (drugi termin)",
    body: "Jutro drugi termin wywozu w tygodniu — sprawdź podział na frakcje u sołtysa lub w BIP gminy.",
    recurrence: "weekly",
    day_of_week: 1,
    days_before: 1,
    sort_order: 20,
  },
  {
    kind: "podatek",
    title: "I rata podatku od nieruchomości",
    body: "Za ok. dwa tygodnie termin I raty podatku od nieruchomości — sprawdź kwotę w urzędzie gminy lub na e-Urzędzie Skarbowym.",
    recurrence: "yearly",
    month: 4,
    day_of_month: 30,
    days_before: 14,
    sort_order: 30,
  },
  {
    kind: "podatek",
    title: "II rata podatku od nieruchomości",
    body: "Zbliża się termin II raty podatku od nieruchomości.",
    recurrence: "yearly",
    month: 11,
    day_of_month: 30,
    days_before: 14,
    sort_order: 40,
  },
  {
    kind: "dzialka",
    title: "Opłata za działkę / podatek rolny",
    body: "Zbliża się termin opłat za działkę rekreacyjną lub podatek rolny — potwierdź w gminie.",
    recurrence: "yearly",
    month: 5,
    day_of_month: 15,
    days_before: 7,
    sort_order: 50,
  },
  {
    kind: "pszok",
    title: "PSZOK — gabaryty / odpady wielkogabarytowe",
    body: "Przypomnienie o możliwości oddania gabarytów — godziny PSZOK w przewodniku wsi.",
    recurrence: "monthly",
    day_of_month: 10,
    days_before: 2,
    sort_order: 60,
  },
];
