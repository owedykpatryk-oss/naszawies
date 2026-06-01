import { z } from "zod";
import type { CSSProperties } from "react";
import { MOTYWY_GRAFIKI, znajdzMotyw } from "@/lib/grafika/motywy";
import type { MotywGrafiki } from "@/lib/grafika/typy";

/** Identyfikatory sekcji profilu wsi — kolejność domyślna. */
export const KLUCZE_SEKCJI_WSI = [
  "informacje",
  "rynek",
  "mapa",
  "aktualnosci",
  "pomoc",
  "blog",
  "historia",
  "sport",
  "organizacje",
  "szkola",
  "dotacje",
  "transport",
  "rolnictwo",
  "swietlica",
  "cmentarz",
  "fotokronika",
  "grafika",
] as const;

export type KluczSekcjiWsi = (typeof KLUCZE_SEKCJI_WSI)[number];

export const ETYKIETY_SEKCJI_WSI: Record<KluczSekcjiWsi, string> = {
  informacje: "Informacje dla mieszkańców",
  rynek: "Rynek lokalny",
  mapa: "Mapa wsi",
  aktualnosci: "Aktualności",
  pomoc: "Pomoc sąsiedzka",
  blog: "Blog mieszkańców",
  historia: "Historia wsi",
  sport: "Klub sportowy",
  organizacje: "Organizacje i wydarzenia",
  szkola: "Szkoła i przedszkole",
  dotacje: "Dotacje",
  transport: "Transport",
  rolnictwo: "Rolnictwo",
  swietlica: "Świetlica",
  cmentarz: "Cmentarz",
  fotokronika: "Fotokronika",
  grafika: "Plakaty i grafika",
};

export type HeroCtaWsi = {
  label: string;
  href: string;
  wariant: "primary" | "secondary";
};

export type SkrotWsiPubliczny = {
  label: string;
  href: string;
  emoji: string | null;
  opis: string | null;
};

export type BlokTresciWsiPubliczny = {
  id: string;
  typ: "tekst" | "link" | "obraz";
  tytul: string | null;
  tresc: string | null;
  url: string | null;
  obraz_url: string | null;
};

export type PresetWygladuWsi = "standard" | "parafia_osp" | "turystyczna" | "szkola";

/** Konfiguracja paska nawigacji (zakładki + elementy hero). */
export type PasekNawigacjiWsi = {
  sticky_zakladki: boolean;
  pokaz_skroty: boolean;
  pokaz_hero_cta: boolean;
  pokaz_breadcrumb: boolean;
  /** 0 = wszystkie zakładki widoczne; inaczej reszta w menu „Więcej”. */
  max_zakladek_widocznych: number;
};

export type ZakladkaSekcjiWsiConfig = {
  emoji: string | null;
  /** Własna etykieta zakładki (max 24 zn.). */
  label: string | null;
};

const schemaZakladkaSekcji = z.object({
  emoji: z.string().trim().max(8).nullable().optional(),
  label: z.string().trim().max(24).nullable().optional(),
});

const schemaPasekNawigacji = z
  .object({
    sticky_zakladki: z.boolean().optional(),
    pokaz_skroty: z.boolean().optional(),
    pokaz_hero_cta: z.boolean().optional(),
    pokaz_breadcrumb: z.boolean().optional(),
    max_zakladek_widocznych: z.number().int().min(0).max(20).optional(),
  })
  .optional();

const schemaHeroCta = z.object({
  label: z.string().trim().min(1).max(48),
  href: z.string().trim().min(1).max(500),
  wariant: z.enum(["primary", "secondary"]).optional().default("primary"),
});

const schemaSkrot = z.object({
  label: z.string().trim().min(1).max(40),
  href: z.string().trim().min(1).max(500),
  emoji: z.string().trim().max(8).nullable().optional(),
  opis: z.string().trim().max(80).nullable().optional(),
});

const schemaBlok = z.object({
  id: z.string().trim().min(1).max(64),
  typ: z.enum(["tekst", "link", "obraz"]),
  tytul: z.string().trim().max(120).nullable().optional(),
  tresc: z.string().trim().max(2000).nullable().optional(),
  url: z.string().trim().max(500).nullable().optional(),
  obraz_url: z.string().trim().max(2048).nullable().optional(),
});

const schemaModulow = z.record(z.enum(KLUCZE_SEKCJI_WSI), z.boolean()).optional();

