"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type Wynik = {
  id: string;
  nazwa: string;
  gmina: string;
  powiat: string;
  wojewodztwo: string;
  sciezka: string;
};

export function SzukajKatalog() {
  const [fraza, ustawFraze] = useState("");
  const [laduje, ustawLaduje] = useState(false);
  const [wyniki, ustawWyniki] = useState<Wynik[]>([]);
  const [blad, ustawBlad] = useState("");

  async function szukaj(e: FormEvent) {
    e.preventDefault();
    const q = fraza.trim();
    if (q.length < 2) {
      ustawBlad("Wpisz co najmniej 2 znaki.");
      ustawWyniki([]);
      return;
    }
    ustawLaduje(true);
    ustawBlad("");
    try {
      const res = await fetch(`/api/wies/szukaj?q=${encodeURIComponent(q)}`);
      const d = (await res.json()) as { wyniki?: Wynik[]; blad?: string };
      if (!res.ok) {
        ustawBlad(d.blad ?? "Błąd wyszukiwania.");
        ustawWyniki([]);
        return;
      }
      ustawWyniki(d.wyniki ?? []);
      if ((d.wyniki ?? []).length === 0) {
        ustawBlad(
          "Nic nie znaleziono. Spróbuj innej frazy. Jeśli miejscowość jeszcze nie jest w serwisie, napisz do nas z formularza na stronie głównej (lista zainteresowanych) — dołożymy ją po weryfikacji danych z rejestru TERYT."
        );
      }
    } catch {
      ustawBlad("Brak połączenia z serwerem.");
      ustawWyniki([]);
    } finally {
      ustawLaduje(false);
    }
  }

  return (
    <div className="mt-10">
      <form
        onSubmit={szukaj}
        className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:flex-row"
      >
        <label className="sr-only" htmlFor="szukaj-fraza">
          Nazwa miejscowości
        </label>
        <input
          id="szukaj-fraza"
          value={fraza}
          onChange={(e) => ustawFraze(e.target.value)}
          placeholder="np. Studzienki, Kcynia, powiat nakielski, wielkopolskie…"
          className="min-h-[48px] flex-1 rounded-lg border border-stone-300 px-4 py-3 text-stone-900 outline-none ring-green-800 focus:ring-2"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={laduje}
          className="min-h-[48px] shrink-0 rounded-lg bg-green-800 px-6 font-medium text-white transition hover:bg-green-900 disabled:opacity-60"
        >
          {laduje ? "Szukam…" : "Szukaj"}
        </button>
      </form>

      {blad && wyniki.length === 0 ? (
        <p className="mt-4 text-sm text-amber-800" role="status">
          {blad}
        </p>
      ) : null}

      {wyniki.length > 0 ? (
        <ul className="mt-8 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white shadow-sm">
          {wyniki.map((w) => (
            <li key={w.id} className="px-4 py-3">
              <Link
                href={w.sciezka}
                className="font-medium text-green-900 underline-offset-2 hover:underline"
              >
                {w.nazwa}
              </Link>
              <p className="text-sm text-stone-600">
                {w.gmina}, {w.powiat} · {w.wojewodztwo}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
