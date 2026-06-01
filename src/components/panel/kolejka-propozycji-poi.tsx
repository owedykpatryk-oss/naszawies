"use client";

import { useState, useTransition } from "react";
import {
  odrzucPropozycjePoi,
  zatwierdzPropozycjePoi,
} from "@/app/(site)/panel/soltys/akcje-poi-propozycje";
import { etykietaKategoriiPoi } from "@/lib/mapa/kategorie-poi";
import type { PropozycjaPoiDoReview } from "@/lib/mapa/pobierz-propozycje-poi-wsi";

type Props = {
  poczatkowe: PropozycjaPoiDoReview[];
};

export function KolejkaPropozycjiPoi({ poczatkowe }: Props) {
  const [lista, ustawListe] = useState(poczatkowe);
  const [czek, start] = useTransition();
  const [blad, ustawBlad] = useState("");
  const [notatka, ustawNotatka] = useState<Record<string, string>>({});

  if (poczatkowe.length === 0 && lista.length === 0) return null;

  function zatwierdz(id: string) {
    ustawBlad("");
    start(async () => {
      const w = await zatwierdzPropozycjePoi({
        proposalId: id,
        reviewNote: notatka[id]?.trim() || null,
      });
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawListe((prev) => prev.filter((p) => p.id !== id));
    });
  }

  function odrzuc(id: string) {
    ustawBlad("");
    start(async () => {
      const w = await odrzucPropozycjePoi({
        proposalId: id,
        reviewNote: notatka[id]?.trim() || null,
      });
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawListe((prev) => prev.filter((p) => p.id !== id));
    });
  }

  if (lista.length === 0) return null;

  return (
    <section id="propozycje-poi" className="mt-4 scroll-mt-24 rounded-xl border border-violet-200/80 bg-violet-50/40 p-4">
      <h3 className="text-sm font-semibold text-violet-950">
        Propozycje mieszkańców ({lista.length})
      </h3>
      <p className="mt-1 text-xs text-violet-900/90">
        Po zatwierdzeniu punkt trafia na mapę z pełnym zaufaniem (verified).
      </p>
      {blad ? (
        <p className="mt-2 text-sm text-red-800" role="alert">
          {blad}
        </p>
      ) : null}
      <ul className="mt-3 space-y-2">
        {lista.map((p) => (
          <li key={p.id} className="rounded-lg border border-violet-100 bg-white/90 p-3 text-sm">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="font-medium text-stone-900">{p.name}</span>
              <span className="text-xs text-stone-500">{etykietaKategoriiPoi(p.category)}</span>
              <span className="text-[10px] text-stone-400">
                {new Date(p.created_at).toLocaleDateString("pl-PL")}
              </span>
            </div>
            {p.description ? <p className="mt-1 text-xs text-stone-600">{p.description}</p> : null}
            <p className="mt-1 text-[10px] text-stone-400">
              {p.latitude.toFixed(5)}, {p.longitude.toFixed(5)}
            </p>
            <label className="mt-2 block text-xs">
              Notatka (opcj.)
              <input
                type="text"
                value={notatka[p.id] ?? ""}
                onChange={(e) => ustawNotatka((n) => ({ ...n, [p.id]: e.target.value }))}
                maxLength={400}
                className="mt-0.5 block w-full rounded border border-stone-300 px-2 py-1 text-sm"
              />
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={czek}
                onClick={() => zatwierdz(p.id)}
                className="rounded-lg bg-green-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-900 disabled:opacity-60"
              >
                Dodaj na mapę
              </button>
              <button
                type="button"
                disabled={czek}
                onClick={() => odrzuc(p.id)}
                className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-60"
              >
                Odrzuć
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
