import type { KontekstGrafiki } from "./typy";
import { domyslneWartosciPol, znajdzSzablon } from "./szablony";
import { zastosujPaczkeGrupy, type GrupaWiejska } from "./szablony-grupy-wiejskie";

export type PaczkaWowGrupy = {
  id: string;
  nazwa: string;
  opis: string;
  grupa: GrupaWiejska;
  emoji: string;
  szablonId: string;
  motywId: string;
  uzupelnienia?: Record<string, string>;
  tytulProjektu?: string;
  badge?: string;
};

export const PACZKI_WOW_GRUPY: PaczkaWowGrupy[] = [
  {
    id: "wow-hubertus",
    nazwa: "Hubertus myśliwski",
    opis: "Msza, korowód, obiad — gotowy program.",
    grupa: "lowiectwo",
    emoji: "🦌",
    szablonId: "lowiectwo-hubertus",
    motywId: "lowiecki-lesny",
    badge: "Popularne",
    tytulProjektu: "Hubertus — zaproszenie",
  },
  {
    id: "wow-dziki",
    nazwa: "Akcja na dziki",
    opis: "Plakat dla rolników i mieszkańców.",
    grupa: "lowiectwo",
    emoji: "🐗",
    szablonId: "lowiectwo-akcja-dziki",
    motywId: "lowiecki-lesny",
    tytulProjektu: "Akcja redukcji dzików",
  },
  {
    id: "wow-festyn-parafia",
    nazwa: "Festyn parafialny",
    opis: "Msza, koncert, stoiska — pełny plakat.",
    grupa: "parafia",
    emoji: "⛪",
    szablonId: "parafia-festyn",
    motywId: "parafia-granat",
    badge: "WOW",
    tytulProjektu: "Festyn parafialny",
  },
  {
    id: "wow-seniorzy-wycieczka",
    nazwa: "Wycieczka seniorów",
    opis: "Autokar, zapisy, data wyjazdu.",
    grupa: "seniorzy",
    emoji: "🚌",
    szablonId: "seniorzy-wycieczka",
    motywId: "seniorzy-cieply",
    tytulProjektu: "Wycieczka klubu seniora",
  },
  {
    id: "wow-turniej-lzs",
    nazwa: "Turniej o Puchar Sołtysa",
    opis: "Piłka, zapisy drużyn, grill po meczach.",
    grupa: "sport",
    emoji: "⚽",
    szablonId: "lzs-turniej",
    motywId: "sport-lzs",
    badge: "WOW",
    tytulProjektu: "Turniej LZS",
  },
  {
    id: "wow-rada-otwarte",
    nazwa: "Otwarte posiedzenie rady",
    opis: "Dla sołtysa — transparentność wobec wsi.",
    grupa: "rada",
    emoji: "🏛️",
    szablonId: "rada-spotkanie",
    motywId: "klasyczny-bialy",
    tytulProjektu: "Posiedzenie Rady Sołeckiej",
  },
  {
    id: "wow-wspolna-akcja",
    nazwa: "OSP + KGW + Parafia",
    opis: "Jeden plakat — cała wieś razem.",
    grupa: "mix",
    emoji: "🤝",
    szablonId: "mix-wspolna-akcja",
    motywId: "zielony-wies",
    badge: "WOW",
    tytulProjektu: "Wspólna akcja charytatywna",
    uzupelnienia: {
      opis: "Wspólnie: OSP · KGW · Parafia · Sołectwo {{wies}}\n• Kiermasz i stoiska\n• Koncert na scenie\n• Całodzienny piknik rodzinny",
    },
  },
  {
    id: "wow-podziekowanie-rolnik",
    nazwa: "Podziękowanie dla rolnika",
    opis: "Od koła łowieckiego — dobre relacje na wsi.",
    grupa: "lowiectwo",
    emoji: "🌾",
    szablonId: "lowiectwo-podziekowanie-rolnik",
    motywId: "lowiecki-lesny",
    tytulProjektu: "Podziękowanie dla rolnika",
  },
  {
    id: "wow-konkurs-szkola",
    nazwa: "Konkurs szkolny — dyplom",
    opis: "Plastyczny / recytatorski — gotowy dyplom.",
    grupa: "szkola",
    emoji: "🎨",
    szablonId: "szkola-konkurs",
    motywId: "turkusowy-letni",
    tytulProjektu: "Dyplom konkursu",
  },
  {
    id: "wow-zespol-wystep",
    nazwa: "Występ zespołu ludowego",
    opis: "Koncert na scenie — plakat z repertuarem.",
    grupa: "zespol",
    emoji: "💃",
    szablonId: "zespol-wystep",
    motywId: "folklor-kolorowy",
    badge: "WOW",
    tytulProjektu: "Koncert zespołu ludowego",
  },
  {
    id: "wow-zespol-proba",
    nazwa: "Próba zespołu — rekrutacja",
    opis: "Zachęć nowych członków do dołączenia.",
    grupa: "zespol",
    emoji: "🪗",
    szablonId: "zespol-proba",
    motywId: "folklor-kolorowy",
    tytulProjektu: "Próba zespołu ludowego",
  },
  {
    id: "wow-ddk-warsztaty",
    nazwa: "Warsztaty DDK / GOPS",
    opis: "Zajęcia dla seniorów i rodzin — zapisy.",
    grupa: "ddk",
    emoji: "🏛️",
    szablonId: "ddk-warsztaty",
    motywId: "ddk-gops-niebieski",
    badge: "WOW",
    tytulProjektu: "Warsztaty w DDK",
  },
  {
    id: "wow-gops-pomoc",
    nazwa: "Punkt informacyjny GOPS",
    opis: "Plakat o pomocy społecznej i konsultacjach.",
    grupa: "ddk",
    emoji: "🤝",
    szablonId: "ddk-pomoc-spoleczna",
    motywId: "ddk-gops-niebieski",
    tytulProjektu: "Informacja GOPS",
  },
  {
    id: "wow-sponsor-plakat",
    nazwa: "Patroni imprezy",
    opis: "Lista sponsorów na plakacie festynu.",
    grupa: "sponsor",
    emoji: "⭐",
    szablonId: "sponsor-plakat",
    motywId: "sponsor-zloto",
    badge: "WOW",
    tytulProjektu: "Patroni festynu",
  },
  {
    id: "wow-sponsor-dziekuje",
    nazwa: "Podziękowanie sponsorowi",
    opis: "Oficjalne podziękowanie po imprezie.",
    grupa: "sponsor",
    emoji: "🙏",
    szablonId: "sponsor-podziekowanie",
    motywId: "sponsor-zloto",
    tytulProjektu: "Podziękowanie dla sponsora",
  },
  {
    id: "wow-dwujezyczne-impreza",
    nazwa: "Impreza PL + UA",
    opis: "Zaproszenie po polsku i ukraińsku.",
    grupa: "mix",
    emoji: "🇵🇱🇺🇦",
    szablonId: "dwujezyczne-zaproszenie-impreza",
    motywId: "nowoczesny-granat",
    badge: "WOW",
    tytulProjektu: "Spotkanie integracyjne PL+UA",
  },
  {
    id: "wow-dni-seniora",
    nazwa: "Dni Seniora",
    opis: "Uroczystość dla klubu seniora.",
    grupa: "seniorzy",
    emoji: "🌻",
    szablonId: "sezon-dni-seniora",
    motywId: "seniorzy-cieply",
    tytulProjektu: "Dni Seniora",
  },
  {
    id: "wow-sylwester",
    nazwa: "Sylwester w świetlicy",
    opis: "Plakat na zabawę noworoczną.",
    grupa: "mix",
    emoji: "🎇",
    szablonId: "sezon-sylwester",
    motywId: "fioletowy-festyn",
    tytulProjektu: "Sylwester",
  },
  {
    id: "wow-biblioteka",
    nazwa: "Spotkanie w bibliotece",
    opis: "Klub czytelniczy — warsztaty i czytanie.",
    grupa: "szkola",
    emoji: "📚",
    szablonId: "biblioteka-spotkanie",
    motywId: "turkusowy-letni",
    tytulProjektu: "Klub czytelniczy",
  },
];

export type WynikPaczkiWow = {
  szablonId: string;
  motywId: string;
  wartosci: Record<string, string>;
  tytulProjektu: string;
};

export function zbudujZPaczkiWow(paczka: PaczkaWowGrupy, kontekst: KontekstGrafiki): WynikPaczkiWow | null {
  const szablon = znajdzSzablon(paczka.szablonId);
  if (!szablon) return null;
  const bazowe = domyslneWartosciPol(szablon, kontekst);
  const nadpisane = paczka.uzupelnienia ? zastosujPaczkeGrupy(paczka.uzupelnienia, kontekst) : {};
  return {
    szablonId: paczka.szablonId,
    motywId: paczka.motywId,
    wartosci: { ...bazowe, ...nadpisane },
    tytulProjektu: paczka.tytulProjektu ?? szablon.tytul,
  };
}

export function paczkiWowDlaGrupy(grupa: GrupaWiejska): PaczkaWowGrupy[] {
  if (grupa === "wszystkie") return PACZKI_WOW_GRUPY;
  return PACZKI_WOW_GRUPY.filter((p) => p.grupa === grupa);
}
