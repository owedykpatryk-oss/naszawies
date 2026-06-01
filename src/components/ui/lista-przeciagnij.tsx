"use client";

import { useState, type ReactNode } from "react";

type Props<T extends string> = {
  elementy: T[];
  onChange: (next: T[]) => void;
  renderWiersz: (klucz: T, index: number) => ReactNode;
  etykietaPrzeciagnij?: string;
  className?: string;
};

/** Lista z przeciąganiem (HTML5) — bez zewnętrznych bibliotek. */
export function ListaPrzeciagnij<T extends string>({
  elementy,
  onChange,
  renderWiersz,
  etykietaPrzeciagnij = "Przeciągnij, aby zmienić kolejność",
  className = "",
}: Props<T>) {
  const [przeciagniety, ustawPrzeciagniety] = useState<T | null>(null);

  function przesun(from: T, to: T) {
    if (from === to) return;
    const idx = elementy.indexOf(from);
    const nextIdx = elementy.indexOf(to);
    if (idx < 0 || nextIdx < 0) return;
    const kopia = [...elementy];
    kopia.splice(idx, 1);
    kopia.splice(nextIdx, 0, from);
    onChange(kopia);
  }

  return (
    <ol className={`space-y-1 ${className}`} aria-label={etykietaPrzeciagnij}>
      {elementy.map((klucz, i) => (
        <li
          key={klucz}
          draggable
          onDragStart={() => ustawPrzeciagniety(klucz)}
          onDragEnd={() => ustawPrzeciagniety(null)}
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (przeciagniety) przesun(przeciagniety, klucz);
            ustawPrzeciagniety(null);
          }}
          className={`flex cursor-grab items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm transition active:cursor-grabbing ${
            przeciagniety === klucz
              ? "border-green-400 bg-green-50/80 opacity-80"
              : "border-stone-200 hover:border-green-300"
          }`}
        >
          <span className="shrink-0 text-stone-400 select-none" aria-hidden title={etykietaPrzeciagnij}>
            ⠿
          </span>
          <span className="min-w-0 flex-1">{renderWiersz(klucz, i)}</span>
        </li>
      ))}
    </ol>
  );
}
