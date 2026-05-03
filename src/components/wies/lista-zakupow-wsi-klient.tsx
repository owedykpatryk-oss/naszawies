"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  dodajPozycjeListyZakupowWsi,
  przelaczPozycjeListyZakupow,
  usunPozycjeListyZakupowWsi,
  wczytajSzablonListyZakupowWsi,
} from "@/app/(site)/panel/mieszkaniec/akcje";
import { listaKluczySzablonow } from "@/lib/zakupy/szablony-listy-zakupow";

export type PozycjaListyZakupow = {
  id: string;
  title: string;
  note: string | null;
  quantity_text: string | null;
  is_done: boolean;
  created_by: string | null;
};

export function ListaZakupowWsiKlient({
  villageId,
  pozycje,
  edytowalna,
  pokazSzablony = false,
  pokazDruk = false,
}: {
  villageId: string;
  pozycje: PozycjaListyZakupow[];
  edytowalna: boolean;
  /** Szablony KGW / święta — tylko dla zalogowanych z aktywną rolą we wsi. */
  pokazSzablony?: boolean;
  pokazDruk?: boolean;
}) {
  const router = useRouter();
  const [czek, startT] = useTransition();
  const [blad, setBlad] = useState("");
  const [kluczSzablonu, setKluczSzablonu] = useState(listaKluczySzablonow()[0]?.id ?? "");

  function run(run: () => Promise<{ ok?: true; blad?: string }>) {
    setBlad("");
    startT(async () => {
      const w = await run();
      if ("blad" in w && w.blad) {
        setBlad(w.blad);
        return;
      }
      router.refresh();
    });
  }

  function onDodaj(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    run(() =>
      dodajPozycjeListyZakupowWsi({
        villageId,
        title: String(fd.get("title") ?? ""),
        note: String(fd.get("note") ?? "") || null,
        quantity_text: String(fd.get("quantity_text") ?? "") || null,
      }),
    );
    e.currentTarget.reset();
  }

  const szablonyOpcje = listaKluczySzablonow();

  return (
    <div id="lista-zakupow-wsi-print" className="mt-4 space-y-3 print:text-black">
      {blad ? <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-900">{blad}</p> : null}
      {pokazDruk && pozycje.length > 0 ? (
        <div className="no-print flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-800 hover:bg-stone-50"
          >
            Drukuj listę
          </button>
        </div>
      ) : null}
      {pokazSzablony && edytowalna && szablonyOpcje.length > 0 ? (
        <div className="no-print flex flex-col gap-2 rounded-lg border border-amber-200/80 bg-amber-50/40 p-3 sm:flex-row sm:items-end">
          <label className="block flex-1 text-xs font-medium text-stone-800">
            Szablon listy (dopisze pozycje na końcu)
            <select
              className="mt-1 w-full rounded border border-stone-300 bg-white px-2 py-2 text-sm"
              value={kluczSzablonu}
              onChange={(e) => setKluczSzablonu(e.target.value)}
            >
              {szablonyOpcje.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nazwa}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={czek || !kluczSzablonu}
            onClick={() =>
              run(() => wczytajSzablonListyZakupowWsi(villageId, kluczSzablonu))
            }
            className="rounded-lg bg-amber-900 px-3 py-2 text-sm text-white hover:bg-amber-950 disabled:opacity-60"
          >
            Wczytaj szablon
          </button>
        </div>
      ) : null}
      {pozycje.length === 0 ? (
        <p className="text-sm text-stone-500">Lista jest pusta — dodaj pierwszą pozycję (np. mąka 2 kg, śmietana).</p>
      ) : (
        <ul className="space-y-2">
          {pozycje.map((p) => (
            <li
              key={p.id}
              className={`flex flex-wrap items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                p.is_done ? "border-stone-200 bg-stone-50 text-stone-500" : "border-amber-200/80 bg-white"
              }`}
            >
              {edytowalna ? (
                <button
                  type="button"
                  disabled={czek}
                  onClick={() => run(() => przelaczPozycjeListyZakupow(p.id))}
                  className="mt-0.5 shrink-0 rounded border border-stone-300 px-2 py-0.5 text-xs hover:bg-stone-100 disabled:opacity-50"
                  aria-pressed={p.is_done}
                >
                  {p.is_done ? "↩︎" : "✓"}
                </button>
              ) : null}
              <div className="min-w-0 flex-1">
                <span className={p.is_done ? "line-through" : ""}>{p.title}</span>
                {p.quantity_text ? (
                  <span className={`ml-1 text-xs ${p.is_done ? "text-stone-400" : "text-stone-600"}`}>
                    ({p.quantity_text})
                  </span>
                ) : null}
                {p.note ? <p className="mt-0.5 text-xs text-stone-600">{p.note}</p> : null}
              </div>
              {edytowalna ? (
                <button
                  type="button"
                  disabled={czek}
                  onClick={() => run(() => usunPozycjeListyZakupowWsi(p.id))}
                  className="shrink-0 text-xs text-red-700 underline hover:text-red-900 disabled:opacity-50"
                >
                  Usuń
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {edytowalna ? (
        <form onSubmit={onDodaj} className="mt-4 flex flex-col gap-2 border-t border-stone-200 pt-4">
          <p className="text-xs font-medium text-stone-700">Dodaj pozycję (widzą ją wszyscy na profilu wsi)</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <input
              name="title"
              required
              placeholder="Np. cukier"
              className="min-w-[12rem] flex-1 rounded border border-stone-300 px-3 py-2 text-sm"
            />
            <input
              name="quantity_text"
              placeholder="Ilość (np. 1 kg)"
              className="w-full rounded border border-stone-300 px-3 py-2 text-sm sm:w-36"
            />
          </div>
          <input name="note" placeholder="Uwagi (marka, sklep…)" className="rounded border border-stone-300 px-3 py-2 text-sm" />
          <button
            type="submit"
            disabled={czek}
            className="w-fit rounded-lg bg-amber-800 px-4 py-2 text-sm text-white hover:bg-amber-900 disabled:opacity-60"
          >
            Dodaj na listę
          </button>
        </form>
      ) : (
        <p className="text-xs text-stone-500">
          Zaloguj się jako mieszkaniec lub sołtys z aktywną rolą w tej wsi, aby zaznaczać „kupione” i dodawać pozycje —
          także w{" "}
          <a href="/panel/mieszkaniec/lista-zakupow" className="text-green-800 underline">
            panelu mieszkańca
          </a>
          .
        </p>
      )}
    </div>
  );
}
