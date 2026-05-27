"use client";

import { useMemo, useState } from "react";
import type { KontekstGrafiki } from "@/lib/grafika/typy";
import { PACZKI_WOW_GRUPY, zbudujZPaczkiWow } from "@/lib/grafika/paczki-wow-grupy";
import { ETYKIETY_GRUP, type GrupaWiejska } from "@/lib/grafika/szablony-grupy-wiejskie";

type Props = {
  kontekst: KontekstGrafiki;
  onWybor: (wynik: {
    szablonId: string;
    motywId: string;
    wartosci: Record<string, string>;
    tytulProjektu: string;
    komunikat: string;
  }) => void;
};

const GRUPY: GrupaWiejska[] = [
  "wszystkie",
  "lowiectwo",
  "parafia",
  "seniorzy",
  "sport",
  "zespol",
  "ddk",
  "sponsor",
  "mix",
  "rada",
  "szkola",
];

export function SekcjaPaczkiWowGrupy({ kontekst, onWybor }: Props) {
  const [grupa, ustawGrupe] = useState<GrupaWiejska>("wszystkie");

  const lista = useMemo(() => {
    if (grupa === "wszystkie") return PACZKI_WOW_GRUPY;
    return PACZKI_WOW_GRUPY.filter((p) => p.grupa === grupa);
  }, [grupa]);

  return (
    <section className="rounded-2xl border border-violet-200/90 bg-gradient-to-br from-violet-50/90 via-white to-amber-50/40 p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-violet-800">Efekt WOW</p>
          <h2 className="font-serif text-lg font-semibold text-violet-950">Gotowe scenariusze dla grup wiejskich</h2>
          <p className="mt-1 max-w-xl text-sm text-stone-600">
            Myśliwi, parafia, seniorzy, LZS, zespół ludowy, DDK, sponsorzy — jeden klik i masz wypełniony projekt.
            Potem tylko data i PDF.
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {GRUPY.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => ustawGrupe(g)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              grupa === g ? "bg-violet-800 text-white" : "bg-white/90 text-stone-700 ring-1 ring-stone-200"
            }`}
          >
            {ETYKIETY_GRUP[g]}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {lista.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              const w = zbudujZPaczkiWow(p, kontekst);
              if (!w) return;
              onWybor({
                ...w,
                komunikat: `Scenariusz „${p.nazwa}” gotowy — sprawdź treść w kroku 2.`,
              });
            }}
            className="group relative rounded-xl border border-violet-200/80 bg-white p-3 text-left shadow-sm transition hover:border-violet-500 hover:shadow-md"
          >
            {p.badge ? (
              <span className="absolute right-2 top-2 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-950">
                {p.badge}
              </span>
            ) : null}
            <span className="text-2xl" aria-hidden>
              {p.emoji}
            </span>
            <p className="mt-2 text-sm font-semibold text-stone-900 group-hover:text-violet-900">{p.nazwa}</p>
            <p className="mt-0.5 text-xs text-stone-500">{p.opis}</p>
            <p className="mt-2 text-[11px] font-medium text-violet-700">Kliknij — gotowe w 30 sek →</p>
          </button>
        ))}
      </div>
    </section>
  );
}
