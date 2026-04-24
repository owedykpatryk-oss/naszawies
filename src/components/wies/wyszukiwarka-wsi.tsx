"use client";

import { useState } from "react";

export type WpisWsi = {
  id: string;
  nazwa: string;
  gmina: string;
  powiat: string;
  wojewodztwo: string;
  sciezka: string;
};

type Props = {
  etykietaAkcji: string;
  /** Wywoływane po kliknięciu akcji na wierszu (np. „Złóż wniosek”). */
  onAkcja: (w: WpisWsi) => void | Promise<void>;
  /** Tekst na przycisku przy każdej wsi */
  tekstPrzycisku: string;
};

export function WyszukiwarkaWsi({ etykietaAkcji, onAkcja, tekstPrzycisku }: Props) {
  const [fraza, ustawFraze] = useState("");
  const [laduje, ustawLaduje] = useState(false);
  const [wyniki, ustawWyniki] = useState<WpisWsi[]>([]);
  const [blad, ustawBlad] = useState("");

  async function szukaj(e: React.FormEvent) {
    e.preventDefault();
    const q = fraza.trim();
    if (q.length < 2) {
      ustawBlad("Minimum 2 znaki.");
      ustawWyniki([]);
      return;
    }
    ustawLaduje(true);
    ustawBlad("");
    try {
      const res = await fetch(`/api/wies/szukaj?q=${encodeURIComponent(q)}`);
      const d = (await res.json()) as { wyniki?: WpisWsi[]; blad?: string };
      if (!res.ok) {
        ustawBlad(d.blad ?? "Błąd wyszukiwania.");
        ustawWyniki([]);
        return;
      }
      ustawWyniki(d.wyniki ?? []);
      if ((d.wyniki ?? []).length === 0) {
        ustawBlad(
          "Brak wyników. Jeśli wyszukujesz miejscowość, której jeszcze nie ma w katalogu, daj znać przez formularz na stronie głównej — uzupełniamy listę po sprawdzeniu w rejestrze TERYT."
        );
      }
    } catch {
      ustawBlad("Brak połączenia.");
      ustawWyniki([]);
    } finally {
      ustawLaduje(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-stone-800">{etykietaAkcji}</p>
      <form onSubmit={szukaj} className="flex flex-col gap-2 sm:flex-row">
        <input
          value={fraza}
          onChange={(e) => ustawFraze(e.target.value)}
          placeholder="Szukaj miejscowości…"
          className="min-h-[44px] flex-1 rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none ring-green-800 focus:ring-2"
        />
        <button
          type="submit"
          disabled={laduje}
          className="rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-60"
        >
          {laduje ? "Szukam…" : "Szukaj"}
        </button>
      </form>
      {blad && wyniki.length === 0 ? <p className="text-sm text-amber-800">{blad}</p> : null}
      {wyniki.length > 0 ? (
        <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
          {wyniki.map((w) => (
            <li key={w.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-stone-900">{w.nazwa}</p>
                <p className="text-xs text-stone-600">
                  {w.gmina}, {w.powiat} · {w.wojewodztwo}
                </p>
                <a href={w.sciezka} className="text-xs text-green-800 underline">
                  Zobacz profil wsi
                </a>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-lg border border-green-800 bg-white px-3 py-1.5 text-sm font-medium text-green-900 hover:bg-green-50"
                onClick={() => void onAkcja(w)}
              >
                {tekstPrzycisku}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
