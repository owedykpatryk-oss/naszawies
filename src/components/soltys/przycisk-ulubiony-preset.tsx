"use client";

import { useEffect, useState } from "react";
import { przelaczUlubionyPreset, wczytajUlubionePresety } from "@/lib/dokumenty-soltysa/ulubione-presety";

type Props = {
  presetId: string;
  onZmiana?: () => void;
};

export function PrzyciskUlubionyPreset({ presetId, onZmiana }: Props) {
  const [aktywny, ustawAktywny] = useState(false);

  useEffect(() => {
    ustawAktywny(wczytajUlubionePresety().includes(presetId));
  }, [presetId]);

  return (
    <button
      type="button"
      title={aktywny ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
      aria-label={aktywny ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        const nowy = przelaczUlubionyPreset(presetId);
        ustawAktywny(nowy);
        onZmiana?.();
      }}
      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs transition hover:bg-amber-100 ${
        aktywny ? "text-amber-500" : "text-stone-400"
      }`}
    >
      {aktywny ? "★" : "☆"}
    </button>
  );
}
