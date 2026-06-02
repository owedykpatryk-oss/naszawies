/** Szybkie szablony planu tygodnia — tryb sport w panelu sołtysa. */
export type PresetHarmonogramuSport = {
  id: string;
  etykieta: string;
  day_of_week: number;
  time_start: string;
  time_end: string | null;
  title: string;
  description: string;
};

export const PRESETY_HARMONOGRAMU_SPORT: PresetHarmonogramuSport[] = [
  {
    id: "nordic_wt",
    etykieta: "Nordic · wt 18:00",
    day_of_week: 2,
    time_start: "18:00",
    time_end: "19:30",
    title: "Nordic walking",
    description: "Zbiórka przy świetlicy. Kijki własne.",
  },
  {
    id: "nordic_czw",
    etykieta: "Nordic · czw 7:00",
    day_of_week: 4,
    time_start: "07:00",
    time_end: "08:00",
    title: "Nordic walking — poranek",
    description: "Spokojne tempo, ok. 5 km.",
  },
  {
    id: "bieg_nd",
    etykieta: "Bieg · nd 9:00",
    day_of_week: 0,
    time_start: "09:00",
    time_end: "10:00",
    title: "Bieg rekreacyjny",
    description: "Wspólny start — tempo według grupy.",
  },
  {
    id: "rower_sb",
    etykieta: "Rower · sb 10:00",
    day_of_week: 6,
    time_start: "10:00",
    time_end: "12:00",
    title: "Wycieczka rowerowa",
    description: "Trasa ustalana na miejscu. Kask obowiązkowy.",
  },
  {
    id: "turystyka_sb",
    etykieta: "Marsz · sb 8:00",
    day_of_week: 6,
    time_start: "08:00",
    time_end: "14:00",
    title: "Wędrówka / turystyka",
    description: "Dłuższa trasa — zabierz wodę i prowiant.",
  },
];
