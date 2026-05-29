/** Dwucyfrowy kod TERYT (WOJ/POW/GMI) — w XML GUS bywa „2” zamiast „02”. */
export function kodTeryt2(wartosc) {
  const s = String(wartosc ?? "").trim();
  if (!s) return "";
  return /^\d+$/.test(s) ? s.padStart(2, "0") : s;
}

export function kluczPowiatuTeryt(woj, pow) {
  return `${kodTeryt2(woj)}-${kodTeryt2(pow)}`;
}

export function kluczGminyTeryt(woj, pow, gmi) {
  return `${kodTeryt2(woj)}-${kodTeryt2(pow)}-${kodTeryt2(gmi)}`;
}

export const VOIVODESHIPS = {
  "02": "dolnośląskie",
  "04": "kujawsko-pomorskie",
  "06": "lubelskie",
  "08": "lubuskie",
  "10": "łódzkie",
  "12": "małopolskie",
  "14": "mazowieckie",
  "16": "opolskie",
  "18": "podkarpackie",
  "20": "podlaskie",
  "22": "pomorskie",
  "24": "śląskie",
  "26": "świętokrzyskie",
  "28": "warmińsko-mazurskie",
  "30": "wielkopolskie",
  "32": "zachodniopomorskie",
};

export const COMMUNE_TYPES = {
  "1": "gmina_miejska",
  "2": "gmina_wiejska",
  "3": "gmina_miejsko_wiejska",
  "4": "miasto_w_gminie_miejsko_wiejskiej",
  "5": "obszar_wiejski_w_gminie_miejsko_wiejskiej",
  "8": "dzielnica_m_st_warszawy",
  "9": "delegatura_w_miastach",
};