export const schemaUstawieniaWsiJson = z.object({
  wersja: z.literal(1).default(1),
  moduly: schemaModulow,
  kolejnosc_sekcji: z.array(z.enum(KLUCZE_SEKCJI_WSI)).max(32).optional(),
  hero: z
    .object({
      naglowek: z.string().trim().max(120).nullable().optional(),
      podtytul: z.string().trim().max(280).nullable().optional(),
      cta: z.array(schemaHeroCta).max(3).optional(),
    })
    .optional(),
  skroty: z.array(schemaSkrot).max(6).optional(),
  bloki: z.array(schemaBlok).max(8).optional(),
  domyslny_tryb_seniora: z.boolean().optional(),
  /** Po pierwszej konfiguracji przez kreator — ukrywa wizard. */
  konfiguracja_ukonczona: z.boolean().optional(),
  zakladki: z.record(z.enum(KLUCZE_SEKCJI_WSI), schemaZakladkaSekcji).optional(),
  pasek_nawigacji: schemaPasekNawigacji,
});

export type UstawieniaWsiJson = z.infer<typeof schemaUstawieniaWsiJson>;

export type UstawieniaWsiPubliczne = {
  theme_id: string;
  logo_url: string | null;
  motyw: MotywGrafiki;
  moduly: Record<KluczSekcjiWsi, boolean>;
  kolejnosc_sekcji: KluczSekcjiWsi[];
  hero_naglowek: string | null;
  hero_podtytul: string | null;
  hero_cta: HeroCtaWsi[];
  skroty: SkrotWsiPubliczny[];
  bloki: BlokTresciWsiPubliczny[];
  domyslny_tryb_seniora: boolean;
  konfiguracja_ukonczona: boolean;
  zakladki: Partial<Record<KluczSekcjiWsi, ZakladkaSekcjiWsiConfig>>;
  pasek_nawigacji: PasekNawigacjiWsi;
};

export function domyslnyPasekNawigacjiWsi(): PasekNawigacjiWsi {
  return {
    sticky_zakladki: true,
    pokaz_skroty: true,
    pokaz_hero_cta: true,
    pokaz_breadcrumb: true,
    max_zakladek_widocznych: 0,
  };
}

function normalizujPasekNawigacji(raw: UstawieniaWsiJson["pasek_nawigacji"]): PasekNawigacjiWsi {
  const d = domyslnyPasekNawigacjiWsi();
  if (!raw) return d;
  return {
    sticky_zakladki: raw.sticky_zakladki ?? d.sticky_zakladki,
    pokaz_skroty: raw.pokaz_skroty ?? d.pokaz_skroty,
    pokaz_hero_cta: raw.pokaz_hero_cta ?? d.pokaz_hero_cta,
    pokaz_breadcrumb: raw.pokaz_breadcrumb ?? d.pokaz_breadcrumb,
    max_zakladek_widocznych: raw.max_zakladek_widocznych ?? d.max_zakladek_widocznych,
  };
}

function normalizujZakladkiSekcji(
  raw: UstawieniaWsiJson["zakladki"],
): Partial<Record<KluczSekcjiWsi, ZakladkaSekcjiWsiConfig>> {
  const out: Partial<Record<KluczSekcjiWsi, ZakladkaSekcjiWsiConfig>> = {};
  if (!raw) return out;
  for (const k of KLUCZE_SEKCJI_WSI) {
    const z = raw[k];
    if (!z) continue;
    out[k] = {
      emoji: z.emoji?.trim() || null,
      label: z.label?.trim() || null,
    };
  }
  return out;
}

export function domyslneModulyWsi(): Record<KluczSekcjiWsi, boolean> {
  return Object.fromEntries(KLUCZE_SEKCJI_WSI.map((k) => [k, true])) as Record<KluczSekcjiWsi, boolean>;
}

export function domyslnaKolejnoscSekcji(): KluczSekcjiWsi[] {
  return [...KLUCZE_SEKCJI_WSI];
}

export function parsujUstawieniaWsiJson(raw: unknown): UstawieniaWsiJson {
  const w = schemaUstawieniaWsiJson.safeParse(raw ?? {});
  if (!w.success) return { wersja: 1 };
  return w.data;
}

