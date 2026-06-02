export type KategoriaProduktuLokalnego = "rolne" | "opal" | "paliwa" | "inne";

export type ProduktLokalny = {
  key: string;
  label: string;
  jednostka: string;
  kategoria: KategoriaProduktuLokalnego;
  /** Fraza do wyszukania zmiennej w API GUS BDL (tylko rolne). */
  frazaGus?: string;
};

export const PRODUKTY_ROLNE: ProduktLokalny[] = [
  { key: "pszenica", label: "Pszenica", jednostka: "zł/dt", kategoria: "rolne", frazaGus: "pszenica" },
  { key: "zyto", label: "Żyto", jednostka: "zł/dt", kategoria: "rolne", frazaGus: "żyto" },
  { key: "kukurydza", label: "Kukurydza", jednostka: "zł/dt", kategoria: "rolne", frazaGus: "kukurydza" },
  { key: "ziemniaki", label: "Ziemniaki", jednostka: "zł/dt", kategoria: "rolne", frazaGus: "ziemniaki" },
  { key: "mleko", label: "Mleko", jednostka: "zł/hl", kategoria: "rolne", frazaGus: "mleko" },
  { key: "wolowina", label: "Wołowina", jednostka: "zł/kg", kategoria: "rolne", frazaGus: "wołowina" },
  { key: "wieprzowina", label: "Wieprzowina", jednostka: "zł/kg", kategoria: "rolne", frazaGus: "wieprzowina" },
  { key: "drob", label: "Drób", jednostka: "zł/kg", kategoria: "rolne", frazaGus: "drób" },
];

export const PRODUKTY_OPAL: ProduktLokalny[] = [
  { key: "pellet", label: "Pellet", jednostka: "zł/t", kategoria: "opal" },
  { key: "wegiel_groszek", label: "Węgiel — groszek", jednostka: "zł/t", kategoria: "opal" },
  { key: "wegiel_orzech", label: "Węgiel — orzech", jednostka: "zł/t", kategoria: "opal" },
  { key: "wegiel_kostka", label: "Węgiel — kostka", jednostka: "zł/t", kategoria: "opal" },
  { key: "ekogroszek", label: "Ekogroszek", jednostka: "zł/t", kategoria: "opal" },
  { key: "brykiet", label: "Brykiet", jednostka: "zł/t", kategoria: "opal" },
  { key: "drewno_opalowe", label: "Drewno opałowe", jednostka: "zł/m³", kategoria: "opal" },
  { key: "gaz_butla", label: "Gaz — butla 11 kg", jednostka: "zł/szt.", kategoria: "opal" },
];

export const PRODUKTY_INNE: ProduktLokalny[] = [
  { key: "adblue", label: "AdBlue", jednostka: "zł/l", kategoria: "paliwa" },
  { key: "olej_napedowy_rolniczy", label: "Olej napędowy (rolniczy)", jednostka: "zł/l", kategoria: "paliwa" },
  { key: "nawoz_saletra", label: "Saletra amonowa", jednostka: "zł/t", kategoria: "inne" },
  { key: "pasza", label: "Pasza dla zwierząt", jednostka: "zł/t", kategoria: "inne" },
];

export const PRODUKTY_LOKALNE: ProduktLokalny[] = [
  ...PRODUKTY_ROLNE,
  ...PRODUKTY_OPAL,
  ...PRODUKTY_INNE,
];

export const KLUCZE_PRODUKTOW_LOKALNYCH = PRODUKTY_LOKALNE.map((p) => p.key) as [string, ...string[]];

export const KLUCZE_PRODUKTOW_OPAL = PRODUKTY_OPAL.map((p) => p.key);

export const MIN_POTWIERDZEN_SPOLECZNYCH = 3;

export const ETYKIETY_KATEGORII_PRODUKTU: Record<KategoriaProduktuLokalnego, string> = {
  rolne: "Zboże i skup",
  opal: "Opał i gaz",
  paliwa: "Paliwa i AdBlue",
  inne: "Inne",
};

export function znajdzProduktLokalny(key: string): ProduktLokalny | undefined {
  return PRODUKTY_LOKALNE.find((p) => p.key === key);
}

export function etykietaProduktuLokalnego(key: string): string {
  return znajdzProduktLokalny(key)?.label ?? key;
}

export function jednostkaProduktuLokalnego(key: string): string {
  return znajdzProduktLokalny(key)?.jednostka ?? "";
}

export function produktyPoKategorii(kategoria: KategoriaProduktuLokalnego): ProduktLokalny[] {
  return PRODUKTY_LOKALNE.filter((p) => p.kategoria === kategoria);
}
