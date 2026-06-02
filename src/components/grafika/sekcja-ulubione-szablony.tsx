"use client";

import { useCallback, useEffect, useState } from "react";
import { MiniaturaSzablonuGrafiki } from "@/components/grafika/podglad-szablonu-grafiki";
import { PrzyciskUlubionySzablon } from "@/components/grafika/przycisk-ulubiony-szablon";
import { znajdzMotyw } from "@/lib/grafika/motywy";
import { wczytajUlubioneSzablony } from "@/lib/grafika/ulubione-szablony";
import { domyslneWartosciPol, znajdzSzablon } from "@/lib/grafika/szablony";
import type { KontekstGrafiki } from "@/lib/grafika/typy";

type Props = {
  kontekst: KontekstGrafiki;
  onWybor: (w: {
    szablonId: string;
    motywId: string;
    wartosci: Record<string, string>;
    tytulProjektu: string;
    komunikat: string;
  }) => void;
};

export function SekcjaUlubioneSzablony({ kontekst, onWybor }: Props) {
  const [ids, ustawIds] = useState<string[]>([]);

  const odswiez = useCallback(() => {
    ustawIds(wczytajUlubioneSzablony());
  }, []);

  useEffect(() => {
    odswiez();
  }, [odswiez]);

  if (ids.length === 0) return null;

  return (
    <section className="rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/70 via-white to-yellow-50/30 p-4 shadow-sm sm:p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-amber-900">Ulubione</p>
      <h2 className="font-serif text-lg text-amber-950">Twoje zapisane szablony</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {ids.map((id) => {
          const sz = znajdzSzablon(id);
          if (!sz) return null;
          const motyw = znajdzMotyw(sz.domyslnyMotyw);
          return (
            <div key={id} className="relative overflow-hidden rounded-xl border border-amber-200/80 bg-white shadow-sm">
              <div className="absolute right-1 top-1 z-10">
                <PrzyciskUlubionySzablon szablonId={id} onZmiana={odswiez} className="bg-white/90 shadow-sm" />
              </div>
              <button
                type="button"
                onClick={() =>
                  onWybor({
                    szablonId: id,
                    motywId: sz.domyslnyMotyw,
                    wartosci: domyslneWartosciPol(sz, kontekst),
                    tytulProjektu: sz.tytul,
                    komunikat: `Ulubiony szablon „${sz.tytul}” wczytany.`,
                  })
                }
                className="w-full text-left"
              >
                <div className="border-b border-amber-100 p-1.5">
                  <MiniaturaSzablonuGrafiki szablon={sz} motyw={motyw} />
                </div>
                <p className="line-clamp-2 p-2 text-[10px] font-medium leading-tight text-stone-800">{sz.tytul}</p>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
