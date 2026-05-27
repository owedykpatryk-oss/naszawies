"use client";

import { MiniaturaSzablonuGrafiki } from "@/components/grafika/podglad-szablonu-grafiki";
import { SekcjaPaczkiWowGrupy } from "@/components/grafika/sekcja-paczki-wow-grupy";
import { znajdzMotyw } from "@/lib/grafika/motywy";
import { PACZKI_SEZONOWE } from "@/lib/grafika/szablony-sezonowe";
import { ETYKIETY_KATEGORII } from "@/lib/grafika/szablony";
import type { KontekstGrafiki, SzablonGrafiki } from "@/lib/grafika/typy";

type Props = {
  kontekst: KontekstGrafiki;
  szablonId: string;
  szablony: SzablonGrafiki[];
  kategoria: string;
  filtr: string;
  onKategoria: (k: string) => void;
  onFiltr: (f: string) => void;
  onWyborSzablon: (id: string) => void;
  onWyborPaczkiWow: (w: {
    szablonId: string;
    motywId: string;
    wartosci: Record<string, string>;
    tytulProjektu: string;
    komunikat: string;
  }) => void;
  onDalej: () => void;
};

export function ZakladkaSzablonGrafiki({
  kontekst,
  szablonId,
  szablony,
  kategoria,
  filtr,
  onKategoria,
  onFiltr,
  onWyborSzablon,
  onWyborPaczkiWow,
  onDalej,
}: Props) {
  const kategorie = Array.from(new Set(szablony.map((s) => s.kategoria)));

  return (
    <section className="space-y-4">
      <SekcjaPaczkiWowGrupy kontekst={kontekst} onWybor={onWyborPaczkiWow} />

      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="font-serif text-lg text-green-950">Wybierz szablon</h2>
        <p className="mt-1 text-sm text-stone-600">
          Skróty sezonowe albo pełna lista. Po wyborze przejdziesz do zakładki „Treść i wygląd”.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {PACZKI_SEZONOWE.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onWyborSzablon(p.szablonId)}
              className="rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2 text-left text-sm hover:border-green-700"
            >
              <span className="mr-1">{p.emoji}</span>
              <span className="font-medium">{p.nazwa}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onKategoria("wszystkie")}
            className={`rounded-full px-3 py-1 text-xs ${
              kategoria === "wszystkie" ? "bg-green-800 text-white" : "bg-stone-100 text-stone-700"
            }`}
          >
            Wszystkie
          </button>
          {kategorie.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => onKategoria(k)}
              className={`rounded-full px-3 py-1 text-xs ${
                kategoria === k ? "bg-green-800 text-white" : "bg-stone-100 text-stone-700"
              }`}
            >
              {ETYKIETY_KATEGORII[k] ?? k}
            </button>
          ))}
        </div>

        <input
          type="search"
          placeholder="Szukaj: wesele, KGW, UA, dyplom…"
          value={filtr}
          onChange={(e) => onFiltr(e.target.value)}
          className="mt-3 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />

        <div className="mt-4 grid max-h-[420px] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
          {szablony.map((s) => {
            const m = znajdzMotyw(s.domyslnyMotyw);
            const aktywny = s.id === szablonId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onWyborSzablon(s.id)}
                className={`rounded-lg border p-1.5 text-left ${
                  aktywny ? "border-green-700 bg-green-50 ring-1 ring-green-700" : "border-stone-200"
                }`}
              >
                <MiniaturaSzablonuGrafiki szablon={s} motyw={m} />
                <p className="mt-1 line-clamp-2 text-[10px] font-medium leading-tight text-stone-800">{s.tytul}</p>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onDalej}
          className="mt-4 w-full rounded-lg bg-green-800 py-2.5 text-sm font-medium text-white sm:w-auto sm:px-6"
        >
          Dalej — edytuj treść →
        </button>
      </div>
    </section>
  );
}
