"use client";

import { useState } from "react";
import { ObrazR2 } from "@/components/media/obraz-r2";
import type { ZdjecieProfiluSali } from "@/lib/swietlica/zdjecia-profilu-sali";

type Props = {
  nazwaSali: string;
  zdjecia: ZdjecieProfiluSali[];
  /** Kompaktowy wariant na liście wielu sal */
  wariant?: "pelny" | "kompakt";
};

export function GaleriaProfiluSwietlicyPubliczna({ nazwaSali, zdjecia, wariant = "pelny" }: Props) {
  const [aktywne, ustawAktywne] = useState<number | null>(null);

  if (zdjecia.length === 0) return null;

  const aktywneZdjecie = aktywne != null ? zdjecia[aktywne] : null;

  if (wariant === "kompakt") {
    return (
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {zdjecia.slice(0, 4).map((z, i) => (
          <button
            key={z.id}
            type="button"
            onClick={() => ustawAktywne(i)}
            className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-stone-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-800"
          >
            <ObrazR2 src={z.url} alt={z.etykieta} preset="miniatura" className="h-full w-full object-cover" lazy />
            {i === 0 ? (
              <span className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-0.5 text-[9px] text-white">
                +{zdjecia.length - 1 > 0 ? zdjecia.length - 1 : 0}
              </span>
            ) : null}
          </button>
        ))}
        {zdjecia.length > 4 ? (
          <button
            type="button"
            onClick={() => ustawAktywne(0)}
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-stone-300 bg-stone-50 text-xs font-medium text-stone-700"
          >
            +{zdjecia.length - 4}
          </button>
        ) : null}
        {aktywneZdjecie ? (
          <PodgladLightbox
            zdjecia={zdjecia}
            indeks={aktywne!}
            nazwaSali={nazwaSali}
            onZamknij={() => ustawAktywne(null)}
            onZmien={(i) => ustawAktywne(i)}
          />
        ) : null}
      </div>
    );
  }

  return (
    <section className="mt-4" aria-label={`Galeria zdjęć — ${nazwaSali}`}>
      <h3 className="text-sm font-semibold text-green-950">Zdjęcia budynku</h3>
      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {zdjecia.map((z, i) => (
          <li key={z.id}>
            <button
              type="button"
              onClick={() => ustawAktywne(i)}
              className="group relative block w-full overflow-hidden rounded-xl border border-stone-200 bg-stone-100 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-800"
            >
              <div className="aspect-[4/3]">
                <ObrazR2
                  src={z.url}
                  alt={z.etykieta}
                  preset="karta"
                  className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                />
              </div>
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-6 text-xs font-medium text-white">
                {z.etykieta}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {aktywneZdjecie ? (
        <PodgladLightbox
          zdjecia={zdjecia}
          indeks={aktywne!}
          nazwaSali={nazwaSali}
          onZamknij={() => ustawAktywne(null)}
          onZmien={(i) => ustawAktywne(i)}
        />
      ) : null}
    </section>
  );
}

function PodgladLightbox({
  zdjecia,
  indeks,
  nazwaSali,
  onZamknij,
  onZmien,
}: {
  zdjecia: ZdjecieProfiluSali[];
  indeks: number;
  nazwaSali: string;
  onZamknij: () => void;
  onZmien: (i: number) => void;
}) {
  const z = zdjecia[indeks];
  if (!z) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Podgląd: ${z.etykieta}`}
      onClick={onZamknij}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-stone-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <ObrazR2 src={z.url} alt={z.etykieta} preset="pelny" className="max-h-[75vh] w-full object-contain" lazy={false} />
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-3 text-white">
          <div>
            <p className="text-sm font-medium">{z.etykieta}</p>
            <p className="text-xs text-white/70">
              {nazwaSali} · {indeks + 1} / {zdjecia.length}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={indeks === 0}
              onClick={() => onZmien(indeks - 1)}
              className="rounded-lg border border-white/30 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              ←
            </button>
            <button
              type="button"
              disabled={indeks >= zdjecia.length - 1}
              onClick={() => onZmien(indeks + 1)}
              className="rounded-lg border border-white/30 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              →
            </button>
            <button
              type="button"
              onClick={onZamknij}
              className="rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium hover:bg-white/25"
            >
              Zamknij
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
