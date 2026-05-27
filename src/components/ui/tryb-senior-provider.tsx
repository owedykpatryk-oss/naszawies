"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

const KLUCZ = "naszawies-ui-mode";

type TrybUi = "standard" | "senior";

const Ctx = createContext<{
  tryb: TrybUi;
  ustawTryb: (t: TrybUi) => void;
  przelacz: () => void;
} | null>(null);

export function TrybSeniorProvider({ children, poczatkowy }: { children: ReactNode; poczatkowy?: TrybUi }) {
  const [tryb, ustawTrybStan] = useState<TrybUi>(poczatkowy ?? "standard");

  useEffect(() => {
    try {
      const z = localStorage.getItem(KLUCZ);
      if (z === "senior" || z === "standard") ustawTrybStan(z);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("tryb-senior", tryb === "senior");
    try {
      localStorage.setItem(KLUCZ, tryb);
    } catch {
      /* ignore */
    }
  }, [tryb]);

  const ustawTryb = useCallback((t: TrybUi) => ustawTrybStan(t), []);
  const przelacz = useCallback(() => ustawTrybStan((p) => (p === "senior" ? "standard" : "senior")), []);

  return <Ctx.Provider value={{ tryb, ustawTryb, przelacz }}>{children}</Ctx.Provider>;
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
