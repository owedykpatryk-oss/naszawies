"use client";

import { useState, type ReactNode } from "react";

export function SoltysSekcjaZwijana({
  tytul,
  opis,
  domyslnieOtwarta = false,
  dzieci,
}: {
  tytul: string;
  opis?: string;
  domyslnieOtwarta?: boolean;
  dzieci: ReactNode;
}) {
  const [otwarta, ustawOtwarta] = useState(domyslnieOtwarta);

  return (
    <section className="soltys-sekcja mt-8">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 text-left"
        onClick={() => ustawOtwarta((v) => !v)}
        aria-expanded={otwarta}
      >
        <span>
          <h2 className="font-serif text-lg text-green-950">{tytul}</h2>
          {opis ? <p className="mt-1 text-xs text-stone-600">{opis}</p> : null}
        </span>
        <span className="shrink-0 rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 text-xs text-stone-600">
          {otwarta ? "Zwiń" : "Rozwiń"}
        </span>
      </button>
      {otwarta ? <div className="mt-4">{dzieci}</div> : null}
    </section>
  );
}
