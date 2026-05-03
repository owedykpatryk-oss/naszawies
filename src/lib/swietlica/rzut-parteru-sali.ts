import { z } from "zod";
import { BRYLA_M, STREFY_RZUTU_STUDZIENKI } from "@/components/wies/studzienki-rzut-dane";

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

export type RzutParteruSaliJson = {
  wersja: 1;
  szablonKlucz: string;
  tytul: string;
  bryla_szer_m: number;
  bryla_gleb_m: number;
  pomieszczenia: PomieszczenieRzutuParteru[];
  notatka?: string | null;
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

export const schemaRzutParteruSali = z.object({
  wersja: z.literal(1),
  szablonKlucz: z.string().trim().min(1).max(80),
  tytul: z.string().trim().min(1).max(160),
  bryla_szer_m: z.number().positive().max(200),
  bryla_gleb_m: z.number().positive().max(200),
  pomieszczenia: z.array(schemaPomieszczenie).min(1).max(32),
  notatka: z.string().trim().max(2000).nullable().optional(),
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
  return {
    wersja: 1,
    szablonKlucz: "swietlica_l_studzienki",
    tytul: "Świetlica — układ L (wzorzec jak Studzienki)",
    bryla_szer_m: BRYLA_M.w,
    bryla_gleb_m: BRYLA_M.h,
    pomieszczenia,
    notatka:
      "Szablon orientacyjny z projektu pilota (metraże jak w tabeli). W papierach wiążące są dokumenty gminy / wykonawcy — tu szybki start w serwisie.",
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
    notatka: "Uzupełnij rzeczywiste wymiary w opisie sali lub w dokumentacji obiektu.",
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
    notatka: "Prosty podział 30/70 szerokości — dopasuj nazwy i metraże do swojej budowli.",
  };
}

export function parsujRzutParteruZJsonb(raw: unknown): RzutParteruSaliJson | null {
  if (raw == null || typeof raw !== "object") return null;
  const w = schemaRzutParteruSali.safeParse(raw);
  if (!w.success) return null;
  return w.data as RzutParteruSaliJson;
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
  return { ok: true, plan: w.data as RzutParteruSaliJson };
}
