/** P2462 — ludność gminy, rok ogółem (poziom 6). */
export const GUS_LUDNOSC_GMINA_VAR_ID = 745231;

/** PSR 2020 / G637 — gospodarstwa ogółem (poziom 6, rok 2020). */
export const GUS_PSR_GOSPODARSTWA_VAR_ID = 1633195;

/** PSR 2020 — łączna powierzchnia UR w ha (poziom 6, rok 2020). */
export const GUS_PSR_POWIERZCHNIA_HA_VAR_ID = 1645031;

/** P3415 — cena użytków rolnych ogółem za 1 ha (województwo). */
export const GUS_GRUNTY_ORNE_VAR_ID = 450364;

export const GUS_PSR_ROK = 2020;

export type KanalCenyGus = "skup" | "targ";

export const KANALY_CEN_GUS: KanalCenyGus[] = ["skup", "targ"];

/** Prefiks TERC (2 cyfry) → slug województwa w bazie (ASCII, bez ogonków). */
export const TERC_WOJ_DO_SLUG: Record<string, string> = {
  "02": "dolnoslaskie",
  "04": "kujawsko-pomorskie",
  "06": "lubelskie",
  "08": "lubuskie",
  "10": "lodzkie",
  "12": "malopolskie",
  "14": "mazowieckie",
  "16": "opolskie",
  "18": "podkarpackie",
  "20": "podlaskie",
  "22": "pomorskie",
  "24": "slaskie",
  "26": "swietokrzyskie",
  "28": "warminsko-mazurskie",
  "30": "wielkopolskie",
  "32": "zachodniopomorskie",
};

/** Slug województwa z identyfikatora jednostki BDL (cyfry 3–4 = kod TERC woj.). */
export function slugWojewodztwaZBdlUnitId(unitId: string): string | null {
  const id = unitId.trim();
  if (id.length < 4) return null;
  const prefix = id.slice(2, 4);
  return TERC_WOJ_DO_SLUG[prefix] ?? null;
}

/**
 * Id jednostki BDL (12 cyfr, NUTS) → kod TERC gminy (7 cyfr).
 * Struktura BDL: makro(2) + woj(2) + region(1) + podregion(2) + powiat(2) + gmina(3).
 */
export function idBdlDoTercGminy(bdlUnitId: string): string | null {
  const id = bdlUnitId.trim();
  if (id.length !== 12 || !/^\d{12}$/.test(id)) return null;
  const woj = id.slice(2, 4);
  const pow = id.slice(7, 9);
  const gmi = id.slice(9, 12);
  const terc = `${woj}${pow}${gmi}`;
  return /^\d{7}$/.test(terc) ? terc : null;
}
