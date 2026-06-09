"use client";

import { useCallback, useEffect, useState } from "react";

export type SlajdGalerii = {
  url: string;
  opis?: string | null;
};

type Props = {
  slajdy: SlajdGalerii[];
  poczatkowyIndeks?: number;
  zamknij: () => void;
};

export function LightboxGaleriiKlient({ slajdy, poczatkowyIndeks = 0, zamknij }: Props) {
  const [indeks, ustawIndeks] = useState(poczatkowyIndeks);

  const poprzedni = useCallback(() => {
    ustawIndeks((i) => (i > 0 ? i - 1 : slajdy.length - 1));
  }, [slajdy.length]);

  const nastepny = useCallback(() => {
    ustawIndeks((i) => (i < slajdy.length - 1 ? i + 1 : 0));
  }, [slajdy.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") zamknij();
      if (e.key === "ArrowLeft") poprzedni();
      if (e.key === "ArrowRight") nastepny();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [zamknij, poprzedni, nastepny]);

  const slajd = slajdy[indeks];
  if (!slajd) return null;

  return (
    <div
      className="lightbox-galerii fixed inset-0 z-[500] flex items-center justify-center bg-black/88 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Podgląd zdjęcia"
      onClick={zamknij}
    >
      <button
        type="button"
        className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20"
        onClick={zamknij}
        aria-label="Zamknij"
      >
        ×
      </button>

      {slajdy.length > 1 ? (
        <>
          <button
            type="button"
            className="absolute left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/10 px-3 py-4 text-xl text-white transition hover:bg-white/20 sm:block"
            onClick={(e) => {
              e.stopPropagation();
              poprzedni();
            }}
            aria-label="Poprzednie zdjęcie"
          >
            ‹
          </button>
          <button
            type="button"
            className="absolute right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/10 px-3 py-4 text-xl text-white transition hover:bg-white/20 sm:block"
            onClick={(e) => {
              e.stopPropagation();
              nastepny();
            }}
            aria-label="Następne zdjęcie"
          >
            ›
          </button>
        </>
      ) : null}

      <figure
        className="lightbox-galerii__ramka relative max-h-[min(88vh,900px)] max-w-5xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={slajd.url}
          alt={slajd.opis ?? "Zdjęcie z galerii"}
          className="max-h-[min(82vh,860px)] w-auto max-w-full rounded-xl object-contain shadow-2xl"
        />
        {slajd.opis ? (
          <figcaption className="mt-3 text-center text-sm text-white/85">{slajd.opis}</figcaption>
        ) : null}
        {slajdy.length > 1 ? (
          <p className="mt-2 text-center text-xs text-white/55">
            {indeks + 1} / {slajdy.length}
          </p>
        ) : null}
      </figure>
    </div>
  );
}
