import type { SupabaseClient } from "@supabase/supabase-js";
import {
  linkProfiluOrganizacjiDlaPoi,
  segmentOrganizacjiDlaKategoriiPoi,
  wybierzOrganizacjeDlaPoi,
} from "@/lib/mapa/powiazanie-poi-organizacja";
import {
  parsujProfilOsp,
  parsujProfilParafii,
  parsujProfilSzkoly,
} from "@/lib/wies/profil-organizacji";
import { pobierzOrganizacjeAktywneWsi } from "@/lib/wies/pobierz-strone-organizacji";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import type { SegmentOrganizacji } from "@/lib/wies/sciezka-organizacji-publicznej";

export type PodgladOrganizacjiPoi = {
  id: string;
  nazwa: string;
  segment: SegmentOrganizacji;
  opisKrotki: string | null;
  podtytul: string | null;
  telefon: string | null;
  linkProfilu: string;
};

export async function pobierzPodgladOrganizacjiDlaPoi(
  supabase: SupabaseClient,
  args: {
    villageId: string;
    kategoria: string;
    linkedGroupId?: string | null;
    wies: { voivodeship: string; county: string; commune: string; slug: string };
  },
): Promise<PodgladOrganizacjiPoi | null> {
  const segment = segmentOrganizacjiDlaKategoriiPoi(args.kategoria);
  if (!segment) return null;

  const organizacje = await pobierzOrganizacjeAktywneWsi(supabase, args.villageId);
  const org = wybierzOrganizacjeDlaPoi(args.kategoria, args.linkedGroupId, organizacje);
  if (!org) return null;

  const sciezkaWsi = sciezkaProfiluWsi(args.wies);
  const linkProfilu = linkProfiluOrganizacjiDlaPoi(args.wies, org, args.kategoria, sciezkaWsi);

  let podtytul: string | null = null;
  if (segment === "parafia") {
    const p = parsujProfilParafii(org.profile_data);
    if (p?.proboszcz) podtytul = `Proboszcz: ${p.proboszcz}`;
    else if (p?.msze_niedziele) podtytul = p.msze_niedziele.split("\n")[0]?.trim() ?? null;
  } else if (segment === "szkola") {
    const p = parsujProfilSzkoly(org.profile_data);
    if (p?.dyrektor) podtytul = `Dyrektor: ${p.dyrektor}`;
    else if (p?.sekretariat) podtytul = p.sekretariat.split("\n")[0]?.trim() ?? null;
  } else if (segment === "osp") {
    const p = parsujProfilOsp(org.profile_data);
    if (p?.naczelnik) podtytul = `Naczelnik: ${p.naczelnik}`;
  }

  return {
    id: org.id,
    nazwa: org.name,
    segment,
    opisKrotki: org.short_description?.trim() || null,
    podtytul,
    telefon: org.contact_phone?.trim() || null,
    linkProfilu,
  };
}
