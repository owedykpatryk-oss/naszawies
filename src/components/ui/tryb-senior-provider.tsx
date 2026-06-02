"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

const KLUCZ = "naszawies-ui-mode";
const KLUCZ_KONTRAST = "naszawies-ui-kontrast";

export type TrybUi = "standard" | "senior";
export type TrybKontrastu = "standard" | "wysoki";

const Ctx = createContext<{
  tryb: TrybUi;
  kontrast: TrybKontrastu;
  ustawTryb: (t: TrybUi) => void;
  ustawKontrast: (k: TrybKontrastu) => void;
  przelacz: () => void;
} | null>(null);

export function TrybSeniorProvider({ children, poczatkowy }: { children: ReactNode; poczatkowy?: TrybUi }) {
  const [tryb, ustawTrybStan] = useState<TrybUi>(poczatkowy ?? "standard");
  const [kontrast, ustawKontrastStan] = useState<TrybKontrastu>("standard");

  useEffect(() => {
    try {
      const z = localStorage.getItem(KLUCZ);
      if (z === "senior" || z === "standard") ustawTrybStan(z);
      const k = localStorage.getItem(KLUCZ_KONTRAST);
      if (k === "wysoki" || k === "standard") ustawKontrastStan(k);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("tryb-senior", tryb === "senior");
    document.documentElement.dataset.trybDostepnosci = kontrast === "wysoki" ? "wysoki-kontrast" : "standard";
    try {
      localStorage.setItem(KLUCZ, tryb);
      localStorage.setItem(KLUCZ_KONTRAST, kontrast);
    } catch {
      /* ignore */
    }
  }, [tryb, kontrast]);

  const ustawTryb = useCallback((t: TrybUi) => ustawTrybStan(t), []);
  const ustawKontrast = useCallback((k: TrybKontrastu) => ustawKontrastStan(k), []);
  const przelacz = useCallback(() => ustawTrybStan((p) => (p === "senior" ? "standard" : "senior")), []);

  return (
    <Ctx.Provider value={{ tryb, kontrast, ustawTryb, ustawKontrast, przelacz }}>{children}</Ctx.Provider>
  );
}

export function useTrybSenior() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useTrybSenior poza TrybSeniorProvider");
  return c;
}

export function PrzelacznikTrybuSeniora({ className = "" }: { className?: string }) {
  const { tryb, przelacz } = useTrybSenior();
  return (
    <button
      type="button"
      onClick={przelacz}
      className={`rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-800 shadow-sm hover:bg-stone-50 ${className}`}
      aria-pressed={tryb === "senior"}
    >
      {tryb === "senior" ? "Tryb standardowy" : "Tryb uproszczony (większy tekst)"}
    </button>
  );
}

export function PrzelacznikKontrastu({ className = "" }: { className?: string }) {
  const { kontrast, ustawKontrast } = useTrybSenior();
  return (
    <button
      type="button"
      onClick={() => ustawKontrast(kontrast === "wysoki" ? "standard" : "wysoki")}
      className={`rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-800 shadow-sm hover:bg-stone-50 ${className}`}
      aria-pressed={kontrast === "wysoki"}
    >
      {kontrast === "wysoki" ? "Kontrast standardowy" : "Wysoki kontrast"}
    </button>
  );
}
