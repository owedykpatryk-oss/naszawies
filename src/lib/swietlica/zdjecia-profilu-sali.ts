import { z } from "zod";

export const MAX_ZDJEC_PROFILU_SALI = 10;

export const ETYKIETY_ZDJEC_PROFILU_SWIETLICY = [
  "Sala wielofunkcyjna",
  "Kuchnia",
  "Łazienka",
  "Wiatrołap / hol",
  "Plac zabaw",
  "Parking",
  "Budynek z zewnątrz",
  "Zaplecze",
  "Teren wokół budynku",
  "Inne",
] as const;

export type EtykietaZdjeciaProfiluSwietlicy = (typeof ETYKIETY_ZDJEC_PROFILU_SWIETLICY)[number];

export type ZdjecieProfiluSali = {
  id: string;
  url: string;
  etykieta: string;
};

const schemaPojedyncze = z.object({
  id: z.string().uuid(),
  url: z.string().url().max(2048),
  etykieta: z.string().trim().min(1).max(80),
});

const schemaTablica = z.array(schemaPojedyncze).max(MAX_ZDJEC_PROFILU_SALI);

export function parsujZdjeciaProfiluSali(raw: unknown): ZdjecieProfiluSali[] {
  const p = schemaTablica.safeParse(raw);
  if (!p.success) return [];
  return p.data;
}

export function walidujZdjeciaProfiluSali(raw: unknown): ZdjecieProfiluSali[] | null {
  const p = schemaTablica.safeParse(raw);
  return p.success ? p.data : null;
}

export function okladkaZeZdjecProfilu(zdjecia: ZdjecieProfiluSali[]): string | null {
  return zdjecia[0]?.url?.trim() || null;
}
