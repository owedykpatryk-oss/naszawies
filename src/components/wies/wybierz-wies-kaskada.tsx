"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { pobierzKatalogDlaRejestracji } from "@/app/(site)/rejestracja/akcje-katalog-wsi";
import { odczytajJsonOdpowiedzi } from "@/lib/api/odczytaj-json-odpowiedzi";
import type { WpisWsi } from "@/components/wies/wyszukiwarka-wsi";

type Element = { nazwa: string; slug: string; liczba?: number };

type Props = {
  /** Tekst na przycisku akcji przy wybranej wsi (opcjonalnie — bez akcji pokazuje link do profilu). */
  tekstPrzycisku?: string;
  onWybor?: (w: WpisWsi) => void | Promise<void>;
  /** Gdy true — lista wsi z linkami zamiast przycisku akcji. */
  trybPrzegladania?: boolean;
  /** Formularz rejestracji — server actions zamiast chronionego API. */
  trybRejestracji?: boolean;
  className?: string;
};

const stylSelect =
  "min-h-[44px] w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none ring-green-800 focus:ring-2 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-500";

export function WybierzWiesKaskada({
  tekstPrzycisku,
  onWybor,
  trybPrzegladania,
  trybRejestracji = false,
  className,
}: Props) {
  const [woj, ustawWoj] = useState("");
  const [pow, ustawPow] = useState("");
  const [gmina, ustawGmina] = useState("");

  const [wojewodztwa, ustawWojewodztwa] = useState<Element[]>([]);
  const [powiaty, ustawPowiaty] = useState<Element[]>([]);
  const [gminy, ustawGminy] = useState<Element[]>([]);
  const [wsi, ustawWsi] = useState<WpisWsi[]>([]);

  const [laduje, ustawLaduje] = useState<"woj" | "pow" | "gmina" | "wsi" | null>("woj");
  const [blad, ustawBlad] = useState("");

  const pobierzKatalog = useCallback(
    async (url: string) => {
      if (trybRejestracji) {
        const u = new URL(url, "http://local");
        const poziom = u.searchParams.get("poziom");
        const payload =
          poziom === "wojewodztwa"
            ? { poziom: "wojewodztwa" as const }
            : poziom === "powiaty"
              ? { poziom: "powiaty" as const, woj: u.searchParams.get("woj") ?? "" }
              : poziom === "gminy"
                ? {
                    poziom: "gminy" as const,
                    woj: u.searchParams.get("woj") ?? "",
                    pow: u.searchParams.get("pow") ?? "",
                  }
                : {
                    poziom: "wsi" as const,
                    woj: u.searchParams.get("woj") ?? "",
                    pow: u.searchParams.get("pow") ?? "",
                    gmina: u.searchParams.get("gmina") ?? "",
                  };
        const w = await pobierzKatalogDlaRejestracji(payload);
        if (!w.ok) {
          return { ok: false as const, komunikat: w.blad };
        }
        return { ok: true as const, dane: { elementy: w.elementy, wsi: w.wsi as WpisWsi[] | undefined } };
      }
      const res = await fetch(url);
      return odczytajJsonOdpowiedzi<{ elementy?: Element[]; wsi?: WpisWsi[]; blad?: string }>(res);
    },
    [trybRejestracji],
  );

  useEffect(() => {
    let anuluj = false;
    (async () => {
      ustawLaduje("woj");
      ustawBlad("");
      const wynik = await pobierzKatalog("/api/wies/katalog?poziom=wojewodztwa");
      if (anuluj) return;
      if (!wynik.ok) {
        ustawBlad(wynik.komunikat);
        ustawWojewodztwa([]);
      } else {
        ustawWojewodztwa(wynik.dane.elementy ?? []);
      }
      ustawLaduje(null);
    })();
    return () => {
      anuluj = true;
    };
  }, [pobierzKatalog]);

  useEffect(() => {
    if (!woj) {
      ustawPowiaty([]);
      ustawPow("");
      return;
    }
    let anuluj = false;
    (async () => {
      ustawLaduje("pow");
      ustawBlad("");
      ustawPowiaty([]);
      ustawPow("");
      ustawGminy([]);
      ustawGmina("");
      ustawWsi([]);
      const wynik = await pobierzKatalog(`/api/wies/katalog?poziom=powiaty&woj=${encodeURIComponent(woj)}`);
      if (anuluj) return;
      if (!wynik.ok) {
        ustawBlad(wynik.komunikat);
      } else {
        ustawPowiaty(wynik.dane.elementy ?? []);
      }
      ustawLaduje(null);
    })();
    return () => {
      anuluj = true;
    };
  }, [woj, pobierzKatalog]);

  useEffect(() => {
    if (!woj || !pow) {
      ustawGminy([]);
      ustawGmina("");
      return;
    }
    let anuluj = false;
    (async () => {
      ustawLaduje("gmina");
      ustawBlad("");
      ustawGminy([]);
      ustawGmina("");
      ustawWsi([]);
      const wynik = await pobierzKatalog(
        `/api/wies/katalog?poziom=gminy&woj=${encodeURIComponent(woj)}&pow=${encodeURIComponent(pow)}`,
      );
      if (anuluj) return;
      if (!wynik.ok) {
        ustawBlad(wynik.komunikat);
      } else {
        ustawGminy(wynik.dane.elementy ?? []);
      }
      ustawLaduje(null);
    })();
    return () => {
      anuluj = true;
    };
  }, [woj, pow, pobierzKatalog]);

  useEffect(() => {
    if (!woj || !pow || !gmina) {
      ustawWsi([]);
      return;
    }
    let anuluj = false;
    (async () => {
      ustawLaduje("wsi");
      ustawBlad("");
      ustawWsi([]);
      const wynik = await pobierzKatalog(
        `/api/wies/katalog?poziom=wsi&woj=${encodeURIComponent(woj)}&pow=${encodeURIComponent(pow)}&gmina=${encodeURIComponent(gmina)}`,
      );
      if (anuluj) return;
      if (!wynik.ok) {
        ustawBlad(wynik.komunikat);
      } else {
        ustawWsi(wynik.dane.wsi ?? []);
        if ((wynik.dane.wsi ?? []).length === 0) {
          ustawBlad("Brak miejscowości w tej gminie w katalogu.");
        }
      }
      ustawLaduje(null);
    })();
    return () => {
      anuluj = true;
    };
  }, [woj, pow, gmina, pobierzKatalog]);

  const wojNazwa = wojewodztwa.find((e) => e.slug === woj)?.nazwa;
  const powNazwa = powiaty.find((e) => e.slug === pow)?.nazwa;
  const gminaNazwa = gminy.find((e) => e.slug === gmina)?.nazwa;

  return (
    <div className={className ?? "space-y-4"}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label htmlFor="katalog-woj" className="mb-1 block text-xs font-medium text-stone-600">
            Województwo
          </label>
          <select
            id="katalog-woj"
            value={woj}
            onChange={(e) => ustawWoj(e.target.value)}
            disabled={laduje === "woj" || wojewodztwa.length === 0}
            className={stylSelect}
          >
            <option value="">{laduje === "woj" ? "Ładowanie…" : "— wybierz —"}</option>
            {wojewodztwa.map((e) => (
              <option key={e.slug} value={e.slug}>
                {e.nazwa}
                {e.liczba != null ? ` (${e.liczba} miejsc.)` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="katalog-pow" className="mb-1 block text-xs font-medium text-stone-600">
            Powiat
          </label>
          <select
            id="katalog-pow"
            value={pow}
            onChange={(e) => ustawPow(e.target.value)}
            disabled={!woj || laduje === "pow"}
            className={stylSelect}
          >
            <option value="">
              {!woj ? "Najpierw województwo" : laduje === "pow" ? "Ładowanie…" : "— wybierz —"}
            </option>
            {powiaty.map((e) => (
              <option key={e.slug} value={e.slug}>
                {e.nazwa}
                {e.liczba != null ? ` (${e.liczba})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2 lg:col-span-1">
          <label htmlFor="katalog-gmina" className="mb-1 block text-xs font-medium text-stone-600">
            Gmina
          </label>
          <select
            id="katalog-gmina"
            value={gmina}
            onChange={(e) => ustawGmina(e.target.value)}
            disabled={!pow || laduje === "gmina"}
            className={stylSelect}
          >
            <option value="">
              {!pow ? "Najpierw powiat" : laduje === "gmina" ? "Ładowanie…" : "— wybierz —"}
            </option>
            {gminy.map((e) => (
              <option key={e.slug} value={e.slug}>
                {e.nazwa}
                {e.liczba != null ? ` (${e.liczba})` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {woj && pow && gmina ? (
        <div>
          <p className="mb-2 text-xs text-stone-500">
            {gminaNazwa}, powiat {powNazwa} · {wojNazwa}
            {laduje === "wsi" ? " · ładowanie listy…" : wsi.length > 0 ? ` · ${wsi.length} miejsc.` : ""}
          </p>
          {wsi.length > 0 ? (
            <ul className="max-h-72 divide-y divide-stone-200 overflow-y-auto rounded-xl border border-stone-200 bg-white">
              {wsi.map((w) => (
                <li key={w.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    {trybPrzegladania ? (
                      <Link
                        href={w.sciezka}
                        className="font-medium text-green-900 underline-offset-2 hover:underline"
                      >
                        {w.nazwa}
                      </Link>
                    ) : (
                      <p className="font-medium text-stone-900">{w.nazwa}</p>
                    )}
                    <p className="text-xs text-stone-600">
                      {w.gmina}, {w.powiat} · {w.wojewodztwo}
                    </p>
                  </div>
                  {trybPrzegladania ? (
                    <Link
                      href={w.sciezka}
                      className="shrink-0 text-sm font-medium text-green-800 underline"
                    >
                      Profil →
                    </Link>
                  ) : tekstPrzycisku && onWybor ? (
                    <button
                      type="button"
                      className="shrink-0 rounded-lg border border-green-800 bg-white px-3 py-1.5 text-sm font-medium text-green-900 hover:bg-green-50"
                      onClick={() => void onWybor(w)}
                    >
                      {tekstPrzycisku}
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : laduje !== "wsi" && !blad ? (
            <p className="text-sm text-stone-600">Brak miejscowości w katalogu dla tej gminy.</p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-stone-600">
          Wybierz kolejno województwo, powiat i gminę — poniżej pojawi się lista miejscowości.
        </p>
      )}

      {blad ? (
        <p className="text-sm text-amber-800" role="status">
          {blad}
        </p>
      ) : null}
    </div>
  );
}
