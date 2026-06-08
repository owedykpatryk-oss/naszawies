import { z } from "zod";
import { metaOrganizacjiZFormularza, schemaMetaProfiluOrganizacji } from "@/lib/wies/profil-organizacji-meta";

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
  facebook: z.string().trim().max(500).nullable().optional(),
  msze_niedziele: z.string().trim().max(800).nullable().optional(),
  msze_dni_powszednie: z.string().trim().max(800).nullable().optional(),
  spowiedz: z.string().trim().max(500).nullable().optional(),
  kancelaria: z.string().trim().max(500).nullable().optional(),
  sakramenty: z.string().trim().max(1200).nullable().optional(),
  grupy_duszpasterskie: z.string().trim().max(800).nullable().optional(),
  intencje_mszalne: z.string().trim().max(600).nullable().optional(),
  intencje_tygodniowe: z
    .array(
      z.object({
        dzien: z.enum(["nd", "pon", "wt", "sr", "czw", "pt", "sob"]),
        godzina: z.string().trim().max(12),
        intencja: z.string().trim().max(280),
        celebrans: z.string().trim().max(80).nullable().optional(),
      }),
    )
    .max(24)
    .nullable()
    .optional(),
  info_cmentarz: z.string().trim().max(600).nullable().optional(),
  uwagi: z.string().trim().max(800).nullable().optional(),
}).merge(schemaMetaProfiluOrganizacji);

export type ProfilParafiiJson = z.infer<typeof schemaProfilParafii>;

export type IntencjaTygodniowaParafii = NonNullable<ProfilParafiiJson["intencje_tygodniowe"]>[number];

export const ETYKIETY_DNI_INTENCJI: Record<IntencjaTygodniowaParafii["dzien"], string> = {
  nd: "Niedziela",
  pon: "Poniedziałek",
  wt: "Wtorek",
  sr: "Środa",
  czw: "Czwartek",
  pt: "Piątek",
  sob: "Sobota",
};

const schemaIntencjiTygodniowych = z.array(
  z.object({
    dzien: z.enum(["nd", "pon", "wt", "sr", "czw", "pt", "sob"]),
    godzina: z.string().trim().max(12),
    intencja: z.string().trim().max(280),
    celebrans: z.string().trim().max(80).nullable().optional(),
  }),
).max(24);

export function parsujIntencjeTygodnioweZJson(raw: string): ProfilParafiiJson["intencje_tygodniowe"] {
  if (!raw.trim()) return null;
  try {
    const arr = JSON.parse(raw) as unknown;
    const w = schemaIntencjiTygodniowych.safeParse(arr);
    return w.success ? w.data : null;
  } catch {
    return null;
  }
}

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
    facebook: pole("parafia_facebook"),
    msze_niedziele: pole("parafia_msze_niedziele"),
    msze_dni_powszednie: pole("parafia_msze_dni_powszednie"),
    spowiedz: pole("parafia_spowiedz"),
    kancelaria: pole("parafia_kancelaria"),
    sakramenty: pole("parafia_sakramenty"),
    grupy_duszpasterskie: pole("parafia_grupy"),
    intencje_mszalne: pole("parafia_intencje"),
    intencje_tygodniowe: parsujIntencjeTygodnioweZJson(String(fd.get("parafia_intencje_tygodniowe_json") ?? "")),
    info_cmentarz: pole("parafia_info_cmentarz"),
    uwagi: pole("parafia_uwagi"),
    ...metaOrganizacjiZFormularza(fd, "parafia"),
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
  instagram: z.string().trim().max(500).nullable().optional(),
  skladka_czlonkowska: z.string().trim().max(400).nullable().optional(),
  sprzedaz_produkty: z.string().trim().max(600).nullable().optional(),
  uwagi: z.string().trim().max(800).nullable().optional(),
}).merge(schemaMetaProfiluOrganizacji);

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
    instagram: pole("kgw_instagram"),
    skladka_czlonkowska: pole("kgw_skladka"),
    sprzedaz_produkty: pole("kgw_sprzedaz_produkty"),
    uwagi: pole("kgw_uwagi"),
    ...metaOrganizacjiZFormularza(fd, "kgw"),
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
  instagram: z.string().trim().max(500).nullable().optional(),
  siedziba_kola: z.string().trim().max(300).nullable().optional(),
  zebrania: z.string().trim().max(800).nullable().optional(),
  sezon_lowiecki: z.string().trim().max(500).nullable().optional(),
  zasady_bezpieczenstwa: z.string().trim().max(1200).nullable().optional(),
  wspolpraca_rolnicy: z.string().trim().max(800).nullable().optional(),
  kontakt_dla_mieszkancow: z.string().trim().max(800).nullable().optional(),
  zgloszenie_szkod: z.string().trim().max(600).nullable().optional(),
  uwagi: z.string().trim().max(800).nullable().optional(),
  /** Polygon rewiru na mapie katalogu (GeoJSON Polygon / Feature). */
  rewir_geojson: z.unknown().nullable().optional(),
}).merge(schemaMetaProfiluOrganizacji);

