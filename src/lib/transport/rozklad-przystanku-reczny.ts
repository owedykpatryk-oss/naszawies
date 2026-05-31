import { z } from "zod";

export const dniRozkladuPrzystanku = ["pn", "wt", "sr", "cz", "pt", "sb", "nd", "robocze", "codziennie"] as const;
export type DzienRozkladuPrzystanku = (typeof dniRozkladuPrzystanku)[number];

const schemaGodzina = z.string().regex(/^([01]?\d|2[0-3]):[0-5]\d$/, "Godzina w formacie HH:MM");

const schemaKurs = z.object({
  id: z.string().trim().min(1).max(40),
  odjazd: schemaGodzina,
  przyjazd: schemaGodzina.optional().nullable(),
  kierunek: z.string().trim().min(1).max(120),
  linia: z.string().trim().max(40).optional().nullable(),
  przez: z.string().trim().max(200).optional().nullable(),
  dni: z.array(z.enum(dniRozkladuPrzystanku)).min(1).max(9),
  uwagi: z.string().trim().max(200).optional().nullable(),
});

export const schemaRozkladPrzystankuReczny = z.object({
  wersja: z.literal(1),
  notatka: z.string().trim().max(1200).optional().nullable(),
  linkPdf: z.string().trim().url().max(2000).optional().nullable(),
  zaktualizowano: z.string().datetime().optional().nullable(),
  kursy: z.array(schemaKurs).max(80),
});

export type KursRozkladuRecznego = z.infer<typeof schemaKurs>;
export type RozkladPrzystankuReczny = z.infer<typeof schemaRozkladPrzystankuReczny>;

export type OdjazdRecznyWyswietlany = {
  id: string;
  czas: string;
  przyjazd: string | null;
  linia: string;
  cel: string;
  przez: string | null;
  opis: string | null;
  zrodlo: "soltys";
  plannedAt: string;
};

const DNI_DO_DOW: Record<DzienRozkladuPrzystanku, number[]> = {
  pn: [1],
  wt: [2],
  sr: [3],
  cz: [4],
  pt: [5],
  sb: [6],
  nd: [0],
  codziennie: [0, 1, 2, 3, 4, 5, 6],
  robocze: [1, 2, 3, 4, 5],
};

const fmt = new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" });

export function parsujRozkladPrzystankuReczny(raw: unknown): RozkladPrzystankuReczny | null {
  const w = schemaRozkladPrzystankuReczny.safeParse(raw);
  return w.success ? w.data : null;
}

function pasujeDzien(dni: DzienRozkladuPrzystanku[], dzienTygodnia: number): boolean {
  for (const d of dni) {
    const lista = DNI_DO_DOW[d];
    if (lista.includes(dzienTygodnia)) return true;
  }
  return false;
}

function dataGodzinaWStrefie(dzienOdniesienia: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(dzienOdniesienia);

  let t = Date.parse(`${ymd}T12:00:00.000Z`);
  for (let i = 0; i < 6; i++) {
    const f = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Warsaw",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(t));
    const [ch, cm] = f.split(":").map(Number);
    const deltaMin = (h - ch) * 60 + (m - cm);
    if (deltaMin === 0) return new Date(t);
    t += deltaMin * 60 * 1000;
  }
  return new Date(t);
}

/** Najbliższe kursy z ręcznego rozkładu (48 h do przodu). */
export function najblizszeOdjazdyReczne(
  rozklad: RozkladPrzystankuReczny | null,
  opcje?: { limit?: number; od?: Date },
): OdjazdRecznyWyswietlany[] {
  if (!rozklad?.kursy.length) return [];
  const limit = opcje?.limit ?? 12;
  const od = opcje?.od ?? new Date();
  const wynik: OdjazdRecznyWyswietlany[] = [];

  for (let offsetDni = 0; offsetDni < 3; offsetDni++) {
    const dzien = new Date(od.getTime() + offsetDni * 86400000);
    const dow = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "Europe/Warsaw" })
      .formatToParts(dzien)
      .find((p) => p.type === "weekday")?.value;
    const mapDow: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const dzienTygodnia = mapDow[dow ?? "Mon"] ?? 1;

    for (const k of rozklad.kursy) {
      if (!pasujeDzien(k.dni, dzienTygodnia)) continue;
      const when = dataGodzinaWStrefie(dzien, k.odjazd);
      if (when.getTime() < od.getTime() - 5 * 60 * 1000) continue;

      const linia = k.linia?.trim() || "Autobus";
      const opisParts = [
        k.przyjazd ? `przyjazd ${k.przyjazd}` : null,
        k.przez ? `przez ${k.przez}` : null,
        k.uwagi ?? null,
      ].filter(Boolean);

      wynik.push({
        id: `${k.id}-${when.toISOString()}`,
        czas: fmt.format(when),
        przyjazd: k.przyjazd ?? null,
        linia,
        cel: k.kierunek,
        przez: k.przez ?? null,
        opis: opisParts.length ? opisParts.join(" · ") : null,
        zrodlo: "soltys",
        plannedAt: when.toISOString(),
      });
    }
  }

  wynik.sort((a, b) => a.plannedAt.localeCompare(b.plannedAt));
  return wynik.slice(0, limit);
}

export function maRecznyRozklad(rozklad: RozkladPrzystankuReczny | null): boolean {
  if (!rozklad) return false;
  return rozklad.kursy.length > 0 || Boolean(rozklad.notatka?.trim()) || Boolean(rozklad.linkPdf?.trim());
}

export function nowyKursRozkladu(): KursRozkladuRecznego {
  return {
    id: crypto.randomUUID(),
    odjazd: "07:00",
    przyjazd: null,
    kierunek: "",
    linia: null,
    przez: null,
    dni: ["robocze"],
    uwagi: null,
  };
}
