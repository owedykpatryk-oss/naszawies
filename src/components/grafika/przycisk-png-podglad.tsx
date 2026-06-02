"use client";

import { useCallback, useState } from "react";
import { bezpiecznaNazwaPlikuPngPodglad, pobierzPngPodgladuNatywny } from "@/lib/grafika/eksport-png-podglad";

type Props = {
  elementId: string;
  nazwaPliku: string;
};

export function PrzyciskPngPodglad({ elementId, nazwaPliku }: Props) {
  const [laduje, ustawLaduje] = useState(false);
  const [blad, ustawBlad] = useState<string | null>(null);

  const onPobierz = useCallback(async () => {
    ustawBlad(null);
    const el = document.getElementById(elementId);
    if (!el) {
      ustawBlad("Brak podglądu do eksportu.");
      return;
    }
    ustawLaduje(true);
    try {
      const r = await pobierzPngPodgladuNatywny(el, bezpiecznaNazwaPlikuPngPodglad(nazwaPliku));
      if (!r.ok) ustawBlad(r.komunikat);
    } finally {
      ustawLaduje(false);
    }
  }, [elementId, nazwaPliku]);

  return (
    <div>
      <button
        type="button"
        onClick={() => void onPobierz()}
        disabled={laduje}
        className="min-h-[48px] rounded-lg border border-emerald-700 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-100 disabled:opacity-60"
      >
        {laduje ? "Tworzenie PNG…" : "Pobierz PNG (podgląd)"}
      </button>
      {blad ? <p className="mt-1 text-xs text-red-700">{blad}</p> : null}
    </div>
  );
}
