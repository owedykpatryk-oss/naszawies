"use client";

import { useCallback, useState } from "react";
import { bezpiecznaNazwaPlikuPdf, pobierzPdfZElementuHtml } from "@/lib/dokumenty/pobierz-pdf-z-elementu";

type Props = {
  elementId: string;
  nazwaPliku: string;
  className?: string;
};

export function PrzyciskPobierzPdf({ elementId, nazwaPliku, className }: Props) {
  const [laduje, ustawLaduje] = useState(false);
  const [blad, ustawBlad] = useState<string | null>(null);

  const onPobierz = useCallback(async () => {
    ustawBlad(null);
    const el = document.getElementById(elementId);
    if (!el) {
      ustawBlad("Nie znaleziono treści do zapisania.");
      return;
    }
    ustawLaduje(true);
    try {
      const r = await pobierzPdfZElementuHtml(el as HTMLElement, {
        nazwaPliku: bezpiecznaNazwaPlikuPdf(nazwaPliku),
      });
      if (!r.ok) ustawBlad(r.komunikat);
    } finally {
      ustawLaduje(false);
    }
  }, [elementId, nazwaPliku]);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={onPobierz}
        disabled={laduje}
        className="min-h-[48px] w-full touch-manipulation rounded-lg bg-green-800 px-4 py-3 text-base font-medium text-white shadow hover:bg-green-900 disabled:opacity-60 sm:w-auto sm:min-h-[44px] sm:py-2.5 sm:text-sm"
      >
        {laduje ? "Tworzenie PDF…" : "Pobierz PDF"}
      </button>
      {blad ? <p className="mt-2 text-sm text-red-700">{blad}</p> : null}
    </div>
  );
}
