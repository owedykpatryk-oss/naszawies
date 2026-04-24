import { z } from "zod";

export const typyElementuPlanu = [
  "stol_prostokatny",
  "stol_okragly",
  "lawka",
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
