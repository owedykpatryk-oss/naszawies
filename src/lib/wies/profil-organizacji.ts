import { z } from "zod";

/** Wspólny typ organizacji z pełnymi danymi (panel sołtysa). */
export type OrganizacjaPelna = {
  id: string;
  village_id: string;
  group_type: string;
  name: string;
  short_description: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  meeting_place: string | null;
  schedule_text: string | null;
  profile_data: unknown;
};

/** Rozszerzony profil parafii — trzymany w `village_community_groups.profile_data`. */
export const schemaProfilParafii = z.object({
  wersja: z.literal(1).default(1),
  proboszcz: z.string().trim().max(160).nullable().optional(),
  wikary: z.string().trim().max(160).nullable().optional(),
  adres_kosciola: z.string().trim().max(300).nullable().optional(),
  strona_www: z.string().trim().max(500).nullable().optional(),
  msze_niedziele: z.string().trim().max(800).nullable().optional(),
  msze_dni_powszednie: z.string().trim().max(800).nullable().optional(),
  spowiedz: z.string().trim().max(500).nullable().optional(),
  kancelaria: z.string().trim().max(500).nullable().optional(),
  sakramenty: z.string().trim().max(1200).nullable().optional(),
  grupy_duszpasterskie: z.string().trim().max(800).nullable().optional(),
  uwagi: z.string().trim().max(800).nullable().optional(),
});

export type ProfilParafiiJson = z.infer<typeof schemaProfilParafii>;

export function pustyProfilParafii(): ProfilParafiiJson {
  return { wersja: 1 };
}

export function parsujProfilParafii(raw: unknown): ProfilParafiiJson | null {
  if (raw == null || typeof raw !== "object") return null;
  const w = schemaProfilParafii.safeParse(raw);
  if (!w.success) return null;
  return w.data;
}

export function profilParafiiZFormularza(fd: FormData): ProfilParafiiJson {
  const pole = (k: string) => {
    const t = String(fd.get(k) ?? "").trim();
    return t.length ? t : null;
  };
  return {
    wersja: 1,
    proboszcz: pole("parafia_proboszcz"),
    wikary: pole("parafia_wikary"),
    adres_kosciola: pole("parafia_adres_kosciola"),
    strona_www: pole("parafia_strona_www"),
    msze_niedziele: pole("parafia_msze_niedziele"),
    msze_dni_powszednie: pole("parafia_msze_dni_powszednie"),
    spowiedz: pole("parafia_spowiedz"),
    kancelaria: pole("parafia_kancelaria"),
    sakramenty: pole("parafia_sakramenty"),
    grupy_duszpasterskie: pole("parafia_grupy"),
    uwagi: pole("parafia_uwagi"),
  };
}

export function czyProfilParafiiUzupelniony(p: ProfilParafiiJson | null): boolean {
  if (!p) return false;
  return Boolean(
    p.proboszcz?.trim() ||
      p.msze_niedziele?.trim() ||
      p.msze_dni_powszednie?.trim() ||
      p.kancelaria?.trim() ||
      p.spowiedz?.trim(),
  );
}

/** Rozszerzony profil KGW — trzymany w `village_community_groups.profile_data`. */
export const schemaProfilKgw = z.object({
  wersja: z.literal(1).default(1),
  przewodniczaca: z.string().trim().max(160).nullable().optional(),
  zastepczyni: z.string().trim().max(160).nullable().optional(),
  rok_zalozenia: z.string().trim().max(20).nullable().optional(),
  strona_www: z.string().trim().max(500).nullable().optional(),
  facebook: z.string().trim().max(500).nullable().optional(),
  miejsce_spotkan: z.string().trim().max(300).nullable().optional(),
  zebrania: z.string().trim().max(800).nullable().optional(),
  dzialalnosc: z.string().trim().max(1200).nullable().optional(),
  jak_dolaczyc: z.string().trim().max(800).nullable().optional(),
  produkty_lokalne: z.string().trim().max(800).nullable().optional(),
  wspolpraca_dotacje: z.string().trim().max(800).nullable().optional(),
  uwagi: z.string().trim().max(800).nullable().optional(),
});

export type ProfilKgwJson = z.infer<typeof schemaProfilKgw>;

export function parsujProfilKgw(raw: unknown): ProfilKgwJson | null {
  if (raw == null || typeof raw !== "object") return null;
  const w = schemaProfilKgw.safeParse(raw);
  if (!w.success) return null;
  return w.data;
}

