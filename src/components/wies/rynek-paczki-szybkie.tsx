"use client";

import type { AkcjaPaczkiRynek, PaczkaRynek } from "@/lib/marketplace/paczki-szybkie-rynek";
import { PACZKI_SZYBKIE_RYNKU } from "@/lib/marketplace/paczki-szybkie-rynek";

export function czyPaczkaAktywna(
  akcja: AkcjaPaczkiRynek,
  stan: {
    kategoria: string;
    tylkoNieruchomosci: boolean;
    tylkoProduktyLokalne: boolean;
    tylkoZMapaGeoportal: boolean;
    typ: string;
    tylkoZOperatorem: boolean;
  },
): boolean {
  switch (akcja.typ) {
    case "kategoria":
      return stan.kategoria === akcja.value;
    case "nieruchomosci":
      return stan.tylkoNieruchomosci;
    case "lokalne":
      return stan.tylkoProduktyLokalne;
    case "geoportal":
      return stan.tylkoZMapaGeoportal;
    case "oddam":
      return stan.typ === "oddam";
    case "operator":
      return stan.tylkoZOperatorem;
    default:
      return false;
  }
}

export function RynekPaczkiSzybkie({
  paczki = PACZKI_SZYBKIE_RYNKU,
  aktywnaPaczka,
  onWybor,
}: {
  paczki?: PaczkaRynek[];
  aktywnaPaczka?: string | null;
  onWybor: (paczka: PaczkaRynek) => void;
}) {
  return (
    <div className="rynek-paczki-scroll -mx-1 overflow-x-auto px-1 pb-1">
      <div className="flex min-w-min gap-2.5" role="list" aria-label="Szybkie kategorie rynku">
        {paczki.map((p) => {
          const aktywna = aktywnaPaczka === p.id;
          return (
            <button
              key={p.id}
              type="button"
              role="listitem"
              onClick={() => onWybor(p)}
              aria-pressed={aktywna}
              className={`rynek-paczka-wow group flex w-[8.5rem] shrink-0 flex-col rounded-2xl border p-3 text-left transition-all duration-200 sm:w-[9.25rem] ${
                aktywna
                  ? "border-orange-400 bg-gradient-to-br from-orange-100 to-amber-50 shadow-md ring-2 ring-orange-300/50"
                  : "border-stone-200/90 bg-white hover:border-orange-300 hover:shadow-md"
              }`}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-xl shadow-sm ${p.gradient} transition group-hover:scale-105`}
                aria-hidden
              >
                {p.emoji}
              </span>
              <span className="mt-2 text-xs font-bold leading-tight text-green-950">{p.label}</span>
              <span className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-stone-600">{p.opis}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
