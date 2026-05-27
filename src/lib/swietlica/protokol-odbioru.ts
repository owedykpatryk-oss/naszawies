import { z } from "zod";

export const STANY_POZYCJI_ODBIORU = ["ok", "brak", "uszkodzone", "nieweryfikowane"] as const;
export type StanPozycjiOdbioru = (typeof STANY_POZYCJI_ODBIORU)[number];

export const ETYKIETY_STANU_POZYCJI: Record<StanPozycjiOdbioru, string> = {
  ok: "OK — komplet",
  brak: "Brakuje",
  uszkodzone: "Uszkodzone",
  nieweryfikowane: "Nie sprawdzono",
};

export const STANY_PORZADKU_SALI = ["ok", "do_sprzatania", "powazny_problem"] as const;
export type StanPorzadkuSali = (typeof STANY_PORZADKU_SALI)[number];

export const DECYZJE_KAUCJI = ["pelny", "czesciowy", "brak", "nie_dotyczy"] as const;
export type DecyzjaKaucji = (typeof DECYZJE_KAUCJI)[number];

export const ETYKIETY_DECYZJI_KAUCJI: Record<DecyzjaKaucji, string> = {
  pelny: "Pełny zwrot kaucji",
  czesciowy: "Częściowy zwrot / potrącenia",
  brak: "Brak zwrotu kaucji",
  nie_dotyczy: "Kaucja nie dotyczy",
};

export type PozycjaProtokoluOdbioru = {
  inventoryId: string;
  nazwa: string;
  zamowiono: number;
  zwrocono: number;
  stan: StanPozycjiOdbioru;
  uwaga?: string | null;
};

export type ProtokolOdbioruSali = {
  wykonanoAt: string;
  wykonanoPrzez: string;
  salaPorzadek: StanPorzadkuSali;
  pozycje: PozycjaProtokoluOdbioru[];
  uwagiOgolne: string | null;
  kaucjaZwrot: DecyzjaKaucji;
  uszkodzeniaPotwierdzone: boolean;
};

const pozycjaSchema = z.object({
  inventoryId: z.string().uuid(),
  nazwa: z.string().min(1).max(200),
  zamowiono: z.number().int().min(0).max(9999),
  zwrocono: z.number().int().min(0).max(9999),
  stan: z.enum(STANY_POZYCJI_ODBIORU),
  uwaga: z.string().max(500).nullable().optional(),
});

export const schemaProtokolOdbioru = z.object({
  bookingId: z.string().uuid(),
  salaPorzadek: z.enum(STANY_PORZADKU_SALI),
  pozycje: z.array(pozycjaSchema).max(80),
  uwagiOgolne: z.string().max(5000).nullable().optional(),
  kaucjaZwrot: z.enum(DECYZJE_KAUCJI),
  uszkodzeniaPotwierdzone: z.boolean(),
});

export function parsujProtokolOdbioru(raw: unknown): ProtokolOdbioruSali | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.wykonanoAt !== "string" || typeof o.wykonanoPrzez !== "string") return null;
  if (!STANY_PORZADKU_SALI.includes(o.salaPorzadek as StanPorzadkuSali)) return null;
  if (!DECYZJE_KAUCJI.includes(o.kaucjaZwrot as DecyzjaKaucji)) return null;
  const pozycjeRaw = Array.isArray(o.pozycje) ? o.pozycje : [];
  const pozycje: PozycjaProtokoluOdbioru[] = [];
  for (const p of pozycjeRaw) {
    const parsed = pozycjaSchema.safeParse(p);
    if (parsed.success) pozycje.push(parsed.data);
  }
  return {
    wykonanoAt: o.wykonanoAt,
    wykonanoPrzez: o.wykonanoPrzez,
    salaPorzadek: o.salaPorzadek as StanPorzadkuSali,
    pozycje,
    uwagiOgolne: typeof o.uwagiOgolne === "string" ? o.uwagiOgolne : null,
    kaucjaZwrot: o.kaucjaZwrot as DecyzjaKaucji,
    uszkodzeniaPotwierdzone: o.uszkodzeniaPotwierdzone === true,
  };
}

export function czyTerminMinnal(endAtIso: string): boolean {
  const koniec = new Date(endAtIso);
  return !Number.isNaN(koniec.getTime()) && koniec.getTime() <= Date.now();
}

export function czyWymagaOdbioru(status: string, endAtIso: string, checkout: unknown): boolean {
  return status === "approved" && czyTerminMinnal(endAtIso) && parsujProtokolOdbioru(checkout) == null;
}
