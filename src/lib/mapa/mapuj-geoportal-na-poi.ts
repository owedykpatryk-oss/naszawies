/**
 * Mapowanie warstw PRG/PRNG (geo_context_features) na kategorie POI mapy.
 *
 * Uwaga: hydrantów nie ma w PRG/PRNG — importujemy je z OpenStreetMap (amenity=fire_hydrant).
 */

export type KandydatPoiZGeoportalu = {
  category: string;
  name: string;
  sourceExternalId: string;
  ospWaterSourceType?: "hydrant" | "staw" | "zbiornik" | "rzeka" | "inne";
};

/** Warstwy PRG AdministrativeBoundaries — nazwy z GetCapabilities (2026). */
const WARSTWA_INSTYTUCJA: Record<string, { category: string; domyslnaNazwa: string }> = {
  K07_Komenda_powiatowa_strazy_pozarnej: { category: "osp", domyslnaNazwa: "Komenda powiatowa PSP" },
  K06_Komenda_wojewodzka_strazy_pozarnej: { category: "osp", domyslnaNazwa: "Komenda wojewódzka PSP" },
  K01_Komenda_wojewodzka_policji: { category: "urzad", domyslnaNazwa: "Komenda wojewódzka Policji" },
  K02_Komenda_powiatowa_policji: { category: "urzad", domyslnaNazwa: "Komenda powiatowa Policji" },
  K03_Komenda_stoleczna_policji: { category: "urzad", domyslnaNazwa: "Komenda stołeczna Policji" },
  K04_Komenda_rejonowa_policji: { category: "urzad", domyslnaNazwa: "Komenda rejonowa Policji" },
  K05_Komisariat_policji: { category: "urzad", domyslnaNazwa: "Komisariat Policji" },
  P01_Prokuratura_regionalna: { category: "urzad", domyslnaNazwa: "Prokuratura regionalna" },
  P02_Prokuratura_okregowa: { category: "urzad", domyslnaNazwa: "Prokuratura okręgowa" },
  P03_Prokuratura_rejonowa: { category: "urzad", domyslnaNazwa: "Prokuratura rejonowa" },
  U06_Nadlesnictwo: { category: "inne", domyslnaNazwa: "Nadleśnictwo" },
  U07_Regionalna_dyrekcja_lasow_panstwowych: { category: "inne", domyslnaNazwa: "RDLP" },
  U01_Archiwum_panstwowe: { category: "urzad", domyslnaNazwa: "Archiwum państwowe" },
  U02_Urzad_skarbowy: { category: "urzad", domyslnaNazwa: "Urząd skarbowy" },
  U03_Wyspecjalizowany_urzad_skarbowy: { category: "urzad", domyslnaNazwa: "Urząd skarbowy (wyspecjalizowany)" },
  "U04_Urzad_celno-skarbowy": { category: "urzad", domyslnaNazwa: "Urząd celno-skarbowy" },
  U05_Izba_administracji_skarbowej: { category: "urzad", domyslnaNazwa: "Izba administracji skarbowej" },
  U08_Zarzad_zlewni_PGWWP: { category: "urzad", domyslnaNazwa: "Zarząd zlewni (PGW Woda Polskie)" },
  U09_Regionalny_zarzad_gospodarki_wodnej_PGWWP: { category: "urzad", domyslnaNazwa: "RZGW" },
  U10_Urzad_morski: { category: "urzad", domyslnaNazwa: "Urząd morski" },
  U11_Urzad_zeglugi_srodladowej: { category: "urzad", domyslnaNazwa: "Urząd żeglugi śródlądowej" },
  S02_Sad_okregowy: { category: "urzad", domyslnaNazwa: "Sąd okręgowy" },
  S03_Sad_rejonowy: { category: "urzad", domyslnaNazwa: "Sąd rejonowy" },
  S04_Wojewodzki_sad_administracyjny: { category: "urzad", domyslnaNazwa: "Wojewódzki sąd administracyjny" },
};

