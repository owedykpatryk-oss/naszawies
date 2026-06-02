"use client";

import { PACZKI_HUB_RYNKU } from "@/lib/marketplace/paczki-szybkie-rynek";

export function RynekHubPaczki({
  aktywnaFraza,
  onWybor,
}: {
  aktywnaFraza: string;
  onWybor: (fraza: string) => void;
}) {
  const q = aktywnaFraza.trim().toLowerCase();

  return (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Szukaj po kategorii</p>
      <div className="rynek-paczki-scroll mt-2 -mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex min-w-min gap-2.5" role="list" aria-label="Popularne kategorie na rynku">
          {PACZKI_HUB_RYNKU.map((p) => {
            const aktywna = q === p.fraza.toLowerCase();
            return (
              <button
                key={p.id}
                type="button"
                role="listitem"
                onClick={() => onWybor(aktywna ? "" : p.fraza)}
                aria-pressed={aktywna}
                className={`rynek-paczka-wow group flex w-[7.5rem] shrink-0 flex-col items-center rounded-2xl border px-3 py-3 text-center transition-all duration-200 sm:w-[8rem] ${
                  aktywna
                    ? "border-orange-400 bg-gradient-to-br from-orange-100 to-amber-50 shadow-md ring-2 ring-orange-300/50"
                    : "border-stone-200/90 bg-white hover:border-orange-300 hover:shadow-md"
                }`}
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-2xl shadow-sm ${p.gradient} transition group-hover:scale-110`}
                  aria-hidden
                >
                  {p.emoji}
                </span>
                <span className="mt-2 text-xs font-bold text-green-950">{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
