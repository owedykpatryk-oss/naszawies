"use client";

import { useCallback, useEffect, useState } from "react";
import { PodgladSzablonuGrafiki } from "@/components/grafika/podglad-szablonu-grafiki";
import { znajdzMotyw } from "@/lib/grafika/motywy";
import { znajdzSzablon } from "@/lib/grafika/szablony";
import type { PlakatPubliczny } from "@/components/grafika/galeria-plakatow-wsi";

type Props = {
  plakaty: PlakatPubliczny[];
  nazwaSali: string;
  nazwaWsi: string;
  /** Czas wyświetlania jednego slajdu (ms) */
  interwalMs?: number;
};

export function TablicaCyfrowaKlient({
  plakaty,
  nazwaSali,
  nazwaWsi,
  interwalMs = 12_000,
}: Props) {
  const [indeks, ustawIndeks] = useState(0);
  const [pelnyEkran, ustawPelnyEkran] = useState(false);

  const nastepny = useCallback(() => {
    if (plakaty.length === 0) return;
    ustawIndeks((i) => (i + 1) % plakaty.length);
  }, [plakaty.length]);

  useEffect(() => {
    if (plakaty.length <= 1) return;
    const t = window.setInterval(nastepny, interwalMs);
    return () => window.clearInterval(t);
  }, [plakaty.length, interwalMs, nastepny]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") {
        void document.documentElement.requestFullscreen?.().catch(() => undefined);
      }
      if (e.key === "ArrowRight") nastepny();
      if (e.key === "ArrowLeft") {
        ustawIndeks((i) => (i - 1 + plakaty.length) % plakaty.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nastepny, plakaty.length]);

  useEffect(() => {
    const onFs = () => ustawPelnyEkran(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  if (plakaty.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl border border-stone-200 bg-stone-900 p-8 text-center text-stone-200">
        <p className="text-xl font-semibold">{nazwaSali}</p>
        <p className="mt-2 text-sm text-stone-400">
          Brak opublikowanych plakatów na tablicy. Opublikuj grafikę w kreatorze i włącz „Pokaż na tablicy
          świetlicy”.
        </p>
      </div>
    );
  }

  const aktualny = plakaty[indeks];
  const szablon = znajdzSzablon(aktualny.templateId);
  const motyw = znajdzMotyw(aktualny.motywId);

  return (
    <div
      className={`relative overflow-hidden bg-stone-950 text-white ${
        pelnyEkran ? "min-h-screen" : "min-h-[70vh] rounded-2xl border border-stone-800"
      }`}
    >
      <header className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent px-4 py-3 text-sm">
        <div>
          <p className="font-semibold">{nazwaSali}</p>
          <p className="text-xs text-stone-300">{nazwaWsi} · tablica cyfrowa</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
            {indeks + 1} / {plakaty.length}
          </span>
          <button
            type="button"
            onClick={() => void document.documentElement.requestFullscreen?.()}
            className="rounded-lg bg-white/15 px-3 py-1 text-xs hover:bg-white/25"
          >
            Pełny ekran (F)
          </button>
        </div>
      </header>

      <div className="flex min-h-[inherit] items-center justify-center p-6 pt-16">
        {szablon ? (
          <div className="max-h-[85vh] max-w-full overflow-hidden rounded-xl shadow-2xl">
            <PodgladSzablonuGrafiki
              szablon={szablon}
              motyw={motyw}
              wartosci={aktualny.wartosci}
              logoDataUrl={aktualny.logoDataUrl}
              backgroundDataUrl={aktualny.backgroundDataUrl}
              qrDataUrl={aktualny.qrUrl}
              elementId={`tablica-${aktualny.id}`}
            />
          </div>
        ) : null}
      </div>

      <footer className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3 text-center">
        <p className="text-lg font-serif font-semibold">{aktualny.tytul}</p>
      </footer>
    </div>
  );
}
