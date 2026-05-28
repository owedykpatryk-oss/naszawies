import { z } from "zod";

export const typyElementuPlanu = [
  "stol_prostokatny",
  "stol_okragly",
  "lawka",
  "strefa",
  "inne",
] as const;

export type TypElementuPlanu = (typeof typyElementuPlanu)[number];

export type ElementPlanuSali = {
  id: string;
  typ: TypElementuPlanu;
  /** lewy górny róg, skala 0–100 (szerokość sali) */
  x: number;
  /** skala 0–100 (wysokość sali w planie) */
  y: number;
  szer: number;
  wys: number;
  obrot: number;
  etykieta: string;
  miejsca?: number;
  szer_cm?: number;
  dl_cm?: number;
};

export type PlanSaliJson = {
  wersja: 1;
  szerokosc_sali_m: number | null;
  dlugosc_sali_m: number | null;
  elementy: ElementPlanuSali[];
};

/** Zapisany wariant planu sali (nazwane presety sołtysa). */
export type PresetPlanuSali = {
  id: string;
  nazwa: string;
  plan: PlanSaliJson;
  utworzono_at?: string;
};

export const pustyPlanSali = (): PlanSaliJson => ({
  wersja: 1,
  szerokosc_sali_m: null,
  dlugosc_sali_m: null,
  elementy: [],
});

const schemaElement = z.object({
  id: z.string().uuid(),
  typ: z.enum(typyElementuPlanu),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  szer: z.number().min(0.5).max(80),
  wys: z.number().min(0.5).max(80),
  obrot: z.number().min(0).max(359).optional(),
  etykieta: z.string().trim().max(24),
  miejsca: z.coerce.number().int().min(0).max(500).optional(),
  szer_cm: z.coerce.number().positive().max(1000).optional().nullable(),
  dl_cm: z.coerce.number().positive().max(1000).optional().nullable(),
});

export const schemaPlanSali = z.object({
  wersja: z.literal(1),
  szerokosc_sali_m: z.number().positive().max(200).nullable().optional(),
  dlugosc_sali_m: z.number().positive().max(200).nullable().optional(),
  elementy: z.array(schemaElement).max(120),
});

export type PlanSaliParsed = z.infer<typeof schemaPlanSali>;

function mapZodDoPlanSali(p: z.infer<typeof schemaPlanSali>): PlanSaliJson {
  return {
    wersja: 1,
    szerokosc_sali_m: p.szerokosc_sali_m ?? null,
    dlugosc_sali_m: p.dlugosc_sali_m ?? null,
    elementy: p.elementy.map((e) => ({
      id: e.id,
      typ: e.typ,
      x: e.x,
      y: e.y,
      szer: e.szer,
      wys: e.wys,
      obrot: e.obrot ?? 0,
      etykieta: e.etykieta,
      miejsca: e.miejsca,
      szer_cm: e.szer_cm ?? undefined,
      dl_cm: e.dl_cm ?? undefined,
    })),
  };
}

export function parsujPlanZJsonb(raw: unknown): PlanSaliJson {
  if (raw == null || typeof raw !== "object") {
    return pustyPlanSali();
  }
  const wynik = schemaPlanSali.safeParse(raw);
  if (!wynik.success) {
    return pustyPlanSali();
  }
  return mapZodDoPlanSali(wynik.data);
}

/**
 * Do importu pliku w edytorze: zwraca czytelny błąd zamiast cichego pustego planu.
 */
export function sprobujSparsowacPlanSali(
  raw: unknown
): { ok: true; plan: PlanSaliJson } | { ok: false; blad: string } {
  if (raw == null || typeof raw !== "object") {
    return { ok: false, blad: "Oczekiwany obiekt JSON (plan sali)." };
  }
  const wynik = schemaPlanSali.safeParse(raw);
  if (!wynik.success) {
    const opis = wynik.error.issues
      .slice(0, 6)
      .map((i) => `${i.path.length ? i.path.join(".") : "plan"}: ${i.message}`)
      .join(" · ");
    return { ok: false, blad: opis || "Nie udało się odczytać planu." };
  }
  return { ok: true, plan: mapZodDoPlanSali(wynik.data) };
}

/** Głęboka kopia planu (historia cofania, presety) — nieniszcząca referencji z props. */
export function klonPlanuSali(p: PlanSaliJson): PlanSaliJson {
  return structuredClone(p);
}

export function sumaMiejscWPlanie(plan: PlanSaliJson): number {
  return plan.elementy.reduce((s, e) => s + (e.miejsca ?? 0), 0);
}

const schemaPresetPlanu = z.object({
  id: z.string().uuid(),
  nazwa: z.string().trim().min(1).max(80),
  plan: schemaPlanSali,
  utworzono_at: z.string().optional(),
});

export function parsujPresetyPlanu(raw: unknown): PresetPlanuSali[] {
  if (!Array.isArray(raw)) return [];
  const out: PresetPlanuSali[] = [];
  for (const item of raw) {
    const w = schemaPresetPlanu.safeParse(item);
    if (w.success) out.push(mapZodDoPlanSaliPreset(w.data));
  }
  return out;
}

function mapZodDoPlanSaliPreset(p: z.infer<typeof schemaPresetPlanu>): PresetPlanuSali {
  return {
    id: p.id,
    nazwa: p.nazwa,
    plan: mapZodDoPlanSali(p.plan),
    utworzono_at: p.utworzono_at,
  };
}