export function parsujRewirGeojsonZProfilu(raw: unknown): unknown | null {
  if (raw == null || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const g = r.rewir_geojson;
  if (g == null) return null;
  if (typeof g === "string") {
    const t = g.trim();
    if (!t) return null;
    try {
      return JSON.parse(t) as unknown;
    } catch {
      return null;
    }
  }
  return g;
}

export type ProfilLowieckiJson = z.infer<typeof schemaProfilLowiecki>;

export function parsujProfilLowiecki(raw: unknown): ProfilLowieckiJson | null {
  if (raw == null || typeof raw !== "object") return null;
  const w = schemaProfilLowiecki.safeParse(raw);
  if (!w.success) return null;
  return w.data;
}

function rewirGeojsonZFormularza(fd: FormData): unknown | null {
  const raw = String(fd.get("mysliwi_rewir_geojson") ?? "").trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
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
    instagram: pole("mysliwi_instagram"),
    siedziba_kola: pole("mysliwi_siedziba"),
    zebrania: pole("mysliwi_zebrania"),
    sezon_lowiecki: pole("mysliwi_sezon"),
    zasady_bezpieczenstwa: pole("mysliwi_bezpieczenstwo"),
    wspolpraca_rolnicy: pole("mysliwi_rolnicy"),
    kontakt_dla_mieszkancow: pole("mysliwi_kontakt_info"),
    zgloszenie_szkod: pole("mysliwi_zgloszenie_szkod"),
    uwagi: pole("mysliwi_uwagi"),
    rewir_geojson: rewirGeojsonZFormularza(fd),
    ...metaOrganizacjiZFormularza(fd, "mysliwi"),
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

/** Rozszerzony profil OSP — `village_community_groups.profile_data`. */
export const schemaProfilOsp = z.object({
  wersja: z.literal(1).default(1),
  naczelnik: z.string().trim().max(160).nullable().optional(),
  zastepca_naczelnika: z.string().trim().max(160).nullable().optional(),
  numer_jednostki: z.string().trim().max(80).nullable().optional(),
  siedziba_remizy: z.string().trim().max(300).nullable().optional(),
  strona_www: z.string().trim().max(500).nullable().optional(),
  facebook: z.string().trim().max(500).nullable().optional(),
  instagram: z.string().trim().max(500).nullable().optional(),
  cwiczenia: z.string().trim().max(800).nullable().optional(),
  dyzury: z.string().trim().max(500).nullable().optional(),
  rekrutacja: z.string().trim().max(800).nullable().optional(),
  zasady_bezpieczenstwa: z.string().trim().max(1200).nullable().optional(),
  punkty_wody: z.string().trim().max(600).nullable().optional(),
  wsparcie_finansowe: z.string().trim().max(600).nullable().optional(),
  uwagi: z.string().trim().max(800).nullable().optional(),
}).merge(schemaMetaProfiluOrganizacji);

export type ProfilOspJson = z.infer<typeof schemaProfilOsp>;

export function parsujProfilOsp(raw: unknown): ProfilOspJson | null {
  if (raw == null || typeof raw !== "object") return null;
  const w = schemaProfilOsp.safeParse(raw);
  if (!w.success) return null;
  return w.data;
}

export function profilOspZFormularza(fd: FormData): ProfilOspJson {
  const pole = (k: string) => {
    const t = String(fd.get(k) ?? "").trim();
    return t.length ? t : null;
  };
  return {
    wersja: 1,
    naczelnik: pole("osp_naczelnik"),
    zastepca_naczelnika: pole("osp_zastepca"),
    numer_jednostki: pole("osp_numer_jednostki"),
    siedziba_remizy: pole("osp_siedziba"),
    strona_www: pole("osp_strona_www"),
    facebook: pole("osp_facebook"),
    instagram: pole("osp_instagram"),
    cwiczenia: pole("osp_cwiczenia"),
    dyzury: pole("osp_dyzury"),
    rekrutacja: pole("osp_rekrutacja"),
    zasady_bezpieczenstwa: pole("osp_bezpieczenstwo"),
    punkty_wody: pole("osp_punkty_wody"),
    wsparcie_finansowe: pole("osp_wsparcie"),
    uwagi: pole("osp_uwagi"),
    ...metaOrganizacjiZFormularza(fd, "osp"),
  };
}

export function czyProfilOspUzupelniony(p: ProfilOspJson | null): boolean {
  if (!p) return false;
  return Boolean(
    p.naczelnik?.trim() ||
      p.cwiczenia?.trim() ||
      p.dyzury?.trim() ||
      p.siedziba_remizy?.trim() ||
      p.zasady_bezpieczenstwa?.trim() ||
      p.rekrutacja?.trim(),
  );
}

/** Czy organizacja to OSP (typ lub nazwa). */
export function czyOrganizacjaOsp(groupType: string, name: string): boolean {
  if (groupType === "osp") return true;
  const n = name.toLowerCase();
  return n.includes("osp") || n.includes("straż") || n.includes("straz") || n.includes("fire");
}

/** Profil placówki oświatowej — `village_community_groups.profile_data`. */
export const schemaProfilSzkoly = z.object({
  wersja: z.literal(1).default(1),
  dyrektor: z.string().trim().max(160).nullable().optional(),
  wicedyrektor: z.string().trim().max(160).nullable().optional(),
  adres_szkoly: z.string().trim().max(300).nullable().optional(),
  strona_www: z.string().trim().max(500).nullable().optional(),
  facebook: z.string().trim().max(500).nullable().optional(),
  sekretariat: z.string().trim().max(500).nullable().optional(),
  godziny_przyjec: z.string().trim().max(500).nullable().optional(),
  dyzury_nauczycieli: z.string().trim().max(800).nullable().optional(),
  zajecia_pozalekcyjne: z.string().trim().max(1200).nullable().optional(),
  stołówka: z.string().trim().max(600).nullable().optional(),
  biblioteka_szkolna: z.string().trim().max(600).nullable().optional(),
  uwagi: z.string().trim().max(800).nullable().optional(),
});

export type ProfilSzkolyJson = z.infer<typeof schemaProfilSzkoly>;

export function parsujProfilSzkoly(raw: unknown): ProfilSzkolyJson | null {
  if (raw == null || typeof raw !== "object") return null;
  const w = schemaProfilSzkoly.safeParse(raw);
  if (!w.success) return null;
  return w.data;
}

export function profilSzkolyZFormularza(fd: FormData): ProfilSzkolyJson {
  const pole = (k: string) => {
    const t = String(fd.get(k) ?? "").trim();
    return t.length ? t : null;
  };
  return {
    wersja: 1,
    dyrektor: pole("szkola_dyrektor"),
    wicedyrektor: pole("szkola_wicedyrektor"),
    adres_szkoly: pole("szkola_adres"),
    strona_www: pole("szkola_strona_www"),
    facebook: pole("szkola_facebook"),
    sekretariat: pole("szkola_sekretariat"),
    godziny_przyjec: pole("szkola_godziny_przyjec"),
    dyzury_nauczycieli: pole("szkola_dyzury"),
    zajecia_pozalekcyjne: pole("szkola_zajecia"),
    stołówka: pole("szkola_stolowka"),
    biblioteka_szkolna: pole("szkola_biblioteka"),
    uwagi: pole("szkola_uwagi"),
  };
}

export function czyProfilSzkolyUzupelniony(p: ProfilSzkolyJson | null): boolean {
  if (!p) return false;
  return Boolean(
    p.dyrektor?.trim() ||
      p.sekretariat?.trim() ||
      p.godziny_przyjec?.trim() ||
      p.adres_szkoly?.trim(),
  );
}

/** Profil koła rolników — `village_community_groups.profile_data`. */
export const schemaProfilRolnikow = z.object({
  wersja: z.literal(1).default(1),
  przewodniczacy: z.string().trim().max(160).nullable().optional(),
  zebrania: z.string().trim().max(800).nullable().optional(),
  miejsce_spotkan: z.string().trim().max(300).nullable().optional(),
  dzialalnosc: z.string().trim().max(1200).nullable().optional(),
  wspolpraca_arimr: z.string().trim().max(800).nullable().optional(),
  jak_dolaczyc: z.string().trim().max(800).nullable().optional(),
  uwagi: z.string().trim().max(800).nullable().optional(),
}).merge(schemaMetaProfiluOrganizacji);

export type ProfilRolnikowJson = z.infer<typeof schemaProfilRolnikow>;

export function parsujProfilRolnikow(raw: unknown): ProfilRolnikowJson | null {
  if (raw == null || typeof raw !== "object") return null;
  const w = schemaProfilRolnikow.safeParse(raw);
  if (!w.success) return null;
  return w.data;
}

export function profilRolnikowZFormularza(fd: FormData): ProfilRolnikowJson {
  const pole = (k: string) => {
    const t = String(fd.get(k) ?? "").trim();
    return t.length ? t : null;
  };
  return {
    wersja: 1,
    przewodniczacy: pole("rolnicy_przewodniczacy"),
    zebrania: pole("rolnicy_zebrania"),
    miejsce_spotkan: pole("rolnicy_miejsce"),
    dzialalnosc: pole("rolnicy_dzialalnosc"),
    wspolpraca_arimr: pole("rolnicy_arimr"),
    jak_dolaczyc: pole("rolnicy_jak_dolaczyc"),
    uwagi: pole("rolnicy_uwagi"),
    ...metaOrganizacjiZFormularza(fd, "rolnicy"),
  };
}

export function czyProfilRolnikowUzupelniony(p: ProfilRolnikowJson | null): boolean {
  if (!p) return false;
  return Boolean(
    p.przewodniczacy?.trim() ||
      p.zebrania?.trim() ||
      p.miejsce_spotkan?.trim() ||
      p.dzialalnosc?.trim() ||
      p.jak_dolaczyc?.trim(),
  );
}

export function czyOrganizacjaRolnicy(groupType: string, name: string): boolean {
  if (groupType === "rolnicy") return true;
  const n = name.toLowerCase();
  return n.includes("rolnik") || n.includes("rolnicz") || n.includes("agronom");
}

export { czyOrganizacjaSport } from "@/lib/wies/sport";

export function czyOrganizacjaSzkola(groupType: string, name: string): boolean {
  if (groupType === "szkola") return true;
  const n = name.toLowerCase();
  return n.includes("szkoł") || n.includes("szkol") || n.includes("przedszkol") || n.includes("liceum");
}
