export type AkcjaPaczkiRynek =
  | { typ: "kategoria"; value: string }
  | { typ: "nieruchomosci" }
  | { typ: "lokalne" }
  | { typ: "geoportal" }
  | { typ: "oddam" }
  | { typ: "operator" };

export type PaczkaRynek = {
  id: string;
  emoji: string;
  label: string;
  opis: string;
  /** Tailwind bg gradient for tile */
  gradient: string;
  akcja: AkcjaPaczkiRynek;
};

/** Szybkie skróty sezonowe — jeden klik ustawia filtry rynku wsi. */
export const PACZKI_SZYBKIE_RYNKU: PaczkaRynek[] = [
  {
    id: "miod",
    emoji: "🍯",
    label: "Miód z pasieki",
    opis: "Od pszczelarzy we wsi",
    gradient: "from-amber-400/25 via-yellow-100/90 to-orange-50",
    akcja: { typ: "kategoria", value: "miod" },
  },
  {
    id: "sery",
    emoji: "🧀",
    label: "Sery i nabiał",
    opis: "Od gospodarstw",
    gradient: "from-yellow-300/30 via-amber-50 to-white",
    akcja: { typ: "kategoria", value: "sery_nabial" },
  },
  {
    id: "dzialki",
    emoji: "📐",
    label: "Działki z mapą",
    opis: "Geoportal + powierzchnia",
    gradient: "from-lime-300/30 via-emerald-50 to-amber-50",
    akcja: { typ: "geoportal" },
  },
  {
    id: "ciagnik",
    emoji: "🚜",
    label: "Maszyny",
    opis: "Ciągniki i sprzęt",
    gradient: "from-green-300/25 via-lime-50 to-stone-50",
    akcja: { typ: "kategoria", value: "ciagnik" },
  },
  {
    id: "lokalne",
    emoji: "🧺",
    label: "Z gospodarstwa",
    opis: "Warzywa, mięso, przetwory",
    gradient: "from-emerald-300/25 via-lime-50 to-orange-50",
    akcja: { typ: "lokalne" },
  },
  {
    id: "oddam",
    emoji: "🎁",
    label: "Oddam za darmo",
    opis: "Darmowe ogłoszenia",
    gradient: "from-violet-300/25 via-fuchsia-50 to-white",
    akcja: { typ: "oddam" },
  },
];

/** Skróty na hubie /rynek — ustawiają wyszukiwarkę wsi. */
export const PACZKI_HUB_RYNKU: { id: string; emoji: string; label: string; fraza: string; gradient: string }[] = [
  { id: "miod", emoji: "🍯", label: "Miód", fraza: "miód", gradient: "from-amber-400/30 via-yellow-100 to-orange-50" },
  { id: "sery", emoji: "🧀", label: "Sery", fraza: "ser", gradient: "from-yellow-300/30 via-amber-50 to-white" },
  { id: "dzialki", emoji: "📐", label: "Działki", fraza: "działka", gradient: "from-lime-300/30 via-emerald-50 to-amber-50" },
  { id: "maszyny", emoji: "🚜", label: "Maszyny", fraza: "ciągnik", gradient: "from-green-300/25 via-lime-50 to-stone-50" },
  { id: "warzywa", emoji: "🥕", label: "Warzywa", fraza: "warzywa", gradient: "from-orange-300/25 via-lime-50 to-emerald-50" },
  { id: "uslugi", emoji: "👷", label: "Usługi", fraza: "usługa", gradient: "from-sky-300/25 via-cyan-50 to-blue-50" },
];
