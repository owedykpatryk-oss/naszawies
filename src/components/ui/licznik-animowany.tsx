"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  wartosc: number;
  className?: string;
  /** Sufiks po liczbie (np. „+”). */
  sufiks?: string;
};

function formatuj(n: number): string {
  return n.toLocaleString("pl-PL");
}

/** Animacja liczby 0 → wartość po wejściu w widok. */
export function LicznikAnimowany({ wartosc, className = "", sufiks = "" }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [wyswietl, ustawWyswietl] = useState(0);
  const uruchomiono = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || wartosc <= 0) {
      ustawWyswietl(wartosc);
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      ustawWyswietl(wartosc);
      return;
    }

    const obs = new IntersectionObserver(
      ([wpis]) => {
        if (!wpis?.isIntersecting || uruchomiono.current) return;
        uruchomiono.current = true;
        obs.disconnect();

        const start = performance.now();
        const czas = Math.min(1400, 400 + wartosc * 8);

        function klatka(ts: number) {
          const t = Math.min(1, (ts - start) / czas);
          const eased = 1 - (1 - t) ** 3;
          ustawWyswietl(Math.round(wartosc * eased));
          if (t < 1) requestAnimationFrame(klatka);
        }
        requestAnimationFrame(klatka);
      },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [wartosc]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`.trim()}>
      {formatuj(wyswietl)}
      {sufiks}
    </span>
  );
}
