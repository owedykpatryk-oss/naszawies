"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { odczytajJsonOdpowiedzi } from "@/lib/api/odczytaj-json-odpowiedzi";
import { WybierzWiesKaskada } from "@/components/wies/wybierz-wies-kaskada";
import { sciezkaGminy, sciezkaPowiatu } from "@/lib/wies/sciezka-publiczna";

type Wynik = {
  id: string;
  nazwa: string;
  gmina: string;
  powiat: string;
  wojewodztwo: string;
  sciezka: string;
};

type Tryb = "katalog" | "szukaj";

export function SzukajKatalog({ poczatkoweZapytanie }: { poczatkoweZapytanie?: string }) {
  const router = useRouter();
  const maStartoweZapytanie = (poczatkoweZapytanie ?? "").trim().length >= 2;
  const [tryb, ustawTryb] = useState<Tryb>(() => (maStartoweZapytanie ? "szukaj" : "katalog"));
  const [fraza, ustawFraze] = useState(() => (poczatkoweZapytanie ?? "").trim());
  const [laduje, ustawLaduje] = useState(false);
  const [wyniki, ustawWyniki] = useState<Wynik[]>([]);
  const [blad, ustawBlad] = useState("");

  const wykonanoZapytanieStartowe = useRef(false);

  const wykonajSzukanie = useCallback(
    async (qSurowe: string, opcje?: { aktualizujUrl?: boolean }) => {
      const q = qSurowe.trim();
      if (q.length < 2) {
        ustawBlad("Wpisz co najmniej 2 znaki.");
        ustawWyniki([]);
        return;
      }
      ustawLaduje(true);
      ustawBlad("");
      try {
        const res = await fetch(`/api/wies/szukaj?q=${encodeURIComponent(q)}`);
        const wynik = await odczytajJsonOdpowiedzi<{ wyniki?: Wynik[]; blad?: string }>(res);
        if (!wynik.ok) {
          ustawBlad(wynik.komunikat);
          ustawWyniki([]);
          return;
        }
        ustawWyniki(wynik.dane.wyniki ?? []);
        if ((wynik.dane.wyniki ?? []).length === 0) {
          ustawBlad(
            "Nic nie znaleziono. Wybierz miejscowość z katalogu (województwo → powiat → gmina) albo spróbuj innej frazy.",
          );
        }
        if (opcje?.aktualizujUrl !== false) {
          router.replace(`/szukaj?q=${encodeURIComponent(q)}`, { scroll: false });
        }
      } catch {
        ustawBlad("Nie udało się wysłać zapytania. Sprawdź połączenie z internetem.");
        ustawWyniki([]);
      } finally {
        ustawLaduje(false);
      }
    },
    [router],
  );

  useEffect(() => {
    if (wykonanoZapytanieStartowe.current) return;
    const q = (poczatkoweZapytanie ?? "").trim();
    if (q.length < 2) return;
    wykonanoZapytanieStartowe.current = true;
    void wykonajSzukanie(q, { aktualizujUrl: false });
  }, [poczatkoweZapytanie, wykonajSzukanie]);

  async function szukaj(e: FormEvent) {
    e.preventDefault();
    await wykonajSzukanie(fraza, { aktualizujUrl: true });
  }

  const skrotyHub = useMemo(() => {
    if (wyniki.length < 2) return [];
    const mapaGmin = new Map<string, { gmina: string; powiat: string; wojewodztwo: string; liczba: number }>();
    for (const w of wyniki) {
      const klucz = `${w.gmina}|${w.powiat}|${w.wojewodztwo}`;
      const prev = mapaGmin.get(klucz);
      if (prev) prev.liczba += 1;
      else mapaGmin.set(klucz, { gmina: w.gmina, powiat: w.powiat, wojewodztwo: w.wojewodztwo, liczba: 1 });
    }
    return Array.from(mapaGmin.values())
      .filter((g) => g.liczba >= 2)
      .sort((a, b) => b.liczba - a.liczba)
      .slice(0, 3);
  }, [wyniki]);

  return (
    <div className="mt-10">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Sposób wyszukiwania">
        <button
          type="button"
          role="tab"
          aria-selected={tryb === "katalog"}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
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
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
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
        <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-stone-600">
            Wybierz kolejno <strong>województwo</strong>, <strong>powiat</strong>, <strong>gminę</strong>, a potem swoją
            miejscowość z listy.
          </p>
          <WybierzWiesKaskada trybPrzegladania className="mt-4" />
        </div>
      ) : (
        <>
          <form
            onSubmit={szukaj}
            className="mt-6 flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:flex-row"
          >
            <label className="sr-only" htmlFor="szukaj-fraza">
              Nazwa miejscowości
            </label>
            <input
              id="szukaj-fraza"
              value={fraza}
              onChange={(e) => ustawFraze(e.target.value)}
              placeholder="np. Studzienki, Kcynia…"
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
              {" "}
              <button
                type="button"
                className="font-medium text-green-900 underline"
                onClick={() => ustawTryb("katalog")}
              >
                Przejdź do katalogu
              </button>
            </p>
          ) : null}

          {skrotyHub.length > 0 ? (
            <div className="mt-6 rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-4">
              <p className="text-sm font-medium text-emerald-950">Przeglądaj całą gminę lub powiat</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {skrotyHub.map((g) => (
                  <li key={`${g.gmina}-${g.powiat}`}>
                    <Link
                      href={sciezkaGminy({
                        voivodeship: g.wojewodztwo,
                        county: g.powiat,
                        commune: g.gmina,
                      })}
                      className="inline-flex rounded-full border border-emerald-300 bg-white px-3 py-1.5 text-xs font-medium text-emerald-900 hover:bg-emerald-100"
                    >
                      Wszystkie wsie: {g.gmina} ({g.liczba})
                    </Link>
                  </li>
                ))}
                {skrotyHub[0] ? (
                  <li>
                    <Link
                      href={sciezkaPowiatu({
                        voivodeship: skrotyHub[0].wojewodztwo,
                        county: skrotyHub[0].powiat,
                      })}
                      className="inline-flex rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50"
                    >
                      Powiat {skrotyHub[0].powiat}
                    </Link>
                  </li>
                ) : null}
              </ul>
            </div>
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
                    <Link
                      href={sciezkaGminy({
                        voivodeship: w.wojewodztwo,
                        county: w.powiat,
                        commune: w.gmina,
                      })}
                      className="text-green-800 hover:underline"
                    >
                      {w.gmina}
                    </Link>
                    ,{" "}
                    <Link
                      href={sciezkaPowiatu({ voivodeship: w.wojewodztwo, county: w.powiat })}
                      className="text-green-800 hover:underline"
                    >
                      {w.powiat}
                    </Link>{" "}
                    · {w.wojewodztwo}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}
    </div>
  );
}
