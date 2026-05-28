import { z } from "zod";
import { BRYLA_M, STREFY_RZUTU_STUDZIENKI, ZNACZNIKI_RZUTU_STUDZIENKI } from "@/components/wies/studzienki-rzut-dane";

export type PomieszczenieRzutuParteru = {
  id: string;
  lp: string;
  nazwa: string;
  pow_m2: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
};

export const typyElementuArch = ["sciana", "drzwi", "okno", "rampa", "wejscie", "drzwi_wew"] as const;
export type TypElementuArch = (typeof typyElementuArch)[number];

/** Ściana (linia x1,y1→x2,y2) lub znacznik (prostokąt x,y,w,h). */
export type ElementArchRzutu = {
  id: string;
  typ: TypElementuArch;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  etykieta?: string;
  opis?: string;
};

export type TloRzutu = {
  url: string | null;
  opacity: number;
  /** Kalibracja skali: dwa punkty w % i znany dystans w metrach */
  kalibracja: { x1: number; y1: number; x2: number; y2: number; dystans_m: number } | null;
};

export type RzutParteruSaliJson = {
  wersja: 1;
  szablonKlucz: string;
  tytul: string;
  bryla_szer_m: number;
  bryla_gleb_m: number;
  pomieszczenia: PomieszczenieRzutuParteru[];
  notatka?: string | null;
  /** Ściany, drzwi, okna, rampy */
  elementy_arch?: ElementArchRzutu[];
  /** ID pomieszczenia używanego jako sala główna w planie stołów */
  sala_glowna_id?: string | null;
  /** Tło PNG/JPG z kalibracją */
  tlo?: TloRzutu | null;
  /** Siatka snap w % (np. 2) */
  snap_siatka?: number | null;
};

const schemaPomieszczenie = z.object({
  id: z.string().trim().min(1).max(40),
  lp: z.string().trim().min(1).max(12),
  nazwa: z.string().trim().min(1).max(120),
  pow_m2: z.string().trim().min(1).max(80),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  w: z.number().min(0.5).max(100),
  h: z.number().min(0.5).max(100),
  color: z.string().trim().min(4).max(32),
});

const schemaElementArch = z.object({
  id: z.string().trim().min(1).max(40),
  typ: z.enum(typyElementuArch),
  x1: z.number().min(0).max(100).optional(),
  y1: z.number().min(0).max(100).optional(),
  x2: z.number().min(0).max(100).optional(),
  y2: z.number().min(0).max(100).optional(),
  x: z.number().min(0).max(100).optional(),
  y: z.number().min(0).max(100).optional(),
  w: z.number().min(0.2).max(100).optional(),
  h: z.number().min(0.2).max(100).optional(),
  etykieta: z.string().trim().max(40).optional(),
  opis: z.string().trim().max(200).optional(),
});

const schemaTlo = z.object({
  url: z.string().trim().max(500).nullable(),
  opacity: z.number().min(0.1).max(1).default(0.5),
  kalibracja: z
    .object({
      x1: z.number().min(0).max(100),
      y1: z.number().min(0).max(100),
      x2: z.number().min(0).max(100),
      y2: z.number().min(0).max(100),
      dystans_m: z.number().positive().max(200),
    })
    .nullable()
    .optional(),
});

export const schemaRzutParteruSali = z.object({
  wersja: z.literal(1),
  szablonKlucz: z.string().trim().min(1).max(80),
  tytul: z.string().trim().min(1).max(160),
  bryla_szer_m: z.number().positive().max(200),
  bryla_gleb_m: z.number().positive().max(200),
  pomieszczenia: z.array(schemaPomieszczenie).min(1).max(32),
  notatka: z.string().trim().max(2000).nullable().optional(),
  elementy_arch: z.array(schemaElementArch).max(80).optional(),
  sala_glowna_id: z.string().trim().max(40).nullable().optional(),
  tlo: schemaTlo.nullable().optional(),
  snap_siatka: z.number().min(0.5).max(10).nullable().optional(),
});

export function pustyRzutParteruSali(): RzutParteruSaliJson {
  return {
    wersja: 1,
    szablonKlucz: "pusty",
    tytul: "Brak rzutu",
    bryla_szer_m: 10,
    bryla_gleb_m: 8,
    pomieszczenia: [
      {
        id: "sala",
        lp: "1",
        nazwa: "Sala",
        pow_m2: "—",
        x: 5,
        y: 5,
        w: 90,
        h: 90,
        color: "#dcfce7",
      },
    ],
    notatka: null,
    elementy_arch: [],
    sala_glowna_id: "sala",
    tlo: null,
    snap_siatka: 2,
  };
}

function normalizujRzut(raw: z.infer<typeof schemaRzutParteruSali>): RzutParteruSaliJson {
  return {
    ...raw,
    notatka: raw.notatka ?? null,
    elementy_arch: raw.elementy_arch ?? [],
    sala_glowna_id: raw.sala_glowna_id ?? null,
    tlo: raw.tlo
      ? {
          url: raw.tlo.url ?? null,
          opacity: raw.tlo.opacity ?? 0.5,
          kalibracja: raw.tlo.kalibracja ?? null,
        }
      : null,
    snap_siatka: raw.snap_siatka ?? 2,
  };
}