function normalizujSkroty(raw: UstawieniaWsiJson["skroty"]): SkrotWsiPubliczny[] {
  return (raw ?? []).map((s) => ({
    label: s.label,
    href: s.href,
    emoji: s.emoji?.trim() || null,
    opis: s.opis?.trim() || null,
  }));
}

function normalizujBloki(raw: UstawieniaWsiJson["bloki"]): BlokTresciWsiPubliczny[] {
  return (raw ?? [])
    .filter((b) => {
      if (b.typ === "tekst") return Boolean(b.tytul?.trim() || b.tresc?.trim());
      if (b.typ === "link") return Boolean(b.url?.trim());
      if (b.typ === "obraz") return Boolean(b.obraz_url?.trim());
      return false;
    })
    .map((b) => ({
      id: b.id,
      typ: b.typ,
      tytul: b.tytul?.trim() || null,
      tresc: b.tresc?.trim() || null,
      url: b.url?.trim() || null,
      obraz_url: b.obraz_url?.trim() || null,
    }));
}

function normalizujHeroCta(raw: UstawieniaWsiJson["hero"]): HeroCtaWsi[] {
  return (raw?.cta ?? []).map((c) => ({
    label: c.label,
    href: c.href,
    wariant: c.wariant ?? "primary",
  }));
}

/** Skróty domyślne gdy sołtys nie skonfigurował własnych. */
export function domyslneSkrotyProfilu(
  sciezka: string,
  moduly: Record<KluczSekcjiWsi, boolean>,
  ctx: { maRynek: boolean; maPlanCmentarza: boolean; maSzkola?: boolean; maSport?: boolean },
): SkrotWsiPubliczny[] {
  const out: SkrotWsiPubliczny[] = [];
  if (moduly.rynek !== false && ctx.maRynek) {
    out.push({ label: "Rynek", href: "#sekcja-rynek-lokalny", emoji: "🛒", opis: null });
  }
  if (moduly.szkola !== false && ctx.maSzkola) {
    out.push({ label: "Szkoła", href: "#sekcja-szkola", emoji: "🏫", opis: "Tablica" });
  }
  if (moduly.sport !== false && ctx.maSport) {
    out.push({ label: "Sport", href: "#sekcja-sport", emoji: "⚽", opis: "Terminarz" });
  }
  if (moduly.mapa !== false) {
    out.push({ label: "Mapa", href: "#sekcja-mapa", emoji: "🗺️", opis: null });
  }
  if (moduly.swietlica !== false) {
    out.push({ label: "Świetlica", href: "#swietlice-wsi", emoji: "🏛️", opis: null });
  }
  if (moduly.cmentarz !== false && ctx.maPlanCmentarza) {
    out.push({ label: "Cmentarz", href: `${sciezka}/cmentarz`, emoji: "🕯️", opis: null });
  }
  out.push({ label: "Dołącz", href: "/rejestracja", emoji: "👋", opis: "Mieszkańcy" });
  return out.slice(0, 6);
}

export function zbudujSkrotyPubliczne(
  skroty: SkrotWsiPubliczny[],
  sciezka: string,
  moduly: Record<KluczSekcjiWsi, boolean>,
  ctx: { maRynek: boolean; maPlanCmentarza: boolean; maSzkola?: boolean; maSport?: boolean },
): SkrotWsiPubliczny[] {
  if (skroty.length > 0) return skroty.slice(0, 6);
  return domyslneSkrotyProfilu(sciezka, moduly, ctx);
}

export function zbudujUstawieniaWsiPubliczne(wiersz: {
  theme_id?: string | null;
  logo_url?: string | null;
  settings?: unknown;
} | null): UstawieniaWsiPubliczne {
  const parsed = parsujUstawieniaWsiJson(wiersz?.settings);
  const themeId = wiersz?.theme_id?.trim() || "zielony-wies";
  const moduly = { ...domyslneModulyWsi(), ...(parsed.moduly ?? {}) };
  let kolejnosc = parsed.kolejnosc_sekcji?.length ? [...parsed.kolejnosc_sekcji] : domyslnaKolejnoscSekcji();
  for (const k of KLUCZE_SEKCJI_WSI) {
    if (!kolejnosc.includes(k)) kolejnosc.push(k);
  }
  kolejnosc = kolejnosc.filter((k, i, a) => a.indexOf(k) === i);

  return {
    theme_id: themeId,
    logo_url: wiersz?.logo_url?.trim() || null,
    motyw: znajdzMotyw(themeId),
    moduly,
    kolejnosc_sekcji: kolejnosc,
    hero_naglowek: parsed.hero?.naglowek?.trim() || null,
    hero_podtytul: parsed.hero?.podtytul?.trim() || null,
    hero_cta: normalizujHeroCta(parsed.hero),
    skroty: normalizujSkroty(parsed.skroty),
    bloki: normalizujBloki(parsed.bloki),
    domyslny_tryb_seniora: parsed.domyslny_tryb_seniora === true,
    konfiguracja_ukonczona: parsed.konfiguracja_ukonczona === true,
    zakladki: normalizujZakladkiSekcji(parsed.zakladki),
    pasek_nawigacji: normalizujPasekNawigacji(parsed.pasek_nawigacji),
  };
}

