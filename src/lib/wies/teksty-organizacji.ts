/** Etykiety typów organizacji i wydarzeń — spójne UI publiczne i panel. */
export const ETYKIETA_TYP_GRUPY: Record<string, string> = {
  kgw: "Koło Gospodyń Wiejskich",
  sport: "Klub / sport",
  taniec: "Grupa taneczna",
  muzyka: "Zespół / muzyka",
  kolo: "Koło / stowarzyszenie",
  inne: "Inna organizacja",
};

export const ETYKIETA_RODZAJU_WYDARZENIA: Record<string, string> = {
  mecz: "Mecz / zawody",
  wyjazd: "Wyjazd / wycieczka",
  proba: "Próba / zajęcia",
  wystep: "Występ / koncert",
  spotkanie: "Spotkanie",
  festyn: "Festyn / impreza",
  inne: "Wydarzenie",
};

export function etykietaTypuGrupy(kod: string): string {
  return ETYKIETA_TYP_GRUPY[kod] ?? kod;
}

export function etykietaRodzajuWydarzenia(kod: string): string {
  return ETYKIETA_RODZAJU_WYDARZENIA[kod] ?? kod;
}
