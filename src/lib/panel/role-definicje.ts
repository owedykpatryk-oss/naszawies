/**
 * Centralne definicje ról użytkownika w obrębie jednej wsi.
 * Ułatwia spójne filtrowanie i etykiety w panelach.
 */
export const ROLE_MIESZKANIEC_CORE = [
  "mieszkaniec",
  "reprezentant_podmiotu",
] as const;

export const ROLE_PANELU_SOLTYSA = ["soltys", "wspoladmin"] as const;

/** Role organizacyjne (bardziej wyspecjalizowane uprawnienia lokalne). */
export const ROLE_ORG_WSI = [
  "kgw_przewodniczaca",
  "osp_naczelnik",
  "rada_solecka",
] as const;

/** Każda aktywna rola, która powinna mieć dostęp do podstawowych modułów mieszkańca. */
export const ROLE_AKTYWNY_UCZESTNIK_WSI = [
  ...ROLE_MIESZKANIEC_CORE,
  ...ROLE_PANELU_SOLTYSA,
  ...ROLE_ORG_WSI,
] as const;

export const ROLE_KGW = ["kgw_przewodniczaca"] as const;
export const ROLE_OSP = ["osp_naczelnik"] as const;
export const ROLE_RADA_SOLECKA = ["rada_solecka"] as const;

export function etykietaRoliWsi(rola: string): string {
  if (rola === "mieszkaniec") return "Mieszkaniec";
  if (rola === "soltys") return "Sołtys";
  if (rola === "wspoladmin") return "Współadmin";
  if (rola === "reprezentant_podmiotu") return "Reprezentant podmiotu";
  if (rola === "kgw_przewodniczaca") return "Przewodnicząca KGW";
  if (rola === "osp_naczelnik") return "Naczelnik OSP";
  if (rola === "rada_solecka") return "Rada sołecka";
  return rola;
}
