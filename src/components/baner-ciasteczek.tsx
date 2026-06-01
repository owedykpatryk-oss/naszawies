"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { zapiszZgodeBaneruCookies } from "@/app/(site)/panel/profil/akcje-zgody-cookies";
import { WERSJA_BANERU_COOKIES } from "@/lib/rodo/wersje-dokumentow";

const KLUCZ = `naszawies_zgoda_ciasteczka_${WERSJA_BANERU_COOKIES}`;

/** Informacja o cookies niezbędnych + zapis zgody (localStorage; opcjonalnie w bazie po zalogowaniu). */
export function BanerCiasteczek() {
  const [widoczny, ustawWidoczny] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && !localStorage.getItem(KLUCZ)) {
        ustawWidoczny(true);
      }
    } catch {
      ustawWidoczny(true);
    }
  }, []);

  useEffect(() => {
    if (!widoczny) {
      document.documentElement.style.removeProperty("--app-bottom-bar-offset");
      return;
    }
    const sync = () => {
      const el = document.getElementById("baner-ciasteczek");
      const h = el?.offsetHeight ?? 0;
      document.documentElement.style.setProperty("--app-bottom-bar-offset", `${h}px`);
    };
    sync();
    window.addEventListener("resize", sync);
    return () => {
      window.removeEventListener("resize", sync);
      document.documentElement.style.removeProperty("--app-bottom-bar-offset");
    };
  }, [widoczny]);

  function potwierdz() {
    try {
      localStorage.setItem(KLUCZ, new Date().toISOString());
    } catch {
      /* ignore */
    }
    void zapiszZgodeBaneruCookies();
    ustawWidoczny(false);
  }

  if (!widoczny) return null;

  return (
    <div
      id="baner-ciasteczek"
      role="dialog"
      aria-labelledby="baner-ciasteczek-tytul"
      className="fixed bottom-0 left-0 right-0 z-[200] border-t border-stone-200 bg-stone-50/95 px-3 py-2 shadow-lg backdrop-blur-sm sm:px-4 sm:py-3 md:px-8"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <p id="baner-ciasteczek-tytul" className="text-xs leading-snug text-stone-800 sm:text-sm sm:leading-relaxed">
          <span className="sm:hidden">Cookies: sesja (niezbędne). Bez reklam. </span>
          <span className="hidden sm:inline">
            Używamy wyłącznie niezbędnych plików cookie (sesja po zalogowaniu, bezpieczeństwo). Nie stosujemy
            cookies reklamowych ani profilowania. Statystyka odwiedzin (Plausible) — bez cookies, zgodnie z
            ustawieniami dostawcy. Szczegóły:{" "}
          </span>
          <Link href="/polityka-prywatnosci#cookies" className="font-semibold text-green-800 underline">
            Polityka — sekcja cookies
          </Link>
          .
        </p>
        <button
          type="button"
          className="shrink-0 self-end rounded-full bg-green-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-900 sm:px-5 sm:py-2.5"
          onClick={potwierdz}
        >
          Rozumiem
        </button>
      </div>
    </div>
  );
}
