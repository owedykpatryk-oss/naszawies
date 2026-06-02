/** Etykiety typów organizacji i wydarzeń — spójne UI publiczne i panel. */
export const ETYKIETA_TYP_GRUPY: Record<string, string> = {
  kgw: "Koło Gospodyń Wiejskich",
  osp: "OSP / straż pożarna",
  parafia: "Parafia / duszpasterstwo",
  rada_solecka: "Rada sołecka",
  seniorzy: "Klub seniora",
  mlodziez: "Młodzież / grupa młodzieżowa",
  szkola: "Szkoła / przedszkole",
  wolontariat: "Wolontariat / pomoc sąsiedzka",
  rolnicy: "Koło rolników",
  przedsiebiorcy: "Lokalni przedsiębiorcy",
  sport: "Klub / sport",
  taniec: "Grupa taneczna",
  muzyka: "Zespół / muzyka",
  lowiectwo: "Koło łowieckie / myśliwi",
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
  msza: "Msza św.",
  nabozenstwo: "Nabożeństwo",
  katecheza: "Katecheza / formacja",
  sakrament: "Chrzest / ślub / pogrzeb",
  zebranie_kgw: "Zebranie KGW",
  kiermasz: "Kiermasz / jarmark",
  warsztaty: "Warsztaty / zajęcia",
  piknik: "Piknik / festyn wiejski",
  polowanie: "Polowanie (informacja)",
  zebranie_lowieckie: "Zebranie koła",
  szkolenie_lowieckie: "Szkolenie / egzamin",
  hubertus: "Hubertus / uroczystość",
  trening: "Trening",
  spacer: "Spacer / marsz",
  rajd: "Rajd / wycieczka rowerowa",
  inne: "Wydarzenie",
};

export function etykietaTypuGrupy(kod: string): string {
  return ETYKIETA_TYP_GRUPY[kod] ?? kod;
}

export function etykietaRodzajuWydarzenia(kod: string): string {
  return ETYKIETA_RODZAJU_WYDARZENIA[kod] ?? kod;
}

const RODZAJE_WYDARZEN_PARAFIALNYCH = new Set([
  "msza",
  "nabozenstwo",
  "katecheza",
  "sakrament",
  "hubertus",
]);

/** Wydarzenie liturgiczne lub przypisane do profilu parafii. */
export function czyWydarzenieParafialne(
  eventKind: string,
  nazwaGrupy: string | null | undefined,
  nazwaParafii?: string | null,
): boolean {
  if (RODZAJE_WYDARZEN_PARAFIALNYCH.has(eventKind)) return true;
  if (!nazwaParafii?.trim() || !nazwaGrupy?.trim()) return false;
  return nazwaGrupy.trim().toLowerCase() === nazwaParafii.trim().toLowerCase();
}

const RODZAJE_WYDARZEN_KGW = new Set([
  "zebranie_kgw",
  "kiermasz",
  "festyn",
  "warsztaty",
  "piknik",
  "wystep",
]);

/** Wydarzenie KGW lub przypisane do profilu koła. */
export function czyWydarzenieKgw(
  eventKind: string,
  nazwaGrupy: string | null | undefined,
  nazwaKola?: string | null,
): boolean {
  if (RODZAJE_WYDARZEN_KGW.has(eventKind)) return true;
  if (!nazwaKola?.trim() || !nazwaGrupy?.trim()) return false;
  return nazwaGrupy.trim().toLowerCase() === nazwaKola.trim().toLowerCase();
}

const RODZAJE_WYDARZEN_OSP = new Set(["proba"]);

/** Wydarzenie OSP — ćwiczenia lub przypisane do jednostki. */
export function czyWydarzenieOsp(
  eventKind: string,
  nazwaGrupy: string | null | undefined,
  nazwaJednostki?: string | null,
): boolean {
  if (RODZAJE_WYDARZEN_OSP.has(eventKind)) return true;
  if (!nazwaGrupy?.trim()) return false;
  const ng = nazwaGrupy.trim().toLowerCase();
  if (nazwaJednostki?.trim() && ng === nazwaJednostki.trim().toLowerCase()) return true;
  return ng.includes("osp") || ng.includes("straż") || ng.includes("straz");
}

const RODZAJE_WYDARZEN_LOWIECKICH = new Set([
  "polowanie",
  "zebranie_lowieckie",
  "szkolenie_lowieckie",
  "hubertus",
]);

/** Wydarzenie koła łowieckiego lub przypisane do profilu myśliwych. */
export function czyWydarzenieLowieckie(
  eventKind: string,
  nazwaGrupy: string | null | undefined,
  nazwaKola?: string | null,
): boolean {
  if (RODZAJE_WYDARZEN_LOWIECKICH.has(eventKind)) return true;
  if (!nazwaKola?.trim() || !nazwaGrupy?.trim()) return false;
  const ng = nazwaGrupy.trim().toLowerCase();
  if (ng === nazwaKola.trim().toLowerCase()) return true;
  return ng.includes("łow") || ng.includes("low") || ng.includes("myśliw") || ng.includes("mysliw");
}
