"use client";

import { useState, useTransition } from "react";

type Props = {
  liczbaZaznaczonych: number;
  etykietaAkcji?: string;
  onZatwierdz: () => Promise<{ blad?: string; zatwierdzono?: number; pominieto?: number }>;
  onPoSukcesie?: () => void;
  disabled?: boolean;
};

export function PasekMasowychAkcji({
  liczbaZaznaczonych,
  etykietaAkcji = "Zatwierdź zaznaczone",
  onZatwierdz,
  onPoSukcesie,
  disabled = false,
}: Props) {
  const [komunikat, ustawKomunikat] = useState("");
  const [blad, ustawBlad] = useState("");
  const [czek, startT] = useTransition();

  if (liczbaZaznaczonych === 0) return null;

  return (
    <div className="sticky bottom-2 z-10 flex flex-wrap items-center gap-2 rounded-xl border border-green-200 bg-green-50/95 px-3 py-2 text-sm shadow-md backdrop-blur">
      <span className="font-medium text-green-950">Zaznaczono: {liczbaZaznaczonych}</span>
      <button
        type="button"
        disabled={disabled || czek}
        className="rounded-lg bg-green-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-900 disabled:opacity-50"
        onClick={() => {
          ustawBlad("");
          ustawKomunikat("");
          startT(async () => {
            const w = await onZatwierdz();
            if (w.blad) {
              ustawBlad(w.blad);
              return;
            }
            if (w.zatwierdzono != null) {
              ustawKomunikat(
                `Zatwierdzono ${w.zatwierdzono}${w.pominieto ? `, pominięto ${w.pominieto}` : ""}.`,
              );
            }
            onPoSukcesie?.();
          });
        }}
      >
        {czek ? "Przetwarzanie…" : etykietaAkcji}
      </button>
      {blad ? <span className="text-xs text-red-800">{blad}</span> : null}
      {komunikat ? <span className="text-xs text-stone-600">{komunikat}</span> : null}
    </div>
  );
}