export function czyWymagaKonfiguracjiWsi(ust: UstawieniaWsiPubliczne): boolean {
  return !ust.konfiguracja_ukonczona;
}

export function czyModulWsiWlaczony(ust: UstawieniaWsiPubliczne, klucz: KluczSekcjiWsi): boolean {
  return ust.moduly[klucz] !== false;
}

export function styleMotywuProfiluWsi(motyw: MotywGrafiki): CSSProperties {
  return {
    ["--wies-akcent" as string]: motyw.akcent,
    ["--wies-akcent2" as string]: motyw.akcent2,
    ["--wies-tlo" as string]: motyw.tlo,
    ["--wies-tekst" as string]: motyw.tekst,
    ["--wies-tekst-muted" as string]: motyw.tekstDrugorzedny,
    ["--wies-ramka" as string]: motyw.ramka,
  };
}

export function presetWygladuWsi(preset: PresetWygladuWsi): {
  moduly: Partial<Record<KluczSekcjiWsi, boolean>>;
  theme_id: string;
  skroty: SkrotWsiPubliczny[];
} {
  if (preset === "szkola") {
    return {
      theme_id: "ddk-gops-niebieski",
      moduly: { szkola: true, rolnictwo: false, dotacje: false },
      skroty: [
        { label: "Tablica", href: "#sekcja-szkola", emoji: "📋", opis: "Ogłoszenia" },
        { label: "Szkoła", href: "#sekcja-szkola", emoji: "🏫", opis: "Kontakt" },
        { label: "Mapa", href: "#sekcja-mapa", emoji: "🗺️", opis: null },
        { label: "Dołącz", href: "/rejestracja", emoji: "👋", opis: "Rodzice" },
      ],
    };
  }
  if (preset === "parafia_osp") {
    return {
      theme_id: "parafia-granat",
      moduly: { rolnictwo: false, dotacje: false },
      skroty: [
        { label: "Parafia", href: "#sekcja-organizacje", emoji: "⛪", opis: null },
        { label: "OSP", href: "#sekcja-organizacje", emoji: "🚒", opis: null },
        { label: "Szkoła", href: "#sekcja-szkola", emoji: "🏫", opis: "Tablica" },
        { label: "Świetlica", href: "#swietlice-wsi", emoji: "🏛️", opis: null },
      ],
    };
  }
  if (preset === "turystyczna") {
    return {
      theme_id: "turkusowy-letni",
      moduly: { rolnictwo: false, dotacje: false, pomoc: false },
      skroty: [
        { label: "Mapa", href: "#sekcja-mapa", emoji: "🗺️", opis: "Miejsca" },
        { label: "Atrakcje", href: "#sekcja-organizacje", emoji: "📍", opis: null },
        { label: "Rynek", href: "#sekcja-rynek-lokalny", emoji: "🛒", opis: "Lokalnie" },
        { label: "Foto", href: "#fotokronika-wsi", emoji: "📷", opis: null },
      ],
    };
  }
  return {
    theme_id: "zielony-wies",
    moduly: {},
    skroty: [
      { label: "Rynek", href: "#sekcja-rynek-lokalny", emoji: "🛒", opis: null },
      { label: "Mapa", href: "#sekcja-mapa", emoji: "🗺️", opis: null },
      { label: "Aktualności", href: "#sekcja-aktualnosci-laczone", emoji: "📢", opis: null },
      { label: "Dołącz", href: "/rejestracja", emoji: "👋", opis: "Mieszkańcy" },
    ],
  };
}

export { MOTYWY_GRAFIKI };
