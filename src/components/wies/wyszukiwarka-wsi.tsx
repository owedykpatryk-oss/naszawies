"use client";

import { useState } from "react";
import { odczytajJsonOdpowiedzi } from "@/lib/api/odczytaj-json-odpowiedzi";
import { WybierzWiesKaskada } from "@/components/wies/wybierz-wies-kaskada";

export type WpisWsi = {
  id: string;
  nazwa: string;
  gmina: string;
  powiat: string;
  wojewodztwo: string;
  sciezka: string;
  /** Kod TERYT — gdy zwróci `/api/wies/szukaj` */
  terytId?: string;
};

type Props = {
  etykietaAkcji: string;
  /** Wywoływane po kliknięciu akcji na wierszu (np. „Złóż wniosek”). */
  onAkcja: (w: WpisWsi) => void | Promise<void>;
  /** Tekst na przycisku przy każdej wsi */
  tekstPrzycisku: string;
};

type Tryb = "katalog" | "szukaj";

export function WyszukiwarkaWsi({ etykietaAkcji, onAkcja, tekstPrzycisku }: Props) {
  const [tryb, ustawTryb] = useState<Tryb>("katalog");
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
      const wynik = await odczytajJsonOdpowiedzi<{ wyniki?: WpisWsi[]; blad?: string }>(res);
      if (!wynik.ok) {
        ustawBlad(wynik.komunikat);
        ustawWyniki([]);
        return;
      }
      ustawWyniki(wynik.dane.wyniki ?? []);
      if ((wynik.dane.wyniki ?? []).length === 0) {
        ustawBlad(
          "Brak wyników. Wybierz miejscowość z katalogu (województwo → powiat → gmina) albo spróbuj innej pisowni.",
        );
      }
    } catch {
      ustawBlad("Nie udało się wysłać zapytania. Sprawdź połączenie z internetem.");
      ustawWyniki([]);
    } finally {
      ustawLaduje(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-stone-800">{etykietaAkcji}</p>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Sposób wyboru miejscowości">
        <button
          type="button"
          role="tab"
          aria-selected={tryb === "katalog"}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
            tryb === "katalog"
              ? "bg-green-800 text-white"
              : "border border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
          }`}
          onClick={() => ustawTryb("katalog")}
        >
          Wybierz z katalogu
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tryb === "szukaj"}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
            tryb === "szukaj"
              ? "bg-green-800 text-white"
              : "border border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
          }`}
          onClick={() => ustawTryb("szukaj")}
        >
          Szukaj po nazwie
        </button>
      </div>

      {tryb === "katalog" ? (
        <WybierzWiesKaskada tekstPrzycisku={tekstPrzycisku} onWybor={onAkcja} />
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
