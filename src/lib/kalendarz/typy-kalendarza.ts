export type RodzajWpisKalendarza =
  | "wydarzenie"
  | "rezerwacja"
  | "harmonogram"
  | "dotacja"
  | "konkurs"
  | "gmina"
  | "zadanie"
  | "ogloszenie"
  | "lowiectwo"
  | "harmonogram_lowiecki";

export type WpisKalendarza = {
  id: string;
  rodzaj: RodzajWpisKalendarza;
  tytul: string;
  start: string;
  end: string | null;
  calodniowe: boolean;
  wiesId: string;
  wiesNazwa: string;
  opis?: string | null;
  href?: string | null;
  pilne?: boolean;
  /** Impreza z innej wsi w gminie */
  zGminy?: boolean;
  status?: string;
};

export const ETYKIETA_RODZAJU: Record<RodzajWpisKalendarza, string> = {
  wydarzenie: "Wydarzenie",
  rezerwacja: "Świetlica",
  harmonogram: "Stały plan",
  dotacja: "Termin dotacji",
  konkurs: "Konkurs",
  gmina: "Gmina / okolice",
  zadanie: "Moje zadanie",
  ogloszenie: "Ogłoszenie / zebranie",
  lowiectwo: "Polowanie — ostrzeżenie",
  harmonogram_lowiecki: "Łowiectwo — harmonogram",
};

export const KOLOR_RODZAJU: Record<RodzajWpisKalendarza, string> = {
  wydarzenie: "bg-emerald-100 text-emerald-950 border-emerald-300/60",
  rezerwacja: "bg-sky-100 text-sky-950 border-sky-300/60",
  harmonogram: "bg-teal-50 text-teal-950 border-teal-200/80",
  dotacja: "bg-violet-100 text-violet-950 border-violet-300/60",
  konkurs: "bg-amber-100 text-amber-950 border-amber-300/60",
  gmina: "bg-stone-100 text-stone-800 border-stone-300/60",
  zadanie: "bg-orange-100 text-orange-950 border-orange-300/60",
  ogloszenie: "bg-indigo-100 text-indigo-950 border-indigo-300/60",
  lowiectwo: "bg-orange-100 text-orange-950 border-orange-400/70",
  harmonogram_lowiecki: "bg-amber-100 text-amber-950 border-amber-500/60",
};
