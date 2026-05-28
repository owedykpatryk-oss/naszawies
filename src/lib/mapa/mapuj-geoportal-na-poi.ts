/**
 * Mapowanie warstw PRG/PRNG (geo_context_features) na kategorie POI mapy.
 */

export type KandydatPoiZGeoportalu = {
  category: string;
  name: string;
  sourceExternalId: string;
};

const WARSTWA_INSTYTUCJA: Record<string, { category: string; domyslnaNazwa: string }> = {
  K07_Komenda_powiatowa_strazy_pozarnej: { category: "osp", domyslnaNazwa: "Komenda powiatowa PSP" },
  K06_Komenda_wojewodzka_strazy_pozarnej: { category: "osp", domyslnaNazwa: "Komenda wojewódzka PSP" },
  K02_Komenda_powiatowa_policji: { category: "urzad", domyslnaNazwa: "Komenda powiatowa Policji" },
  K05_Komisariat_policji: { category: "urzad", domyslnaNazwa: "Komisariat Policji" },
  K04_Komenda_rejonowa_policji: { category: "urzad", domyslnaNazwa: "Komenda rejonowa Policji" },
  U06_Nadlesnictwo: { category: "inne", domyslnaNazwa: "Nadleśnictwo" },
  U02_Urzad_skarbowy: { category: "urzad", domyslnaNazwa: "Urząd skarbowy" },
  U09_Regionalny_zarzad_gospodarki_wodnej_PGWWP: { category: "urzad", domyslnaNazwa: "RZGW" },
  U07_Regionalna_dyrekcja_lasow_panstwowych: { category: "inne", domyslnaNazwa: "RDLP" },
  S03_Sad_rejonowy: { category: "urzad", domyslnaNazwa: "Sąd rejonowy" },
};

function normalizujNazweWarstwy(layerName: string): string {
  const t = layerName.trim();
  const idx = t.indexOf(":");
  return idx >= 0 ? t.slice(idx + 1) : t;
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
    const mapa = WARSTWA_INSTYTUCJA[layer];
    if (!mapa) return null;
    return {
      category: mapa.category,
      name: nazwa ?? mapa.domyslnaNazwa,
      sourceExternalId: `geoportal:${opts.sourceExternalId}`,
    };
  }

  if (opts.dataset === "PRNG" && nazwa) {
    const rodzaj = opts.featureCategory?.trim();
    const pelna = rodzaj ? `${nazwa} (${rodzaj})` : nazwa;
    return {
      category: "inne",
      name: pelna.slice(0, 120),
      sourceExternalId: `geoportal:prng:${opts.sourceExternalId}`,
    };
  }

  return null;
}
