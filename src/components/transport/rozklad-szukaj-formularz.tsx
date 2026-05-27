"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RozkladSzukajFormularz({ domyslnaStacja = "" }: { domyslnaStacja?: string }) {
  const router = useRouter();
  const [fraza, setFraza] = useState(domyslnaStacja);

  return (
    <form
      className="mt-6 flex flex-wrap gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const q = fraza.trim();
        if (!q) return;
        router.push(`/transport/rozklad?stacja=${encodeURIComponent(q)}`);
      }}
    >
      <label className="sr-only" htmlFor="fraza-stacji">
        Nazwa stacji kolejowej
      </label>
      <input
        id="fraza-stacji"
        type="search"
        value={fraza}
        onChange={(e) => setFraza(e.target.value)}
        placeholder="np. Bydgoszcz Główna, Inowrocław"
        className="min-w-[12rem] flex-1 rounded-xl border border-stone-300 px-4 py-2.5 text-sm"
        autoComplete="off"
      />
      <button type="submit" className="btn-panel-primary text-sm">
        Szukaj rozkładu PKP
      </button>
    </form>
  );
}
