import type { SupabaseClient } from "@supabase/supabase-js";
import { synchronizujCenyGus, type GusSyncSummary } from "@/lib/gus/synchronizuj-ceny-gus-automatycznie";
import { synchronizujGruntyGus, type GruntyGusSummary } from "@/lib/gus/synchronizuj-grunty-gus";
import { synchronizujLudnoscGus, type LudnoscGusSummary } from "@/lib/gus/synchronizuj-ludnosc-gus";
import { synchronizujPsrGus, type PsrGusSummary } from "@/lib/gus/synchronizuj-psr-gus";

export type GusPelnySyncSummary = {
  ceny: GusSyncSummary;
  ludnosc: LudnoscGusSummary;
  psr: PsrGusSummary;
  grunty: GruntyGusSummary;
  bledy: string[];
};

/** Pełna synchronizacja GUS BDL: P2967+P2968, P2462, PSR 2020, P3415. */
export async function synchronizujGusPelny(admin: SupabaseClient): Promise<GusPelnySyncSummary> {
  const ceny = await synchronizujCenyGus(admin);
  const ludnosc = await synchronizujLudnoscGus(admin);
  const psr = await synchronizujPsrGus(admin);
  const grunty = await synchronizujGruntyGus(admin);

  return {
    ceny,
    ludnosc,
    psr,
    grunty,
    bledy: [...ceny.bledy, ...ludnosc.bledy, ...psr.bledy, ...grunty.bledy],
  };
}
