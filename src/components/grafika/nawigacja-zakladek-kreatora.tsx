"use client";

import type { ZakladkaKreatora } from "@/lib/grafika/kreator-zakladki";
import { ZAKLADKI_KREATORA } from "@/lib/grafika/kreator-zakladki";

type Props = {
  aktywna: ZakladkaKreatora;
  onZmiana: (z: ZakladkaKreatora) => void;
  /** Które zakładki są „ukończone” (wizualnie) */
  ukonczone?: Partial<Record<ZakladkaKreatora, boolean>>;
};

export function NawigacjaZakladekKreatora({ aktywna, onZmiana, ukonczone = {} }: Props) {
  return (
    <nav
      className="no-print flex flex-col gap-2 sm:flex-row sm:gap-1"
      aria-label="Zakładki kreatora grafiki"
      role="tablist"
    >
      {ZAKLADKI_KREATORA.map((z, i) => {
        const jestAktywna = aktywna === z.id;
        const done = ukonczone[z.id];
        return (
          <button
            key={z.id}
            type="button"
            role="tab"
            aria-selected={jestAktywna}
            onClick={() => onZmiana(z.id)}
            className={`flex flex-1 items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition sm:px-4 sm:py-3 ${
              jestAktywna
                ? "border-green-700 bg-green-50 shadow-sm ring-2 ring-green-700/20"
                : done
                  ? "border-green-200/80 bg-white hover:border-green-400"
                  : "border-stone-200 bg-white hover:border-stone-300"
            }`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base ${
                jestAktywna ? "bg-green-800 text-white" : "bg-stone-100"
              }`}
              aria-hidden
            >
              {done && !jestAktywna ? "✓" : z.ikona}
            </span>
            <span className="min-w-0">
              <span className="block text-[10px] font-medium uppercase tracking-wide text-stone-500">
                Krok {i + 1}
              </span>
              <span className="block text-sm font-semibold text-stone-900">{z.tytul}</span>
              <span className="hidden text-xs text-stone-500 sm:block">{z.opis}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
