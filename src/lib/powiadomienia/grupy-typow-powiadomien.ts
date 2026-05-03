/** Znane `notifications.type` z kodu — grupy pod filtry listy powiadomień. */
const TYPY_WNIOSKI_I_ROLE = new Set([
  "role_application_submitted",
  "role_approved",
  "role_rejected",
]);

const TYPY_ZGLOSZEN = new Set([
  "issue_submitted",
  "issue_submitted_follower",
  "issue_status_updated",
  "issue_status_updated_soltys",
  "issue_status_updated_follower",
]);

export type GrupaListyPowiadomien = "wnioski_role" | "zgloszenia" | "pozostale";

export function grupaListyPowiadomien(typ: string): GrupaListyPowiadomien {
  if (TYPY_WNIOSKI_I_ROLE.has(typ)) return "wnioski_role";
  if (TYPY_ZGLOSZEN.has(typ)) return "zgloszenia";
  return "pozostale";
}

export function etykietaGrupyPowiadomien(grupa: GrupaListyPowiadomien): string {
  if (grupa === "wnioski_role") return "Wnioski i role";
  if (grupa === "zgloszenia") return "Zgłoszenia";
  return "Pozostałe";
}
