"use client";

import { useEffect, useState } from "react";
import { MiniaturaSzablonuGrafiki } from "@/components/grafika/podglad-szablonu-grafiki";
import { znajdzMotyw } from "@/lib/grafika/motywy";
import { wczytajOstatnieSzablony, type OstatniSzablon } from "@/lib/grafika/ostatnie-szablony";
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

export function SekcjaOstatnieSzablony({ kontekst, onWybor }: Props) {
  const [lista, ustawListe] = useState<OstatniSzablon[]>([]);

  useEffect(() => {
    ustawListe(wczytajOstatnieSzablony());
  }, []);

  if (lista.length === 0) return null;

  return (
    <section className="rounded-2xl border border-sky-200/90 bg-gradient-to-br from-sky-50/80 via-white to-indigo-50/30 p-4 shadow-sm sm:p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-sky-900">Szybki powrót</p>
      <h2 className="font-serif text-lg text-sky-950">Ostatnio używane szablony</h2>
      <p className="mt-1 text-sm text-stone-600">Kontynuuj pracę od miejsca, w którym skończyłeś/aś.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {lista.map((o) => {
          const sz = znajdzSzablon(o.szablonId);
          if (!sz) return null;
          const motyw = znajdzMotyw(o.motywId || sz.domyslnyMotyw);
          return (
            <button
              key={o.szablonId}
              type="button"
              onClick={() =>
                onWybor({
                  szablonId: o.szablonId,
                  motywId: o.motywId || sz.domyslnyMotyw,
                  wartosci: domyslneWartosciPol(sz, kontekst),
                  tytulProjektu: o.tytul || sz.tytul,
                  komunikat: `Wczytano ostatni szablon „${o.tytul || sz.tytul}”.`,
                })
              }
              className="overflow-hidden rounded-xl border border-sky-200/80 bg-white text-left shadow-sm transition hover:border-sky-500 hover:shadow-md active:scale-[0.99]"
            >
              <div className="border-b border-sky-100 p-1.5">
                <MiniaturaSzablonuGrafiki szablon={sz} motyw={motyw} />
              </div>
              <p className="line-clamp-2 p-2 text-[10px] font-medium leading-tight text-stone-800">{o.tytul || sz.tytul}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
