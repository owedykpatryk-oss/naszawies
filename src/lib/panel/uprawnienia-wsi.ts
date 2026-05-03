export type RolaWsi =
  | "mieszkaniec"
  | "reprezentant_podmiotu"
  | "soltys"
  | "wspoladmin"
  | "kgw_przewodniczaca"
  | "osp_naczelnik"
  | "rada_solecka";

export type UprawnienieWsi =
  | "dostep_podstawowy"
  | "panel_soltysa"
  | "moderacja_tresci"
  | "decyzje_rezerwacji"
  | "zarzadzanie_spolecznoscia"
  | "zarzadzanie_kgw"
  | "zarzadzanie_osp";

const ROLE_BY_UPRAWNIENIE: Record<UprawnienieWsi, readonly RolaWsi[]> = {
  dostep_podstawowy: [
    "mieszkaniec",
    "reprezentant_podmiotu",
    "soltys",
    "wspoladmin",
    "kgw_przewodniczaca",
    "osp_naczelnik",
    "rada_solecka",
  ],
  panel_soltysa: ["soltys", "wspoladmin"],
  moderacja_tresci: ["soltys", "wspoladmin", "rada_solecka"],
  decyzje_rezerwacji: ["soltys", "wspoladmin"],
  zarzadzanie_spolecznoscia: ["soltys", "wspoladmin", "rada_solecka"],
  zarzadzanie_kgw: ["soltys", "wspoladmin", "kgw_przewodniczaca"],
  zarzadzanie_osp: ["soltys", "wspoladmin", "osp_naczelnik"],
};

export function roleDlaUprawnienia(uprawnienie: UprawnienieWsi): readonly RolaWsi[] {
  return ROLE_BY_UPRAWNIENIE[uprawnienie];
}

export function maUprawnienieWsi(rola: string, uprawnienie: UprawnienieWsi): boolean {
  return roleDlaUprawnienia(uprawnienie).includes(rola as RolaWsi);
}
