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
  "organizacje",
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
  blog: "Blog i historia",
  organizacje: "Organizacje i wydarzenia",
  dotacje: "Dotacje",
  transport: "Transport",
  rolnictwo: "Rolnictwo",
  swietlica: "Świetlica",
  cmentarz: "Cmentarz",
  fotokronika: "Fotokronika",
  grafika: "Plakaty i grafika",
};

const schemaModulow = z.record(z.enum(KLUCZE_SEKCJI_WSI), z.boolean()).optional();

export const schemaUstawieniaWsiJson = z.object({
  wersja: z.literal(1).default(1),
  moduly: schemaModulow,
  kolejnosc_sekcji: z.array(z.enum(KLUCZE_SEKCJI_WSI)).max(32).optional(),
  hero: z
    .object({
      podtytul: z.string().trim().max(280).nullable().optional(),
    })
    .optional(),
});

export type UstawieniaWsiJson = z.infer<typeof schemaUstawieniaWsiJson>;

export type UstawieniaWsiPubliczne = {
  theme_id: string;
  logo_url: string | null;
  motyw: MotywGrafiki;
  moduly: Record<KluczSekcjiWsi, boolean>;
  kolejnosc_sekcji: KluczSekcjiWsi[];
  hero_podtytul: string | null;
};

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
    hero_podtytul: parsed.hero?.podtytul?.trim() || null,
  };
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

export { MOTYWY_GRAFIKI };