/** Obszary komórek organizacyjnych — tylko kontekst mapy, bez auto-POI (centroid mylący). */
const WARSTWY_TYLKO_KONTEKST = new Set([
  "K11_Obszar_dzialania_szefa_obrony_cywilnej_wojewodztwa",
  "K12_Obszar_dzialania_szefa_obrony_cywilnej_powiatu",
  "K13_Obszar_dzialania_szefa_obrony_cywilnej_gminy",
  "K08_Oddzial_strazy_granicznej",
  "K09_Placowka_strazy_granicznej",
  "K10_Dywizjon_strazy_granicznej",
  "S01_Sad_apelacyjny",
]);

function normalizujNazweWarstwy(layerName: string): string {
  const t = layerName.trim();
  const idx = t.indexOf(":");
  return idx >= 0 ? t.slice(idx + 1) : t;
}

function normTekst(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/ą/g, "a")
    .replace(/ć/g, "c")
    .replace(/ę/g, "e")
    .replace(/ł/g, "l")
    .replace(/ń/g, "n")
    .replace(/ó/g, "o")
    .replace(/ś/g, "s")
    .replace(/ź/g, "z")
    .replace(/ż/g, "z");
}

/** PRNG: studnie, źródła i zbiorniki → punkty wody OSP; jeziora/rzeki → nazwa geograficzna. */
export function mapujPrngNaPoi(
  featureCategory: string | null,
  featureName: string | null,
): Omit<KandydatPoiZGeoportalu, "sourceExternalId"> | null {
  const tekst = normTekst([featureCategory, featureName].filter(Boolean).join(" "));
  if (!tekst) return null;

  const nazwa = (featureName?.trim() || featureCategory?.trim() || "Obiekt PRNG").slice(0, 120);

  if (
    tekst.includes("studn") ||
    tekst.includes("zrodlo") ||
    tekst.includes("zrodl") ||
    tekst.includes("ujecie wody") ||
    tekst.includes("wodociag")
  ) {
    return {
      category: "osp_punkt_czerpania_wody",
      name: nazwa,
      ospWaterSourceType: "inne",
    };
  }
  if (tekst.includes("staw") || tekst.includes("zbiornik") || tekst.includes("retencyj")) {
    return {
      category: "osp_punkt_czerpania_wody",
      name: nazwa,
      ospWaterSourceType: "zbiornik",
    };
  }
  if (
    tekst.includes("rzek") ||
    tekst.includes("potok") ||
    tekst.includes("strum") ||
    tekst.includes("ciek")
  ) {
    return {
      category: "osp_punkt_czerpania_wody",
      name: nazwa,
      ospWaterSourceType: "rzeka",
    };
  }
  if (
    tekst.includes("jezior") ||
    tekst.includes("staw") ||
    tekst.includes("bagno") ||
    tekst.includes("torfow") ||
    tekst.includes("wznies") ||
    tekst.includes("wzgorz") ||
    tekst.includes("wierch") ||
    tekst.includes("las ") ||
    tekst.endsWith(" las")
  ) {
    return { category: "nazwa_geo", name: nazwa };
  }

  return null;
}

export function mapujGeoKontekstNaPoi(opts: {
  dataset: string;
  layerName: string;
  featureName: string | null;
  featureCategory: string | null;
  sourceExternalId: string;
}): KandydatPoiZGeoportalu | null {
  const layer = normalizujNazweWarstwy(opts.layerName);
  const nazwa =
    (opts.featureName?.trim() || opts.featureCategory?.trim() || "").slice(0, 120) || null;

  if (opts.dataset === "PRG_INSTITUTIONAL") {
    if (WARSTWY_TYLKO_KONTEKST.has(layer)) return null;
    const mapa = WARSTWA_INSTYTUCJA[layer];
    if (!mapa) return null;
    return {
      category: mapa.category,
      name: nazwa ?? mapa.domyslnaNazwa,
      sourceExternalId: `geoportal:${opts.sourceExternalId}`,
    };
  }

  if (opts.dataset === "PRNG") {
    const prng = mapujPrngNaPoi(opts.featureCategory, opts.featureName);
    if (!prng) return null;
    return {
      ...prng,
      sourceExternalId: `geoportal:prng:${opts.sourceExternalId}`,
    };
  }

  return null;
}
