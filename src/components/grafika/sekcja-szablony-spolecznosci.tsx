"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { MiniaturaSzablonuGrafiki } from "@/components/grafika/podglad-szablonu-grafiki";
import { wczytajSzablonySpolecznosci } from "@/app/(site)/panel/grafika/akcje";
import { znajdzMotyw } from "@/lib/grafika/motywy";
import { znajdzSzablon } from "@/lib/grafika/szablony";
import type { SzablonSpolecznosciGrafiki } from "@/lib/grafika/typy";

type Props = {
  onUzyj: (s: SzablonSpolecznosciGrafiki) => void;
  odswiezKlucz?: number;
};

export function SekcjaSzablonySpolecznosci({ onUzyj, odswiezKlucz }: Props) {
  const [lista, ustawListe] = useState<SzablonSpolecznosciGrafiki[]>([]);
  const [blad, ustawBlad] = useState<string | null>(null);
  const [oczekuje, startTransition] = useTransition();

  const wczytaj = useCallback(() => {
    startTransition(async () => {
      const r = await wczytajSzablonySpolecznosci();
      if ("blad" in r) {
        ustawBlad(r.blad);
        return;
      }
      ustawListe(r.szablony);
      ustawBlad(null);
    });
  }, []);

  useEffect(() => {
    wczytaj();
  }, [wczytaj, odswiezKlucz]);

  if (!oczekuje && lista.length === 0 && !blad) return null;

  return (
    <div className="rounded-2xl border border-sky-200/90 bg-gradient-to-br from-sky-50/80 via-white to-indigo-50/30 p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-sky-900">Społeczność</p>
          <h2 className="font-serif text-lg text-sky-950">Publiczne szablony od innych wsi</h2>
          <p className="mt-1 text-sm text-stone-600">
            Gotowe projekty udostępnione przez sołtysów i mieszkańców — użyj jako punkt wyjścia.
          </p>
        </div>
        <button
          type="button"
          onClick={wczytaj}
          disabled={oczekuje}
          className="rounded-lg border border-sky-300 bg-white px-3 py-1.5 text-xs font-medium text-sky-900 hover:bg-sky-50 disabled:opacity-60"
        >
          {oczekuje ? "Ładuję…" : "Odśwież"}
        </button>
      </div>

      {blad ? <p className="mt-2 text-xs text-red-700">{blad}</p> : null}

      {lista.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((s) => {
            const sz = znajdzSzablon(s.templateId);
            const motyw = znajdzMotyw(s.motywId);
            if (!sz) return null;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onUzyj(s)}
                className="group overflow-hidden rounded-xl border border-sky-200/80 bg-white text-left shadow-sm transition hover:border-sky-500 hover:shadow-md active:scale-[0.99]"
              >
                <div className="border-b border-sky-100 p-1.5 bg-stone-50/80 group-hover:bg-sky-50/40">
                  <MiniaturaSzablonuGrafiki szablon={sz} motyw={motyw} />
                </div>
                <div className="p-2.5">
                  <p className="text-sm font-semibold text-stone-900 group-hover:text-sky-950">{s.tytul}</p>
                  {s.villageName ? (
                    <p className="mt-0.5 text-[11px] text-stone-500">Wsi: {s.villageName}</p>
                  ) : null}
                  {s.opis ? <p className="mt-1 line-clamp-2 text-xs text-stone-600">{s.opis}</p> : null}
                  <p className="mt-1.5 text-[10px] font-semibold uppercase text-sky-700">Użyj szablonu →</p>
                </div>
              </button>
            );
          })}
        </div>
      ) : oczekuje ? (
        <p className="mt-3 text-sm text-stone-500">Ładowanie publicznych szablonów…</p>
      ) : (
        <p className="mt-3 text-sm text-stone-500">
          Jeszcze nikt nie udostępnił szablonu — bądź pierwszy w kroku „Pobierz i udostępnij”.
        </p>
      )}
    </div>
  );
}
