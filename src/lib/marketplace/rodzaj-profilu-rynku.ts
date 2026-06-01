export const RODZAJE_PROFILU_RYNKU = ["sklep", "firma", "gospodarstwo", "uslugi"] as const;

export type RodzajProfiluRynku = (typeof RODZAJE_PROFILU_RYNKU)[number];

export const ETYKIETY_RODZAJU_PROFILU: Record<RodzajProfiluRynku, string> = {
  sklep: "Sklep",
  firma: "Firma",
  gospodarstwo: "Gospodarstwo",
  uslugi: "Usługi lokalne",
};

export function normalizujRodzajProfilu(wartosc: string | null | undefined): RodzajProfiluRynku {
  if (wartosc === "sklep" || wartosc === "gospodarstwo" || wartosc === "uslugi") return wartosc;
  return "firma";
}

export function etykietaRodzajuProfilu(wartosc: string | null | undefined): string {
  return ETYKIETY_RODZAJU_PROFILU[normalizujRodzajProfilu(wartosc)];
}
