/** Etykiety typów organizacji i wydarzeń — spójne UI publiczne i panel. */
export const ETYKIETA_TYP_GRUPY: Record<string, string> = {
  kgw: "Koło Gospodyń Wiejskich",
  osp: "OSP / straż pożarna",
  parafia: "Parafia / duszpasterstwo",
  rada_solecka: "Rada sołecka",
  seniorzy: "Klub seniora",
  mlodziez: "Młodzież / grupa młodzieżowa",
  wolontariat: "Wolontariat / pomoc sąsiedzka",
  rolnicy: "Koło rolników",
  przedsiebiorcy: "Lokalni przedsiębiorcy",
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
