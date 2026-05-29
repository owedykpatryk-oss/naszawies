/**
 * Identyfikatory zmiennych BDL (temat P2967 — ceny skupu miesięczne, poziom regionu NUTS2).
 * Źródło: https://bdl.stat.gov.pl/api/v1/variables?subject-id=P2967
 */
export type WpisZmiennejGus = { id: number; unit: string };

/** Miesiąc (1–12) → produkt → zmienna GUS */
export const KATALOG_ZMIENNYCH_GUS_ROLNYCH: Record<number, Record<string, WpisZmiennejGus>> = {
  1: {
    pszenica: { id: 218207, unit: "zł/dt" },
    zyto: { id: 218187, unit: "zł/dt" },
    kukurydza: { id: 284046, unit: "zł/dt" },
    ziemniaki: { id: 218167, unit: "zł/dt" },
    mleko: { id: 218227, unit: "zł/hl" },
    wolowina: { id: 218147, unit: "zł/kg" },
    wieprzowina: { id: 218267, unit: "zł/kg" },
    drob: { id: 218247, unit: "zł/kg" },
  },
  2: {
    pszenica: { id: 218208, unit: "zł/dt" },
    zyto: { id: 218188, unit: "zł/dt" },
    kukurydza: { id: 284045, unit: "zł/dt" },
    ziemniaki: { id: 218168, unit: "zł/dt" },
    mleko: { id: 218228, unit: "zł/hl" },
    wolowina: { id: 218148, unit: "zł/kg" },
    wieprzowina: { id: 218268, unit: "zł/kg" },
    drob: { id: 218248, unit: "zł/kg" },
  },
  3: {
    pszenica: { id: 218209, unit: "zł/dt" },
    zyto: { id: 218189, unit: "zł/dt" },
    kukurydza: { id: 284044, unit: "zł/dt" },
    ziemniaki: { id: 218169, unit: "zł/dt" },
    mleko: { id: 218229, unit: "zł/hl" },
    wolowina: { id: 218149, unit: "zł/kg" },
    wieprzowina: { id: 218269, unit: "zł/kg" },
    drob: { id: 218249, unit: "zł/kg" },
  },
  4: {
    pszenica: { id: 218211, unit: "zł/dt" },
    zyto: { id: 218191, unit: "zł/dt" },
    kukurydza: { id: 284042, unit: "zł/dt" },
    ziemniaki: { id: 218171, unit: "zł/dt" },
    mleko: { id: 218231, unit: "zł/hl" },
    wolowina: { id: 218151, unit: "zł/kg" },
    wieprzowina: { id: 218271, unit: "zł/kg" },
    drob: { id: 218251, unit: "zł/kg" },
  },
  5: {
    pszenica: { id: 218212, unit: "zł/dt" },
    zyto: { id: 218192, unit: "zł/dt" },
    kukurydza: { id: 284041, unit: "zł/dt" },
    ziemniaki: { id: 218172, unit: "zł/dt" },
    mleko: { id: 218232, unit: "zł/hl" },
    wolowina: { id: 218152, unit: "zł/kg" },
    wieprzowina: { id: 218272, unit: "zł/kg" },
    drob: { id: 218252, unit: "zł/kg" },
  },
  6: {
    pszenica: { id: 218213, unit: "zł/dt" },
    zyto: { id: 218193, unit: "zł/dt" },
    kukurydza: { id: 284040, unit: "zł/dt" },
    ziemniaki: { id: 218173, unit: "zł/dt" },
    mleko: { id: 218233, unit: "zł/hl" },
    wolowina: { id: 218153, unit: "zł/kg" },
    wieprzowina: { id: 218273, unit: "zł/kg" },
    drob: { id: 218253, unit: "zł/kg" },
  },
  7: {
    pszenica: { id: 218215, unit: "zł/dt" },
    zyto: { id: 218195, unit: "zł/dt" },
    kukurydza: { id: 284038, unit: "zł/dt" },
    ziemniaki: { id: 218175, unit: "zł/dt" },
    mleko: { id: 218235, unit: "zł/hl" },
    wolowina: { id: 218155, unit: "zł/kg" },
    wieprzowina: { id: 218275, unit: "zł/kg" },
    drob: { id: 218255, unit: "zł/kg" },
  },
  8: {
    pszenica: { id: 218216, unit: "zł/dt" },
    zyto: { id: 218196, unit: "zł/dt" },
    kukurydza: { id: 284037, unit: "zł/dt" },
    ziemniaki: { id: 218176, unit: "zł/dt" },
    mleko: { id: 218236, unit: "zł/hl" },
    wolowina: { id: 218156, unit: "zł/kg" },
    wieprzowina: { id: 218276, unit: "zł/kg" },
    drob: { id: 218256, unit: "zł/kg" },
  },
  9: {
    pszenica: { id: 218217, unit: "zł/dt" },
    zyto: { id: 218197, unit: "zł/dt" },
    kukurydza: { id: 284036, unit: "zł/dt" },
    ziemniaki: { id: 218177, unit: "zł/dt" },
    mleko: { id: 218237, unit: "zł/hl" },
    wolowina: { id: 218157, unit: "zł/kg" },
    wieprzowina: { id: 218277, unit: "zł/kg" },
    drob: { id: 218257, unit: "zł/kg" },
  },
  10: {
    pszenica: { id: 218218, unit: "zł/dt" },
    zyto: { id: 218198, unit: "zł/dt" },
    kukurydza: { id: 284035, unit: "zł/dt" },
    ziemniaki: { id: 218178, unit: "zł/dt" },
    mleko: { id: 218238, unit: "zł/hl" },
    wolowina: { id: 218158, unit: "zł/kg" },
    wieprzowina: { id: 218278, unit: "zł/kg" },
    drob: { id: 218258, unit: "zł/kg" },
  },
  11: {
    pszenica: { id: 218219, unit: "zł/dt" },
    zyto: { id: 218199, unit: "zł/dt" },
    kukurydza: { id: 284034, unit: "zł/dt" },
    ziemniaki: { id: 218179, unit: "zł/dt" },
    mleko: { id: 218239, unit: "zł/hl" },
    wolowina: { id: 218159, unit: "zł/kg" },
    wieprzowina: { id: 218279, unit: "zł/kg" },
    drob: { id: 218259, unit: "zł/kg" },
  },
  12: {
    pszenica: { id: 218221, unit: "zł/dt" },
    zyto: { id: 218201, unit: "zł/dt" },
    kukurydza: { id: 284032, unit: "zł/dt" },
    ziemniaki: { id: 218181, unit: "zł/dt" },
    mleko: { id: 218241, unit: "zł/hl" },
    wolowina: { id: 218161, unit: "zł/kg" },
    wieprzowina: { id: 218141, unit: "zł/kg" },
    drob: { id: 218261, unit: "zł/kg" },
  },
};

/** Ostatnie N miesięcy kalendarzowych (bez bieżącego, bo GUS ma ~1 mies. opóźnienia). */
export function ostatnieMiesiaceGus(ile = 12): { year: number; month: number }[] {
  const out: { year: number; month: number }[] = [];
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  for (let i = 0; i < ile; i++) {
    out.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
    d.setMonth(d.getMonth() - 1);
  }
  return out;
}
