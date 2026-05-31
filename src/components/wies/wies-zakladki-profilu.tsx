"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ZakladkaProfiluWsi = {
  href: string;
  label: string;
};

type Props = {
  zakladki: ZakladkaProfiluWsi[];
};

/** Zakładki kotwicowe profilu wsi z podświetleniem aktywnej sekcji przy scrollu. */
export function WiesZakladkiProfilu({ zakladki }: Props) {
  const [aktywna, ustawAktywna] = useState(zakladki[0]?.href ?? "");
  const obserwatorRef = useRef<IntersectionObserver | null>(null);
  const rafRef = useRef<number | null>(null);
  const widoczneRef = useRef<Map<string, number>>(new Map());
  const ostatniaAktualizacjaRef = useRef(0);

  const przejdz = useCallback((e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    e.preventDefault();
    const cel = document.querySelector(hash);
    if (cel) {
      cel.scrollIntoView({ behavior: "auto", block: "start" });
      history.replaceState(null, "", hash);
      ustawAktywna(hash);
    }
  }, []);

  useEffect(() => {
    if (zakladki.length === 0) return;

    const idSekcji = zakladki.map((z) => z.href.replace("#", ""));

    function ustawAktywnaZMapy() {
      const widoczne = widoczneRef.current;
      if (widoczne.size === 0) return;
      let najlepszy = "";
      let najwyzszy = 0;
      for (const [id, ratio] of Array.from(widoczne.entries())) {
        if (ratio >= najwyzszy) {
          najwyzszy = ratio;
          najlepszy = id;
        }
      }
      if (najlepszy) ustawAktywna(`#${najlepszy}`);
    }

    function zaplanujAktualizacje() {
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const teraz = performance.now();
        if (teraz - ostatniaAktualizacjaRef.current < 120) return;
        ostatniaAktualizacjaRef.current = teraz;
        ustawAktywnaZMapy();
      });
    }

    obserwatorRef.current?.disconnect();
    obserwatorRef.current = new IntersectionObserver(
      (wpisy) => {
        for (const wpis of wpisy) {
          const id = wpis.target.id;
          if (!id) continue;
          if (wpis.isIntersecting) {
            widoczneRef.current.set(id, wpis.intersectionRatio);
          } else {
            widoczneRef.current.delete(id);
          }
        }
        zaplanujAktualizacje();
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.5] },
    );

    const obserwator = obserwatorRef.current;
    const obserwowane: HTMLElement[] = [];

    function podlacz() {
      for (const id of idSekcji) {
        const el = document.getElementById(id);
        if (el && !obserwowane.includes(el)) {
          obserwator.observe(el);
          obserwowane.push(el);
        }
      }
    }

    podlacz();
    const opoznienie = window.setTimeout(podlacz, 400);

    return () => {
      window.clearTimeout(opoznienie);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      obserwator.disconnect();
      widoczneRef.current.clear();
    };
  }, [zakladki]);

  if (zakladki.length === 0) return null;

  return (
    <nav
      className="mt-4 flex flex-nowrap gap-1.5 overflow-x-auto border-b border-stone-200/90 pb-3 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]"
      aria-label="Sekcje profilu wsi"
    >
      {zakladki.map((tab) => {
        const aktywny = aktywna === tab.href;
        return (
          <a
            key={tab.href}
            href={tab.href}
            onClick={(e) => przejdz(e, tab.href)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm transition-colors ${
              aktywny
                ? "border-green-700 bg-green-800 text-white"
                : "border-stone-200 bg-white text-green-900 hover:border-green-300 hover:bg-emerald-50"
            }`}
            aria-current={aktywny ? "true" : undefined}
          >
            {tab.label}
          </a>
        );
      })}
    </nav>
  );
}
