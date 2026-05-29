import { z } from "zod";

export const typyElementuPlanuCmentarza = [
  "kwatera",
  "rzad",
  "grob",
  "sciezka",
  "brama",
  "kaplica",
  "inne",
] as const;

export type TypElementuPlanuCmentarza = (typeof typyElementuPlanuCmentarza)[number];

export type ElementPlanuCmentarza = {
  id: string;
  typ: TypElementuPlanuCmentarza;
  x: number;
  y: number;
  szer: number;
  wys: number;
  obrot: number;
  etykieta: string;
  /** Powiązany rekord grobu (opcjonalnie) */
  grave_record_id?: string | null;
};

export type PlanCmentarzaJson = {
  wersja: 1;
  elementy: ElementPlanuCmentarza[];
};

export const pustyPlanCmentarza = (): PlanCmentarzaJson => ({
  wersja: 1,
  elementy: [],
});

const schemaElement = z.object({
  id: z.string().uuid(),
  typ: z.enum(typyElementuPlanuCmentarza),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(70),
  szer: z.number().min(0.5).max(100),
  wys: z.number().min(0.5).max(70),
  obrot: z.number().min(0).max(359).optional(),
  etykieta: z.string().trim().max(32),
  grave_record_id: z.string().uuid().nullable().optional(),
});

export const schemaPlanCmentarza = z.object({
  wersja: z.literal(1),
  elementy: z.array(schemaElement).max(800),
});

export function parsujPlanCmentarza(raw: unknown): PlanCmentarzaJson {
  if (raw == null || typeof raw !== "object") return pustyPlanCmentarza();
  const w = schemaPlanCmentarza.safeParse(raw);
  if (!w.success) return pustyPlanCmentarza();
  return {
    wersja: 1,
    elementy: w.data.elementy.map((e) => ({
      id: e.id,
      typ: e.typ,
      x: e.x,
      y: e.y,
      szer: e.szer,
      wys: e.wys,
      obrot: e.obrot ?? 0,
      etykieta: e.etykieta,
      grave_record_id: e.grave_record_id ?? null,
    })),
  };
}

export function klonPlanuCmentarza(p: PlanCmentarzaJson): PlanCmentarzaJson {
  return JSON.parse(JSON.stringify(p)) as PlanCmentarzaJson;
}

export function nowyElementCmentarza(typ: TypElementuPlanuCmentarza): ElementPlanuCmentarza {
  const domyslne: Record<TypElementuPlanuCmentarza, Partial<ElementPlanuCmentarza>> = {
    kwatera: { szer: 35, wys: 25, etykieta: "Kwatera I" },
    rzad: { szer: 28, wys: 4, etykieta: "Rząd 1" },
    grob: { szer: 3.5, wys: 6, etykieta: "G1" },
    sciezka: { szer: 40, wys: 3, etykieta: "Aleja" },
    brama: { szer: 6, wys: 4, etykieta: "Brama" },
    kaplica: { szer: 10, wys: 8, etykieta: "Kaplica" },
    inne: { szer: 8, wys: 6, etykieta: "Inne" },
  };
  const d = domyslne[typ];
  return {
    id: crypto.randomUUID(),
    typ,
    x: 10,
    y: 10,
    szer: d.szer ?? 10,
    wys: d.wys ?? 8,
    obrot: 0,
    etykieta: d.etykieta ?? typ,
  };
}

export function etykietaTypuElementuCmentarza(typ: TypElementuPlanuCmentarza): string {
  switch (typ) {
    case "kwatera":
      return "Kwatera";
    case "rzad":
      return "Rząd";
    case "grob":
      return "Grób";
    case "sciezka":
      return "Ścieżka";
    case "brama":
      return "Brama";
    case "kaplica":
      return "Kaplica";
    default:
      return "Inne";
  }
}

/** Szablon startowy: 2 kwatery + rzędy grobów. */
export function szablonPlanuCmentarzaStartowy(): PlanCmentarzaJson {
  const el: ElementPlanuCmentarza[] = [];
  const k1 = nowyElementCmentarza("kwatera");
  k1.x = 8;
  k1.y = 12;
  k1.etykieta = "Kwatera I";
  el.push(k1);
  const k2 = { ...nowyElementCmentarza("kwatera"), id: crypto.randomUUID() };
  k2.x = 52;
  k2.y = 12;
  k2.etykieta = "Kwatera II";
  el.push(k2);
  for (let r = 0; r < 4; r++) {
    const rzad = { ...nowyElementCmentarza("rzad"), id: crypto.randomUUID() };
    rzad.x = 10;
    rzad.y = 18 + r * 8;
    rzad.etykieta = `Rząd ${r + 1}`;
    el.push(rzad);
    for (let g = 0; g < 6; g++) {
      const grob = { ...nowyElementCmentarza("grob"), id: crypto.randomUUID() };
      grob.x = 12 + g * 4.5;
      grob.y = 17 + r * 8;
      grob.etykieta = `${r + 1}/${g + 1}`;
      el.push(grob);
    }
  }
  const brama = nowyElementCmentarza("brama");
  brama.x = 45;
  brama.y = 62;
  brama.etykieta = "Wejście";
  el.push(brama);
  return { wersja: 1, elementy: el };
}
