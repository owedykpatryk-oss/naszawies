"use client";

import { useState, useTransition } from "react";
import {
  ETYKIETY_DOLNEJ_NAWIGACJI,
  type KluczDolnejNawigacji,
  zapiszPreferencjeUiDoLocalStorage,
} from "@/lib/uzytkownik/preferencje-ui";
import { IkonaDolnejNawigacji } from "@/components/marka/ikony-dolnej-nawigacji";
import { zapiszPreferencjeUi } from "./akcje";

const MAX_SLOTOW = 5;
const MIN_SLOTOW = 3;

type Props = {
  zalogowany: boolean;
  poczatkowe: KluczDolnejNawigacji[];
};

const OPCJE_DLA_STANU = (zalogowany: boolean) =>
  (Object.keys(ETYKIETY_DOLNEJ_NAWIGACJI) as KluczDolnejNawigacji[]).filter((k) => {
    const d = ETYKIETY_DOLNEJ_NAWIGACJI[k];
    if (zalogowany && d.tylkoPubliczny) return false;
    if (!zalogowany && d.tylkoZalogowany) return false;
    return true;
  });

export function ProfilPreferencjeNawigacjiKlient({ zalogowany, poczatkowe }: Props) {
  const [wybrane, ustawWybrane] = useState<KluczDolnejNawigacji[]>(poczatkowe.slice(0, MAX_SLOTOW));
  const [blad, ustawBlad] = useState("");
  const [ok, ustawOk] = useState(false);
  const [czek, startT] = useTransition();

  const dostepne = OPCJE_DLA_STANU(zalogowany);

  function przelacz(klucz: KluczDolnejNawigacji) {
    ustawWybrane((prev) => {
      if (prev.includes(klucz)) {
        if (prev.length <= MIN_SLOTOW) return prev;
        return prev.filter((k) => k !== klucz);
      }
      if (prev.length >= MAX_SLOTOW) return prev;
      return [...prev, klucz];
    });
    ustawOk(false);
  }

  function przesun(klucz: KluczDolnejNawigacji, kierunek: -1 | 1) {
    ustawWybrane((prev) => {
      const idx = prev.indexOf(klucz);
      if (idx < 0) return prev;
      const next = idx + kierunek;
      if (next < 0 || next >= prev.length) return prev;
      const kopia = [...prev];
      [kopia[idx], kopia[next]] = [kopia[next], kopia[idx]];
      return kopia;
    });
    ustawOk(false);
  }

  function zapisz() {
    ustawBlad("");
    ustawOk(false);
    startT(async () => {
      const wynik = await zapiszPreferencjeUi({ dolna_nawigacja: wybrane });
      if ("blad" in wynik) {
        ustawBlad(wynik.blad);
        return;
      }
      zapiszPreferencjeUiDoLocalStorage({ dolna_nawigacja: wybrane });
      ustawOk(true);
      window.dispatchEvent(new CustomEvent("naszawies-ui-prefs-changed"));
    });
  }

  return (
    <section className="panel-karta mt-10 max-w-xl">
      <h2 className="font-serif text-xl text-green-950">Mój dolny pasek (telefon)</h2>
      <p className="mt-2 text-sm text-stone-600">
        Wybierz od {MIN_SLOTOW} do {MAX_SLOTOW} skrótów widocznych na dole ekranu w aplikacji. Kolejność ustawiasz
        strzałkami.
      </p>

      <ul className="mt-4 space-y-2">
        {dostepne.map((klucz) => {
          const aktywny = wybrane.includes(klucz);
          const def = ETYKIETY_DOLNEJ_NAWIGACJI[klucz];
          const idx = wybrane.indexOf(klucz);
          return (
            <li
              key={klucz}
              className={`flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                aktywny ? "border-green-300 bg-green-50/80" : "border-stone-200 bg-white"
              }`}
            >
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="accent-green-800"
                  checked={aktywny}
                  disabled={!aktywny && wybrane.length >= MAX_SLOTOW}
                  onChange={() => przelacz(klucz)}
                />
                <span className="inline-flex text-stone-600" aria-hidden>
                  <IkonaDolnejNawigacji klucz={klucz} />
                </span>
                <span className="font-medium">{def.label}</span>
              </label>
              {aktywny ? (
                <span className="flex gap-1">
                  <button
                    type="button"
                    className="rounded border border-stone-300 px-2 py-0.5 text-xs disabled:opacity-40"
                    disabled={idx === 0}
                    onClick={() => przesun(klucz, -1)}
                    aria-label="Wyżej"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="rounded border border-stone-300 px-2 py-0.5 text-xs disabled:opacity-40"
                    disabled={idx === wybrane.length - 1}
                    onClick={() => przesun(klucz, 1)}
                    aria-label="Niżej"
                  >
                    ↓
                  </button>
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>

      <p className="mt-2 text-xs text-stone-500">
        Wybrane ({wybrane.length}/{MAX_SLOTOW}):{" "}
        {wybrane.map((k) => ETYKIETY_DOLNEJ_NAWIGACJI[k].label).join(" · ")}
      </p>

      {blad ? <p className="mt-2 text-sm text-red-700">{blad}</p> : null}
      {ok ? <p className="mt-2 text-sm text-green-800">Zapisano — odśwież widok mobilny, jeśli pasek się nie zmienił.</p> : null}

      <button
        type="button"
        disabled={czek || wybrane.length < MIN_SLOTOW}
        onClick={zapisz}
        className="mt-4 rounded-xl bg-green-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-900 disabled:opacity-60"
      >
        {czek ? "Zapisywanie…" : "Zapisz dolny pasek"}
      </button>
    </section>
  );
}
