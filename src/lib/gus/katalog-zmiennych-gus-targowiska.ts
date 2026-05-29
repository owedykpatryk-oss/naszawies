import type { WpisZmiennejGus } from "@/lib/gus/katalog-zmiennych-gus-rolnych";
import { KATALOG_ZMIENNYCH_GUS_ROLNYCH } from "@/lib/gus/katalog-zmiennych-gus-rolnych";

/** P2968 — te same produkty/miesiące co P2967, id zmiennej +256 (BDL). */
const OFFSET_P2968 = 256;

function zbudujKatalogTargowisk(): Record<number, Record<string, WpisZmiennejGus>> {
  const out: Record<number, Record<string, WpisZmiennejGus>> = {};
  for (const [miesiac, produkty] of Object.entries(KATALOG_ZMIENNYCH_GUS_ROLNYCH)) {
    const m = Number(miesiac);
    out[m] = {};
    for (const [klucz, wpis] of Object.entries(produkty)) {
      out[m][klucz] = { id: wpis.id + OFFSET_P2968, unit: wpis.unit };
    }
  }
  return out;
}

export const KATALOG_ZMIENNYCH_GUS_TARGOWISK = zbudujKatalogTargowisk();
