"use client";

import { MiniaturaSzablonuGrafiki } from "@/components/grafika/podglad-szablonu-grafiki";
import { znajdzMotyw } from "@/lib/grafika/motywy";
import { polecaneSezonoweTeraz } from "@/lib/grafika/polecane-sezonowe";
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

export function SekcjaPolecaneMiesiac({ kontekst, onWybor }: Props) {
  const polecane = polecaneSezonoweTeraz();
  const szablony = polecane.ids.map((id) => znajdzSzablon(id)).filter(Boolean);

  if (szablony.length === 0) return null;

  const miesiac = new Date().toLocaleString("pl-PL", { month: "long" });

  return (
    <section className="rounded-2xl border border-teal-200/90 bg-gradient-to-br from-teal-50/80 via-white to-cyan-50/40 p-4 shadow-sm sm:p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-teal-800">
        Polecane w {miesiac}
      </p>
      <h2 className="font-serif text-lg text-teal-950">{polecane.tytul}</h2>
      <p className="mt-1 text-sm text-stone-600">{polecane.opis}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {szablony.map((sz) => {
          if (!sz) return null;
          const motyw = znajdzMotyw(sz.domyslnyMotyw);
          return (
            <button
              key={sz.id}
              type="button"
              onClick={() =>
                onWybor({
                  szablonId: sz.id,
                  motywId: sz.domyslnyMotyw,
                  wartosci: domyslneWartosciPol(sz, kontekst),
                  tytulProjektu: sz.tytul,
                  komunikat: `Polecany szablon na ${miesiac} — uzupełnij datę.`,
                })
              }
              className="overflow-hidden rounded-xl border border-teal-200/80 bg-white text-left shadow-sm transition hover:border-teal-500 hover:shadow-md active:scale-[0.99]"
            >
              <div className="border-b border-teal-100 p-1.5">
                <MiniaturaSzablonuGrafiki szablon={sz} motyw={motyw} />
              </div>
              <p className="line-clamp-2 p-2 text-[10px] font-medium leading-tight text-stone-800">{sz.tytul}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
