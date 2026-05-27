"use client";

import { useState } from "react";
import { odczytajJsonOdpowiedzi } from "@/lib/api/odczytaj-json-odpowiedzi";
import { WybierzWiesKaskada } from "@/components/wies/wybierz-wies-kaskada";
import type { WpisWsi } from "@/components/wies/wyszukiwarka-wsi";

type Props = {
  wybrana: WpisWsi | null;
  onZmiana: (w: WpisWsi | null) => void;
};

type Tryb = "katalog" | "szukaj";

/**
 * Wybór miejscowości z katalogu (do metadanych rejestracji — orientacja, nie nadaje roli we wsi).
 */
export function RejestracjaWyborWsi({ wybrana, onZmiana }: Props) {
  const [tryb, ustawTryb] = useState<Tryb>("katalog");
  const [fraza, ustawFraze] = useState("");
  const [laduje, ustawLaduje] = useState(false);
  const [wyniki, ustawWyniki] = useState<WpisWsi[]>([]);
  const [podpowiedz, ustawPodpowiedz] = useState("");

  function wybierz(w: WpisWsi) {
    onZmiana(w);
    ustawWyniki([]);
    ustawFraze("");
    ustawPodpowiedz("");
  }

  async function szukaj(e: React.FormEvent) {
    e.preventDefault();
    const q = fraza.trim();
    if (q.length < 2) {
      ustawPodpowiedz("Wpisz co najmniej 2 znaki nazwy miejscowości.");
      ustawWyniki([]);
      return;
    }
    ustawLaduje(true);
    ustawPodpowiedz("");
    try {
      const res = await fetch(`/api/wies/szukaj?q=${encodeURIComponent(q)}`);
      const wynik = await odczytajJsonOdpowiedzi<{ wyniki?: WpisWsi[]; blad?: string }>(res);
      if (!wynik.ok) {
        ustawPodpowiedz(wynik.komunikat);
        ustawWyniki([]);
        return;
      }
      const lista = wynik.dane.wyniki ?? [];
      ustawWyniki(lista);
      if (lista.length === 0) {
        ustawPodpowiedz("Brak wyników. Wybierz miejscowość z katalogu albo spróbuj innej pisowni.");
      }
    } catch {
      ustawPodpowiedz("Nie udało się wysłać zapytania. Sprawdź połączenie z internetem.");
      ustawWyniki([]);
    } finally {
      ustawLaduje(false);
    }
  }

  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50/80 p-4">
      <label className="mb-1 block text-sm font-medium text-stone-800">Która miejscowość?</label>
      <p className="mb-3 text-xs leading-relaxed text-stone-600">
        Wskaż wieś lub miejscowość, <strong>której dotyczy Twoja rejestracja</strong> (gdzie mieszkasz albo którą chcesz
        prowadzić jako sołtys). To ułatwia weryfikację — <strong>nie</strong> nadaje jeszcze roli we wsi.
      </p>
      {wybrana ? (
        <div className="flex flex-col gap-2 rounded-lg border border-green-200 bg-white px-3 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-green-950">{wybrana.nazwa}</p>
            <p className="text-xs text-stone-600">
              {wybrana.gmina}, {wybrana.powiat} · {wybrana.wojewodztwo}
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 text-sm font-medium text-green-800 underline"
            onClick={() => onZmiana(null)}
          >
            Zmień wybór
          </button>
        </div>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                tryb === "katalog" ? "bg-green-800 text-white" : "border border-stone-300 bg-white text-stone-700"
              }`}
              onClick={() => ustawTryb("katalog")}
            >
              Katalog
            </button>
            <button
              type="button"
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                tryb === "szukaj" ? "bg-green-800 text-white" : "border border-stone-300 bg-white text-stone-700"
              }`}
              onClick={() => ustawTryb("szukaj")}
            >
              Szukaj po nazwie
            </button>
          </div>

          {tryb === "katalog" ? (
            <WybierzWiesKaskada
              tekstPrzycisku="Wybierz"
              onWybor={(w) => wybierz(w)}
            />
          ) : (
            <>
              <form onSubmit={szukaj} className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={fraza}
                  onChange={(e) => ustawFraze(e.target.value)}
                  placeholder="np. Studzienki, Sipiory…"
                  className="min-h-[44px] flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none ring-green-800 focus:ring-2"
                />
                <button
                  type="submit"
                  disabled={laduje}
                  className="rounded-lg bg-stone-200 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-stone-300 disabled:opacity-60"
                >
                  {laduje ? "Szukam…" : "Szukaj"}
                </button>
              </form>
              {podpowiedz ? <p className="mt-2 text-xs text-amber-800">{podpowiedz}</p> : null}
              {wyniki.length > 0 ? (
                <ul className="mt-3 max-h-48 divide-y divide-stone-200 overflow-y-auto rounded-lg border border-stone-200 bg-white text-sm">
                  {wyniki.map((w) => (
                    <li key={w.id}>
                      <button
                        type="button"
                        className="w-full px-3 py-2.5 text-left hover:bg-green-50"
                        onClick={() => wybierz(w)}
                      >
                        <span className="font-medium text-stone-900">{w.nazwa}</span>
                        <span className="block text-xs text-stone-600">
                          {w.gmina}, {w.powiat} · {w.wojewodztwo}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          )}
        </>
      )}
    </div>
  );
}
