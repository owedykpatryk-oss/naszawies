import slugify from "slugify";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { czyOrganizacjaOsp, czyOrganizacjaSport } from "@/lib/wies/profil-organizacji";

/** Segment URL → typy grup w bazie (null = filtrowanie heurystyczne). */
export const SEGMENTY_ORGANIZACJI = ["kgw", "parafia", "lowiectwo", "osp", "sport", "szkola", "rolnicy"] as const;

export type SegmentOrganizacji = (typeof SEGMENTY_ORGANIZACJI)[number];

const TYPY_PO_SEGMENCIE: Record<SegmentOrganizacji, string[] | "heurystyka"> = {
  kgw: ["kgw"],
  parafia: ["parafia"],
  lowiectwo: ["lowiectwo"],
  osp: ["osp"],
  sport: "heurystyka",
  szkola: ["szkola"],
  rolnicy: ["rolnicy"],
};

export function czySegmentOrganizacji(s: string): s is SegmentOrganizacji {
  return (SEGMENTY_ORGANIZACJI as readonly string[]).includes(s);
}

export function segmentDlaOrganizacji(groupType: string, name: string): SegmentOrganizacji | null {
  if (groupType === "kgw") return "kgw";
  if (groupType === "parafia") return "parafia";
  if (groupType === "lowiectwo") return "lowiectwo";
  if (groupType === "szkola") return "szkola";
  if (groupType === "rolnicy") return "rolnicy";
  if (czyOrganizacjaOsp(groupType, name) || groupType === "osp") return "osp";
  if (czyOrganizacjaSport(groupType, name) || groupType === "sport") return "sport";
  return null;
}

export function sciezkaPelnejStronyOrganizacji(
  wies: { voivodeship: string; county: string; commune: string; slug: string },
  org: { id: string; name: string; group_type: string; public_slug?: string | null },
): string | null {
  const segment = segmentDlaOrganizacji(org.group_type, org.name);
  if (!segment) return null;
  const slug = slugPublicznyOrganizacji(org.name, org.id, org.public_slug);
  return sciezkaStronyOrganizacji(wies, segment, slug);
}

export function wygenerujSlugOrganizacji(name: string, id: string): string {
  const base = slugify(name.trim() || "organizacja", {
    lower: true,
    strict: true,
    locale: "pl",
  });
  if (base.length >= 2) return base.slice(0, 72);
  return `org-${id.replace(/-/g, "").slice(0, 10)}`;
}

export function slugPublicznyOrganizacji(
  name: string,
  id: string,
  publicSlug: string | null | undefined,
): string {
  const custom = publicSlug?.trim();
  if (custom && custom.length >= 2) return custom;
  return wygenerujSlugOrganizacji(name, id);
}

export function sciezkaStronyOrganizacji(
  wies: { voivodeship: string; county: string; commune: string; slug: string },
  segment: SegmentOrganizacji,
  orgSlug: string,
): string {
  return `${sciezkaProfiluWsi(wies)}/${segment}/${orgSlug}`;
}

export function pasujeOrganizacjaDoSegmentu(
  groupType: string,
  name: string,
  segment: SegmentOrganizacji,
): boolean {
  const reg = TYPY_PO_SEGMENCIE[segment];
  if (reg === "heurystyka") return czyOrganizacjaSport(groupType, name);
  if (segment === "osp") return reg.includes(groupType) || czyOrganizacjaOsp(groupType, name);
  return reg.includes(groupType);
}
