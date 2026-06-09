import { z } from "zod";

export const MAX_ZDJEC_GALERII_POI = 12;

export const ETYKIETY_ZDJEC_PROFILU_POI = [
  "Budynek z zewnątrz",
  "Wnętrze",
  "Detal / zabytek",
  "Zdjęcie archiwalne",
  "Okolica",
  "Wydarzenie",
  "Inne",
] as const;

export type ZdjecieProfiluPoi = {
  id: string;
  url: string;
  etykieta: string;
};

const schemaPojedyncze = z.object({
  id: z.string().uuid(),
  url: z.string().url().max(2048),
  etykieta: z.string().trim().min(1).max(80),
});

const schemaTablica = z.array(schemaPojedyncze).max(MAX_ZDJEC_GALERII_POI);

export function parsujZdjeciaProfiluPoi(raw: unknown): ZdjecieProfiluPoi[] {
  const p = schemaTablica.safeParse(raw);
  if (!p.success) return [];
  return p.data;
}

export function walidujZdjeciaProfiluPoi(raw: unknown): ZdjecieProfiluPoi[] | null {
  const p = schemaTablica.safeParse(raw);
  return p.success ? p.data : null;
}
