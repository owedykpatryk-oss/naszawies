"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { IdModuluPomocy } from "@/lib/pomoc/przewodniki-modulow";
import { PRZEWODNIKI_MODULOW } from "@/lib/pomoc/przewodniki-modulow";

type Props = {
  modul: IdModuluPomocy;
};

export function PrzewodnikModulu({ modul }: Props) {
  const klucz = `naszawies-przewodnik-modul-${modul}`;
  const dane = PRZEWODNIKI_MODULOW[modul];
  const [otwarty, ustawOtwarty] = useState(true);

  useEffect(() => {
    try {
      if (localStorage.getItem(klucz) === "1") ustawOtwarty(false);
    } catch {
      /* ignore */
    }
  }, [klucz]);

  function ukryj() {
    ustawOtwarty(false);
    try {
      localStorage.setItem(klucz, "1");
    } catch {
      /* ignore */
    }
  }

  function pokaz() {
    ustawOtwarty(true);
    try {
      localStorage.removeItem(klucz);
    } catch {
      /* ignore */
    }
  }

  if (!otwarty) {
    return (
      <button
        type="button"
        onClick={pokaz}
        className="no-print mb-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-900 hover:bg-sky-100"
      >
        Pokaż przewodnik: {dane.tytul}
      </button>
    );
  }

  return (
    <aside
      className="no-print mb-6 rounded-2xl border border-sky-200/80 bg-gradient-to-br from-sky-50/90 via-white to-emerald-50/30 p-4 shadow-sm"
      aria-label={`Przewodnik: ${dane.tytul}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-sky-800">Pierwsze kroki w tym module</p>
          <h2 className="mt-0.5 font-serif text-lg text-green-950">{dane.tytul}</h2>
        </div>
        <button
          type="button"
          onClick={ukryj}
          className="rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs text-stone-600 hover:bg-stone-50"
        >
          Nie pokazuj więcej
        </button>
      </div>
      <ol className="mt-3 space-y-2">
        {dane.kroki.map((k, i) => (
          <li key={k.tytul} className="flex gap-3 rounded-xl border border-white/80 bg-white/70 px-3 py-2.5 text-sm">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-700 text-xs font-bold text-white"
              aria-hidden
            >
              {i + 1}
            </span>
            <div>
              <p className="font-medium text-green-950">{k.tytul}</p>
              <p className="mt-0.5 text-stone-600">{k.opis}</p>
            </div>
          </li>
        ))}
      </ol>
      {dane.linkPelny ? (
        <p className="mt-3 text-xs">
          <Link href={dane.linkPelny.href} className="font-medium text-green-800 underline">
            {dane.linkPelny.label} →
          </Link>
        </p>
      ) : null}
    </aside>
  );
}