/** Układ jak w pilocie Studzienki (świetlica L) — współrzędne % z tego samego modelu co interaktywny rzut. */
export function presetRzutuSwietlicaLStudzienki(): RzutParteruSaliJson {
  const pomieszczenia: PomieszczenieRzutuParteru[] = STREFY_RZUTU_STUDZIENKI.map((s) => ({
    id: s.id,
    lp: s.id,
    nazwa: s.nazwa,
    pow_m2: s.powierzchnia,
    x: s.rect.x,
    y: s.rect.y,
    w: s.rect.w,
    h: s.rect.h,
    color: s.kolor,
  }));
  const elementy_arch: ElementArchRzutu[] = ZNACZNIKI_RZUTU_STUDZIENKI.map((z, i) => ({
    id: `zn-${i}`,
    typ: z.typ,
    x: z.rect.x,
    y: z.rect.y,
    w: z.rect.w,
    h: z.rect.h,
    etykieta: z.etykieta,
    opis: z.opis,
  }));
  return {
    wersja: 1,
    szablonKlucz: "swietlica_l_studzienki",
    tytul: "Świetlica — układ L (wzorzec jak Studzienki)",
    bryla_szer_m: BRYLA_M.w,
    bryla_gleb_m: BRYLA_M.h,
    pomieszczenia,
    elementy_arch,
    sala_glowna_id: "1.6",
    notatka:
      "Szablon orientacyjny z projektu pilota (metraże jak w tabeli). W papierach wiążące są dokumenty gminy / wykonawcy — tu szybki start w serwisie.",
    tlo: null,
    snap_siatka: 2,
  };
}

export function presetJednaDuzaSala(): RzutParteruSaliJson {
  return {
    wersja: 1,
    szablonKlucz: "jedna_sala",
    tytul: "Jedna otwarta sala (prostokąt)",
    bryla_szer_m: 14,
    bryla_gleb_m: 9,
    pomieszczenia: [
      {
        id: "sala",
        lp: "1",
        nazwa: "Sala główna",
        pow_m2: "~126 m² (14×9 m — orientacyjnie)",
        x: 4,
        y: 6,
        w: 92,
        h: 88,
        color: "#dbeafe",
      },
    ],
    elementy_arch: [],
    sala_glowna_id: "sala",
    notatka: "Uzupełnij rzeczywiste wymiary w opisie sali lub w dokumentacji obiektu.",
    tlo: null,
    snap_siatka: 2,
  };
}

export function presetSalaPlusZaplecze(): RzutParteruSaliJson {
  return {
    wersja: 1,
    szablonKlucz: "sala_zaplecze",
    tytul: "Sala + zaplecze (prosty podział)",
    bryla_szer_m: 14,
    bryla_gleb_m: 9,
    pomieszczenia: [
      {
        id: "zaplecze",
        lp: "1",
        nazwa: "Zaplecze / kuchnia / magazyn",
        pow_m2: "~45 m²",
        x: 4,
        y: 6,
        w: 32,
        h: 88,
        color: "#ffedd5",
      },
      {
        id: "sala",
        lp: "2",
        nazwa: "Sala",
        pow_m2: "~81 m²",
        x: 38,
        y: 6,
        w: 58,
        h: 88,
        color: "#dcfce7",
      },
    ],
    elementy_arch: [],
    sala_glowna_id: "sala",
    notatka: "Prosty podział 30/70 szerokości — dopasuj nazwy i metraże do swojej budowli.",
    tlo: null,
    snap_siatka: 2,
  };
}

export function klonRzutuParteru(r: RzutParteruSaliJson): RzutParteruSaliJson {
  return structuredClone(r);
}

export function snapDoSiatki(v: number, siatka: number): number {
  if (siatka <= 0) return Math.round(v * 100) / 100;
  return Math.round(v / siatka) * siatka;
}

export function parsujRzutParteruZJsonb(raw: unknown): RzutParteruSaliJson | null {
  if (raw == null || typeof raw !== "object") return null;
  const w = schemaRzutParteruSali.safeParse(raw);
  if (!w.success) return null;
  return normalizujRzut(w.data);
}

export function sprobujSparsowacRzutParteru(
  raw: unknown,
): { ok: true; plan: RzutParteruSaliJson } | { ok: false; blad: string } {
  const w = schemaRzutParteruSali.safeParse(raw);
  if (!w.success) {
    const opis = w.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.length ? i.path.join(".") : "rzut"}: ${i.message}`)
      .join(" · ");
    return { ok: false, blad: opis || "Nie udało się odczytać rzutu parteru." };
  }
  return { ok: true, plan: normalizujRzut(w.data) };
}

export function noweIdArch(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID().slice(0, 8)
    : `a-${Date.now()}`;
}

export function nowePomieszczenie(lp: string): PomieszczenieRzutuParteru {
  return {
    id: `p-${noweIdArch()}`,
    lp,
    nazwa: "Nowe pomieszczenie",
    pow_m2: "—",
    x: 20,
    y: 20,
    w: 25,
    h: 20,
    color: "#e0e7ff",
  };
}
