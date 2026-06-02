"use client";

import { useMemo, useState } from "react";
import { MiniaturaSzablonuGrafiki } from "@/components/grafika/podglad-szablonu-grafiki";
import type { KontekstGrafiki } from "@/lib/grafika/typy";
import { znajdzMotyw } from "@/lib/grafika/motywy";
import { PACZKI_WOW_GRUPY, zbudujZPaczkiWow } from "@/lib/grafika/paczki-wow-grupy";
import { znajdzSzablon } from "@/lib/grafika/szablony";
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
  "dyplomy",
];

export function SekcjaPaczkiWowGrupy({ kontekst, onWybor }: Props) {
  const [grupa, ustawGrupe] = useState<GrupaWiejska>("wszystkie");

  const lista = useMemo(() => {
    if (grupa === "wszystkie") return PACZKI_WOW_GRUPY;
    return PACZKI_WOW_GRUPY.filter((p) => p.grupa === grupa);
  }, [grupa]);

  return (
    <section className="kreator-wow-sekcja relative overflow-hidden rounded-2xl border border-violet-200/90 bg-gradient-to-br from-violet-50/90 via-white to-amber-50/40 p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-violet-800">Efekt WOW</p>
          <h2 className="font-serif text-lg font-semibold text-violet-950">Gotowe scenariusze dla grup wiejskich</h2>
          <p className="mt-1 max-w-xl text-sm text-stone-600">
            Myśliwi, parafia, seniorzy, LZS, zespół ludowy, DDK, sponsorzy — jeden klik i masz wypełniony projekt z
            podglądem. Potem tylko data i PDF.
          </p>
        </div>
        <span className="rounded-full border border-violet-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-violet-900">
          {PACZKI_WOW_GRUPY.length} gotowych startów
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {GRUPY.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => ustawGrupe(g)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              grupa === g ? "bg-violet-800 text-white shadow-sm" : "bg-white/90 text-stone-700 ring-1 ring-stone-200 hover:ring-violet-300"
            }`}
          >
            {ETYKIETY_GRUP[g]}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {lista.map((p) => {
          const szablon = znajdzSzablon(p.szablonId);
          const motyw = znajdzMotyw(p.motywId);
          return (
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
              className="group relative overflow-hidden rounded-xl border border-violet-200/80 bg-white text-left shadow-sm transition hover:border-violet-500 hover:shadow-md hover:shadow-violet-100 active:scale-[0.99]"
            >
              {p.badge ? (
                <span className="absolute right-2 top-2 z-10 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-950">
                  {p.badge}
                </span>
              ) : null}
              {szablon ? (
                <div className="border-b border-violet-100/80 bg-stone-50/80 p-2 transition group-hover:bg-violet-50/50">
                  <MiniaturaSzablonuGrafiki szablon={szablon} motyw={motyw} />
                </div>
              ) : (
                <div className="flex h-24 items-center justify-center border-b border-violet-100/80 bg-stone-50 text-3xl">
                  {p.emoji}
                </div>
              )}
              <div className="p-3">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-stone-900 group-hover:text-violet-900">
                  <span aria-hidden>{p.emoji}</span>
                  {p.nazwa}
                </p>
                <p className="mt-0.5 text-xs text-stone-500">{p.opis}</p>
                <p className="mt-2 text-[11px] font-medium text-violet-700">Kliknij — gotowe w 30 sek →</p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
