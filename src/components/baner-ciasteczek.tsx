"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const KLUCZ = "naszawies_zgoda_ciasteczka_v1";

/** Minimalna informacja o cookies (sesja, brak reklam) — wg LEGAL.md */
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

  if (!widoczny) return null;

  return (
    <div
      id="baner-ciasteczek"
      role="dialog"
      aria-labelledby="baner-ciasteczek-tytul"
      className="fixed bottom-0 left-0 right-0 z-[200] border-t border-stone-200 bg-stone-50/95 px-4 py-3 shadow-lg backdrop-blur-sm md:px-8"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p id="baner-ciasteczek-tytul" className="text-sm leading-relaxed text-stone-800">
          Używamy wyłącznie niezbędnych plików cookie (np. sesja po zalogowaniu). Nie
          stosujemy cookies reklamowych. Analityka (jeśli włączona) działa bez plików
          cookie zgodnie z ustawieniami Plausible.{" "}
          <Link href="/polityka-prywatnosci" className="font-semibold text-green-800 underline">
            Polityka prywatności
          </Link>
          .
        </p>
        <button
          type="button"
          className="shrink-0 rounded-full bg-green-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-900"
          onClick={() => {
            try {
              localStorage.setItem(KLUCZ, "1");
            } catch {
              /* ignore */
            }
            ustawWidoczny(false);
          }}
        >
          Rozumiem
        </button>
      </div>
    </div>
  );
}
