"use client";

import { MiniaturaSzablonuGrafiki } from "@/components/grafika/podglad-szablonu-grafiki";
import { znajdzMotyw } from "@/lib/grafika/motywy";
import { podobneSzablony } from "@/lib/grafika/powiazane-szablony";
import { domyslneWartosciPol } from "@/lib/grafika/szablony";
import type { KontekstGrafiki, SzablonGrafiki } from "@/lib/grafika/typy";

type Props = {
  biezacy: SzablonGrafiki;
  wszystkie: SzablonGrafiki[];
  kontekst: KontekstGrafiki;
  onWybor: (id: string) => void;
};

export function SekcjaPodobneSzablony({ biezacy, wszystkie, kontekst, onWybor }: Props) {
  const podobne = podobneSzablony(biezacy, wszystkie);
  if (podobne.length === 0) return null;

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Podobne szablony</p>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {podobne.map((sz) => {
          const motyw = znajdzMotyw(sz.domyslnyMotyw);
          return (
            <button
              key={sz.id}
              type="button"
              onClick={() => onWybor(sz.id)}
              className="overflow-hidden rounded-lg border border-stone-200 bg-white text-left transition hover:border-green-600 hover:shadow-sm"
              title={domyslneWartosciPol(sz, kontekst) ? sz.tytul : sz.tytul}
            >
              <div className="p-1">
                <MiniaturaSzablonuGrafiki szablon={sz} motyw={motyw} />
              </div>
              <p className="line-clamp-2 px-1.5 pb-1.5 text-[9px] font-medium leading-tight text-stone-700">{sz.tytul}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