export function profilKgwZFormularza(fd: FormData): ProfilKgwJson {
  const pole = (k: string) => {
    const t = String(fd.get(k) ?? "").trim();
    return t.length ? t : null;
  };
  return {
    wersja: 1,
    przewodniczaca: pole("kgw_przewodniczaca"),
    zastepczyni: pole("kgw_zastepczyni"),
    rok_zalozenia: pole("kgw_rok_zalozenia"),
    strona_www: pole("kgw_strona_www"),
    facebook: pole("kgw_facebook"),
    miejsce_spotkan: pole("kgw_miejsce_spotkan"),
    zebrania: pole("kgw_zebrania"),
    dzialalnosc: pole("kgw_dzialalnosc"),
    jak_dolaczyc: pole("kgw_jak_dolaczyc"),
    produkty_lokalne: pole("kgw_produkty_lokalne"),
    wspolpraca_dotacje: pole("kgw_wspolpraca_dotacje"),
    uwagi: pole("kgw_uwagi"),
  };
}

export function czyProfilKgwUzupelniony(p: ProfilKgwJson | null): boolean {
  if (!p) return false;
  return Boolean(
    p.przewodniczaca?.trim() ||
      p.zebrania?.trim() ||
      p.miejsce_spotkan?.trim() ||
      p.dzialalnosc?.trim() ||
      p.jak_dolaczyc?.trim(),
  );
}

/** Rozszerzony profil koła łowieckiego — `village_community_groups.profile_data`. */
export const schemaProfilLowiecki = z.object({
  wersja: z.literal(1).default(1),
  prezes: z.string().trim().max(160).nullable().optional(),
  lowczy: z.string().trim().max(160).nullable().optional(),
  numer_kola: z.string().trim().max(80).nullable().optional(),
  obszar_lowiecki: z.string().trim().max(800).nullable().optional(),
  strona_www: z.string().trim().max(500).nullable().optional(),
  facebook: z.string().trim().max(500).nullable().optional(),
  siedziba_kola: z.string().trim().max(300).nullable().optional(),
  zebrania: z.string().trim().max(800).nullable().optional(),
  sezon_lowiecki: z.string().trim().max(500).nullable().optional(),
  zasady_bezpieczenstwa: z.string().trim().max(1200).nullable().optional(),
  wspolpraca_rolnicy: z.string().trim().max(800).nullable().optional(),
  kontakt_dla_mieszkancow: z.string().trim().max(800).nullable().optional(),
  uwagi: z.string().trim().max(800).nullable().optional(),
});

export type ProfilLowieckiJson = z.infer<typeof schemaProfilLowiecki>;

export function parsujProfilLowiecki(raw: unknown): ProfilLowieckiJson | null {
  if (raw == null || typeof raw !== "object") return null;
  const w = schemaProfilLowiecki.safeParse(raw);
  if (!w.success) return null;
  return w.data;
}

export function profilLowieckiZFormularza(fd: FormData): ProfilLowieckiJson {
  const pole = (k: string) => {
    const t = String(fd.get(k) ?? "").trim();
    return t.length ? t : null;
  };
  return {
    wersja: 1,
    prezes: pole("mysliwi_prezes"),
    lowczy: pole("mysliwi_lowczy"),
    numer_kola: pole("mysliwi_numer_kola"),
    obszar_lowiecki: pole("mysliwi_obszar"),
    strona_www: pole("mysliwi_strona_www"),
    facebook: pole("mysliwi_facebook"),
    siedziba_kola: pole("mysliwi_siedziba"),
    zebrania: pole("mysliwi_zebrania"),
    sezon_lowiecki: pole("mysliwi_sezon"),
    zasady_bezpieczenstwa: pole("mysliwi_bezpieczenstwo"),
    wspolpraca_rolnicy: pole("mysliwi_rolnicy"),
    kontakt_dla_mieszkancow: pole("mysliwi_kontakt_info"),
    uwagi: pole("mysliwi_uwagi"),
  };
}

export function czyProfilLowieckiUzupelniony(p: ProfilLowieckiJson | null): boolean {
  if (!p) return false;
  return Boolean(
    p.prezes?.trim() ||
      p.lowczy?.trim() ||
      p.obszar_lowiecki?.trim() ||
      p.zasady_bezpieczenstwa?.trim() ||
      p.kontakt_dla_mieszkancow?.trim(),
  );
}

/** Czy organizacja to koło łowieckie (typ lub nazwa). */
export function czyOrganizacjaLowiecka(groupType: string, name: string): boolean {
  if (groupType === "lowiectwo") return true;
  const n = name.toLowerCase();
  return (
    groupType === "kolo" &&
    (n.includes("łow") || n.includes("low") || n.includes("myśliw") || n.includes("mysliw") || n.includes(" hunters"))
  );
}
