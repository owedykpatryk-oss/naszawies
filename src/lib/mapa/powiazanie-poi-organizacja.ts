import {
  pasujeOrganizacjaDoSegmentu,
  sciezkaPelnejStronyOrganizacji,
  type SegmentOrganizacji,
} from "@/lib/wies/sciezka-organizacji-publicznej";
import type { WierszOrganizacjiPublicznej } from "@/lib/wies/pobierz-strone-organizacji";

/** Kategoria POI → segment profilu organizacji (gdy jest jeden profil w wsi). */
const KATEGORIA_DO_SEGMENTU: Partial<Record<string, SegmentOrganizacji>> = {
  kosciol: "parafia",
  szkola: "szkola",
  przedszkole: "szkola",
  osp: "osp",
  boisko: "sport",
  hala_sportowa: "sport",
  swietlica: "kgw",
  dom_kultury: "kgw",
  sklep_rolniczy: "rolnicy",
  zagroda: "rolnicy",
  siedziba_kola: "lowiectwo",
  zebrania_kola: "lowiectwo",
};

/** Kotwica na profilu wsi (gdy brak osobnej mini-strony). */
const KOTWICA_NA_PROFILU_WSI: Partial<Record<SegmentOrganizacji, string>> = {
  parafia: "#parafia",
  szkola: "#sekcja-szkola",
  osp: "#osp",
  kgw: "#sekcja-organizacje",
  sport: "#sekcja-sport",
  rolnicy: "#sekcja-rolnictwo",
  lowiectwo: "#sekcja-organizacje",
};

export function segmentOrganizacjiDlaKategoriiPoi(kategoria: string): SegmentOrganizacji | null {
  const kat = kategoria.trim().toLowerCase();
  return KATEGORIA_DO_SEGMENTU[kat] ?? null;
}

export function etykietaLinkuOrganizacjiDlaPoi(kategoria: string): string | null {
  const segment = segmentOrganizacjiDlaKategoriiPoi(kategoria);
  if (!segment) return null;
  const etykiety: Record<SegmentOrganizacji, string> = {
    parafia: "Profil parafii",
    szkola: "Tablica szkoły",
    osp: "Profil OSP",
    kgw: "Profil KGW",
    sport: "Klub sportowy",
    rolnicy: "Koło rolników",
    lowiectwo: "Koło łowieckie",
  };
  return etykiety[segment];
}

export function kotwicaProfiluWsiDlaKategoriiPoi(kategoria: string): string | null {
  const segment = segmentOrganizacjiDlaKategoriiPoi(kategoria);
  if (!segment) return null;
  return KOTWICA_NA_PROFILU_WSI[segment] ?? null;
}

export function kandydaciOrganizacjiDlaKategoriiPoi(
  kategoria: string,
  organizacje: WierszOrganizacjiPublicznej[],
): WierszOrganizacjiPublicznej[] {
  const segment = segmentOrganizacjiDlaKategoriiPoi(kategoria);
  if (!segment) return [];
  return organizacje.filter((o) => pasujeOrganizacjaDoSegmentu(o.group_type, o.name, segment));
}

export function wybierzOrganizacjeDlaPoi(
  kategoria: string,
  linkedGroupId: string | null | undefined,
  organizacje: WierszOrganizacjiPublicznej[],
): WierszOrganizacjiPublicznej | null {
  if (linkedGroupId) {
    const jawna = organizacje.find((o) => o.id === linkedGroupId);
    if (jawna) return jawna;
  }
  const kandydaci = kandydaciOrganizacjiDlaKategoriiPoi(kategoria, organizacje);
  if (kandydaci.length === 1) return kandydaci[0];
  return null;
}

export function linkProfiluOrganizacjiDlaPoi(
  wies: { voivodeship: string; county: string; commune: string; slug: string },
  org: WierszOrganizacjiPublicznej,
  kategoria: string,
  sciezkaWsi: string,
): string {
  const pelna = sciezkaPelnejStronyOrganizacji(wies, org);
  if (pelna) return pelna;
  const kotwica = kotwicaProfiluWsiDlaKategoriiPoi(kategoria);
  return kotwica ? `${sciezkaWsi}${kotwica}` : sciezkaWsi;
}
