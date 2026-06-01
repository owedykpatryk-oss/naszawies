export const RODZAJE_PRZYPOMNIENIA = ["smieci", "podatek", "dzialka", "pszok", "inne"] as const;

export type RodzajPrzypomnienia = (typeof RODZAJE_PRZYPOMNIENIA)[number];

export const ETYKIETY_RODZAJU_PRZYPOMNIENIA: Record<RodzajPrzypomnienia, string> = {
  smieci: "Wywóz śmieci / odpady",
  podatek: "Podatki i opłaty lokalne",
  dzialka: "Działka / podatek rolny",
  pszok: "PSZOK / gabaryty",
  inne: "Inne terminy",
};

export type PreferencjePrzypomnien = {
  notify_smieci: boolean;
  notify_podatek: boolean;
  notify_dzialka: boolean;
  notify_pszok: boolean;
  notify_inne: boolean;
};

export const KLUCZ_PREF_RODZAJU: Record<RodzajPrzypomnienia, keyof PreferencjePrzypomnien> = {
  smieci: "notify_smieci",
  podatek: "notify_podatek",
  dzialka: "notify_dzialka",
  pszok: "notify_pszok",
  inne: "notify_inne",
};

export const DOMYSLNE_PREFERENCJE: PreferencjePrzypomnien = {
  notify_smieci: true,
  notify_podatek: true,
  notify_dzialka: true,
  notify_pszok: true,
  notify_inne: true,
};

export function czyRodzajWlaczony(prefs: PreferencjePrzypomnien, kind: RodzajPrzypomnienia): boolean {
  return prefs[KLUCZ_PREF_RODZAJU[kind]];
}
