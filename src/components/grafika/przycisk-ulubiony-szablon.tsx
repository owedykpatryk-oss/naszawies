"use client";

import { useEffect, useState } from "react";
import { czyUlubionySzablon, przelaczUlubionySzablon } from "@/lib/grafika/ulubione-szablony";

type Props = {
  szablonId: string;
  className?: string;
  onZmiana?: () => void;
};

export function PrzyciskUlubionySzablon({ szablonId, className = "", onZmiana }: Props) {
  const [aktywny, ustawAktywny] = useState(false);

  useEffect(() => {
    ustawAktywny(czyUlubionySzablon(szablonId));
  }, [szablonId]);

  return (
    <button
      type="button"
      title={aktywny ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
      aria-label={aktywny ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        const nowy = przelaczUlubionySzablon(szablonId);
        ustawAktywny(nowy);
        onZmiana?.();
      }}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm transition hover:bg-amber-100 ${className} ${
        aktywny ? "text-amber-500" : "text-stone-400"
      }`}
    >
      {aktywny ? "★" : "☆"}
    </button>
  );
}
