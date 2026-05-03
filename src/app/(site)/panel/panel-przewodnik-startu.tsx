"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { StanPrzewodnikaStartu } from "@/lib/panel/stan-przewodnika-startu";

const KLUCZ_SESSION = "naszawies_panel_przewodnik_ukryj";
const KLUCZ_LS_TTL = "naszawies_przewodnik_ukryj_do";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

function czyUkrytePrzezLocalStorage(): boolean {
  try {
    const raw = localStorage.getItem(KLUCZ_LS_TTL);
    if (!raw) return false;
    const koniec = Date.parse(raw);
    if (Number.isNaN(koniec)) {
      localStorage.removeItem(KLUCZ_LS_TTL);
      return false;
    }
    if (koniec > Date.now()) return true;
    localStorage.removeItem(KLUCZ_LS_TTL);
  } catch {
    /* ignore */
  }
  return false;
}

function Krok({
  ok,
  tytul,
  opis,
  dzieci,
}: {
  ok: boolean;
  tytul: string;
  opis: string;
  dzieci: React.ReactNode;
}) {
  return (
    <li className={`rounded-xl border px-4 py-3 ${ok ? "border-emerald-200 bg-emerald-50/50" : "border-amber-200 bg-white"}`}>
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            ok ? "bg-emerald-600 text-white" : "border-2 border-amber-400 bg-amber-50 text-amber-900"
          }`}
          aria-hidden
        >
          {ok ? "✓" : "!"}
        </span>
        <div className="min-w-0">
          <p className="font-medium text-green-950">{tytul}</p>
          <p className="mt-1 text-sm text-stone-600">{opis}</p>
          {!ok ? <div className="mt-2 flex flex-wrap gap-2 text-sm">{dzieci}</div> : null}
        </div>
      </div>
    </li>
  );
}

export function PanelPrzewodnikStartu({ stan }: { stan: StanPrzewodnikaStartu }) {
  const [ukryty, ustawUkryty] = useState(false);

  const procent = useMemo(() => {
    if (stan.lacznieKrokow <= 0) return 100;
    return Math.round((stan.ukonczoneKrokow / stan.lacznieKrokow) * 100);
  }, [stan.lacznieKrokow, stan.ukonczoneKrokow]);

  const nastepnyKrok = useMemo(() => {
    if (!stan.profilNickOk) {
      return {
        etykieta: "Uzupełnij profil",
        opis: "Ustaw nazwę wyświetlaną (minimum 2 znaki), żeby inni mogli Cię rozpoznać.",
        href: "/panel/profil",
        pomocHref: "/panel/pierwsze-kroki#krok-profil",
      };
    }
    if (!stan.powiazanieZWisiaOk) {
      return {
        etykieta: "Powiąż konto z miejscowością",
        opis: "Dodaj obserwację lub złóż wniosek o rolę mieszkańca / OSP / KGW.",
        href: "/panel/mieszkaniec#dolacz-mieszkaniec",
        pomocHref: "/panel/pierwsze-kroki#krok-wies",
      };
    }
    if (stan.jestSoltysem && !stan.wiesOpisWypelniony) {
      return {
        etykieta: "Uzupełnij opis wsi",
        opis: "Dodaj krótki opis publiczny miejscowości, żeby uruchomić pełny profil.",
        href: "/panel/soltys/moja-wies",
        pomocHref: "/panel/pierwsze-kroki#krok-soltys",
      };
    }
    return null;
  }, [stan.jestSoltysem, stan.powiazanieZWisiaOk, stan.profilNickOk, stan.wiesOpisWypelniony]);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(KLUCZ_SESSION) === "1") ustawUkryty(true);
      else if (czyUkrytePrzezLocalStorage()) ustawUkryty(true);
    } catch {
      /* ignore */
    }
  }, []);

  if (!stan.pokazBaner || ukryty) return null;

  function schowajTylkoTaSesja() {
    try {
      sessionStorage.setItem(KLUCZ_SESSION, "1");
    } catch {
      /* ignore */
    }
    ustawUkryty(true);
  }

  function schowajNa7Dni() {
    try {
      localStorage.setItem(KLUCZ_LS_TTL, new Date(Date.now() + TTL_MS).toISOString());
      sessionStorage.removeItem(KLUCZ_SESSION);
    } catch {
      /* ignore */
    }
    ustawUkryty(true);
  }

  return (
    <section
      className="mb-10 rounded-2xl border border-sky-300/60 bg-gradient-to-br from-sky-50 via-white to-emerald-50/40 p-5 shadow-sm ring-1 ring-sky-900/5"
      aria-labelledby="panel-przewodnik-naglowek"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p id="panel-przewodnik-naglowek" className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-800">
            Start w portalu
          </p>
          <h2 className="mt-1 font-serif text-xl text-green-950">Zrób pierwsze kroki — co, gdzie i po kolei</h2>
          <p className="mt-1 max-w-2xl text-sm text-stone-600">
            Postęp: <strong>{stan.ukonczoneKrokow}</strong> z <strong>{stan.lacznieKrokow}</strong> kroków. Możesz
            chwilowo schować ten blok — wróci po zamknięciu karty lub po upływie 7 dni (zależnie od przycisku).
          </p>
          <div
            className="mt-3 h-2 max-w-md overflow-hidden rounded-full bg-stone-200"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={procent}
            aria-label={`Postęp konfiguracji: ${procent} procent`}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-green-700 transition-[width] duration-500"
              style={{ width: `${procent}%` }}
            />
          </div>
          {nastepnyKrok ? (
            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-sm">
              <p className="font-semibold text-green-950">Najbliższy krok: {nastepnyKrok.etykieta}</p>
              <p className="mt-1 text-stone-700">{nastepnyKrok.opis}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link
                  href={nastepnyKrok.href}
                  className="rounded-lg bg-green-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-900 sm:text-sm"
                >
                  Dokończ teraz
                </Link>
                <Link
                  href={nastepnyKrok.pomocHref}
                  className="rounded-lg border border-green-800 px-3 py-1.5 text-xs text-green-900 hover:bg-green-50 sm:text-sm"
                >
                  Jak to zrobić
                </Link>
              </div>
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <Link
            href="/panel/pierwsze-kroki"
            className="inline-flex justify-center rounded-lg border border-green-800 bg-green-900 px-3 py-2 text-center text-xs font-medium text-white shadow-sm hover:bg-green-950 sm:text-sm"
          >
            Pełny przewodnik
          </Link>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <button
              type="button"
              onClick={schowajNa7Dni}
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-800 hover:bg-stone-50 sm:text-sm"
            >
              Schowaj na 7 dni
            </button>
            <button
              type="button"
              onClick={schowajTylkoTaSesja}
              className="rounded-lg border border-stone-200 bg-stone-50/80 px-3 py-2 text-xs text-stone-600 hover:bg-stone-100 sm:text-sm"
            >
              Tylko ta sesja
            </button>
          </div>
        </div>
      </div>

      <ol className="mt-5 space-y-3">
        <Krok
          ok={stan.profilNickOk}
          tytul="1. Uzupełnij profil"
          opis="Ustaw nazwę wyświetlaną (jak mają Cię widzieć sąsiedzi). Telefon i zdjęcie są mile widziane, ale nick jest podstawą."
          dzieci={
            <Link href="/panel/profil" className="rounded-lg bg-green-800 px-3 py-1.5 text-white hover:bg-green-900">
              Otwórz „Mój profil”
            </Link>
          }
        />
        <Krok
          ok={stan.powiazanieZWisiaOk}
          tytul="2. Wybierz wieś lub gminę, która Cię dotyczy"
          opis="Jeśli wskazałeś miejscowość już przy rejestracji, ten krok masz zaliczony. Dla pełnych uprawnień możesz później złożyć wniosek o rolę mieszkańca / OSP / KGW lub dodać obserwację."
          dzieci={
            <>
              <Link
                href="/panel/mieszkaniec#dolacz-mieszkaniec"
                className="rounded-lg border border-green-800 px-3 py-1.5 text-green-900 hover:bg-green-50"
              >
                Wniosek — mieszkaniec
              </Link>
              <Link
                href="/panel/mieszkaniec#wnioski-org"
                className="rounded-lg border border-green-800 px-3 py-1.5 text-green-900 hover:bg-green-50"
              >
                Wniosek — OSP / KGW / rada
              </Link>
              <Link href="/wybierz-wies" className="rounded-lg border border-stone-300 px-3 py-1.5 hover:bg-stone-50">
                Katalog miejscowości
              </Link>
              <Link
                href="/panel/mieszkaniec#obserwuj-wies"
                className="rounded-lg border border-green-800 px-3 py-1.5 text-green-900 hover:bg-green-50"
              >
                Obserwuj bez roli
              </Link>
            </>
          }
        />
        {stan.jestSoltysem ? (
          <Krok
            ok={stan.wiesOpisWypelniony}
            tytul="3. (Sołtys) Profil wsi w internecie"
            opis="Opis miejscowości na publicznej stronie wsi — mieszkańcy i goście widzą go od razu. Uzupełnij dla każdej zarządzanej wsi (min. ok. 30 znaków)."
            dzieci={
              <Link
                href="/panel/soltys/moja-wies"
                className="rounded-lg bg-green-800 px-3 py-1.5 text-white hover:bg-green-900"
              >
                Profil wsi — edycja
              </Link>
            }
          />
        ) : null}
      </ol>
      <p className="mt-4 text-xs text-stone-500">
        Więcej wskazówek:{" "}
        <Link href="/panel/mieszkaniec/pomoc" className="text-green-800 underline">
          pomoc — mieszkaniec
        </Link>
        {" · "}
        <Link href="/panel/soltys/pomoc" className="text-green-800 underline">
          pomoc — sołtys
        </Link>
        .
      </p>
    </section>
  );
}
