export type OrganizacjaSportowaSkrot = {
  id: string;
  name: string;
  group_type: string;
};

const RODZAJE_WYDARZEN_SPORTOWYCH = new Set(["mecz", "proba", "wyjazd"]);

function nazwaSugerujeSport(name: string): boolean {
  const n = name.toLowerCase();
  return (
    n.includes("klub") ||
    n.includes("sport") ||
    n.includes("liga") ||
    n.includes("lks") ||
    n.includes("mks") ||
    n.includes("ts ") ||
    n.includes("futbol") ||
    n.includes("piłk") ||
    n.includes("pilk") ||
    n.includes("koszyk") ||
    n.includes("siatków") ||
    n.includes("tenis") ||
    n.includes("zawody") ||
    n.includes("orlik")
  );
}

/** Grupa klubu / sekcji sportowej na profilu wsi. */
export function czyOrganizacjaSport(groupType: string, name: string): boolean {
  if (groupType === "sport") return true;
  if (groupType === "osp") return false;
  return nazwaSugerujeSport(name);
}

export function nazwyKlubowSportowych(kluby: OrganizacjaSportowaSkrot[]): string[] {
  return kluby.map((k) => k.name.trim()).filter(Boolean);
}

function pasujeDoKlubu(nazwaGrupy: string | null | undefined, kluby: string[]): boolean {
  if (!nazwaGrupy?.trim()) return false;
  const ng = nazwaGrupy.trim().toLowerCase();
  return kluby.some((k) => {
    const kk = k.toLowerCase();
    return ng === kk || ng.includes(kk) || kk.includes(ng);
  });
}

/** Mecz, trening, wyjazd lub wydarzenie przypisane do klubu sportowego. */
export function czyWydarzenieSportowe(
  eventKind: string,
  nazwaGrupy: string | null | undefined,
  kluby: string[] = [],
): boolean {
  if (RODZAJE_WYDARZEN_SPORTOWYCH.has(eventKind)) {
    if (kluby.length === 0) return true;
    return pasujeDoKlubu(nazwaGrupy, kluby) || !nazwaGrupy?.trim();
  }
  if (pasujeDoKlubu(nazwaGrupy, kluby)) return true;
  if (!nazwaGrupy?.trim()) return false;
  const ng = nazwaGrupy.trim().toLowerCase();
  if (ng.includes("osp") || ng.includes("straż") || ng.includes("straz")) return false;
  return nazwaSugerujeSport(nazwaGrupy);
}

export function czySlotHarmonogramuSportowego(
  nazwaGrupy: string | null | undefined,
  kluby: string[] = [],
): boolean {
  if (kluby.length > 0 && pasujeDoKlubu(nazwaGrupy, kluby)) return true;
  if (!nazwaGrupy?.trim()) return false;
  return nazwaSugerujeSport(nazwaGrupy);
}
