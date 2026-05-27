"use client";

import { TRYBY_PRACY, type TrybPracyGrafiki } from "@/lib/grafika/kreator-zakladki";

type Props = {
  tryb: TrybPracyGrafiki;
  onZmiana: (t: TrybPracyGrafiki) => void;
};

export function SelektorTrybuGrafiki({ tryb, onZmiana }: Props) {
  return (
    <section className="no-print">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Co chcesz zrobić?</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {TRYBY_PRACY.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onZmiana(t.id)}
            className={`rounded-xl border px-4 py-3 text-left transition ${
              tryb === t.id
                ? "border-green-700 bg-green-50 shadow-sm ring-2 ring-green-700/25"
                : "border-stone-200 bg-white hover:border-stone-300"
            }`}
          >
            <span className="text-lg" aria-hidden>
              {t.ikona}
            </span>
            <p className="mt-1 text-sm font-semibold text-stone-900">{t.tytul}</p>
            <p className="mt-0.5 text-xs text-stone-600">{t.opis}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
