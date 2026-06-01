"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { KluczSekcjiWsi, PasekNawigacjiWsi } from "@/lib/wies/ustawienia-wsi";

export type ZakladkaProfiluWsi = {
  href: string;
  label: string;
  ikona?: string;
  klucz?: KluczSekcjiWsi;
};

type Props = {
  zakladki: ZakladkaProfiluWsi[];
  pasek?: PasekNawigacjiWsi;
};

/** Zakładki kotwicowe profilu wsi z ikonami, sticky i menu „Więcej”. */
export function WiesZakladkiProfilu({ zakladki, pasek }: Props) {
  const sticky = pasek?.sticky_zakladki !== false;
  const maxWidocznych = pasek?.max_zakladek_widocznych ?? 0;
  const widoczne =
    maxWidocznych > 0 && zakladki.length > maxWidocznych
      ? zakladki.slice(0, maxWidocznych)
      : zakladki;
  const ukryte =
    maxWidocznych > 0 && zakladki.length > maxWidocznych ? zakladki.slice(maxWidocznych) : [];

  const [aktywna, ustawAktywna] = useState(zakladki[0]?.href ?? "");
  const [menuWiecej, ustawMenuWiecej] = useState(false);
  const obserwatorRef = useRef<IntersectionObserver | null>(null);
  const rafRef = useRef<number | null>(null);
  const widoczneRef = useRef<Map<string, number>>(new Map());
  const ostatniaAktualizacjaRef = useRef(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const przejdz = useCallback((e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    e.preventDefault();
    const cel = document.querySelector(hash);
    if (cel) {
      const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const rawOffset = getComputedStyle(document.documentElement).getPropertyValue("--sticky-nav-offset").trim();
      let naglowek = 60;
      if (rawOffset.endsWith("rem")) naglowek = parseFloat(rawOffset) * rootPx;
      else if (rawOffset.endsWith("px")) naglowek = parseFloat(rawOffset);
      const pasekZakladek = document.querySelector<HTMLElement>(".wies-zakladki-sticky");
      const margines = naglowek + (pasekZakladek?.offsetHeight ?? 0) + 10;
      const top = cel.getBoundingClientRect().top + window.scrollY - margines;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      history.replaceState(null, "", hash);
      ustawAktywna(hash);
    }
    ustawMenuWiecej(false);
  }, []);

  useEffect(() => {
    if (zakladki.length === 0) return;

    const idSekcji = zakladki.map((z) => z.href.replace("#", ""));

    function ustawAktywnaZMapy() {
      const widoczneMap = widoczneRef.current;
      if (widoczneMap.size === 0) return;
      let najlepszy = "";
      let najwyzszy = 0;
      for (const [id, ratio] of Array.from(widoczneMap.entries())) {
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

  useEffect(() => {
    if (!menuWiecej) return;
    function zamknij(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        ustawMenuWiecej(false);
      }
    }
    document.addEventListener("click", zamknij);
    return () => document.removeEventListener("click", zamknij);
  }, [menuWiecej]);

  if (zakladki.length === 0) return null;

  function pill(tab: ZakladkaProfiluWsi, aktywny: boolean) {
    return (
      <a
        key={tab.href}
        href={tab.href}
        onClick={(e) => przejdz(e, tab.href)}
        className={`wies-zakladka shrink-0 snap-start inline-flex min-h-[40px] max-w-[9.5rem] items-center gap-1 rounded-full border px-2.5 py-2 text-xs font-medium shadow-sm transition-[colors,transform] duration-200 sm:max-w-none sm:px-3 ${
          aktywny ? "wies-zakladka--aktywna" : ""
        }`}
        aria-current={aktywny ? "true" : undefined}
      >
        {tab.ikona ? (
          <span className="text-sm leading-none" aria-hidden>
            {tab.ikona}
          </span>
        ) : null}
        <span className="truncate sm:whitespace-normal">{tab.label}</span>
      </a>
    );
  }

  const navInner = (
    <div className="flex flex-nowrap items-center gap-1.5 overflow-x-auto overscroll-x-contain pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
      {widoczne.map((tab) => pill(tab, aktywna === tab.href))}
      {ukryte.length > 0 ? (
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => ustawMenuWiecej((v) => !v)}
            className={`wies-zakladka inline-flex min-h-[40px] items-center gap-1 rounded-full border px-2.5 py-2 text-xs font-medium shadow-sm ${
              ukryte.some((t) => aktywna === t.href) ? "wies-zakladka--aktywna" : ""
            }`}
            aria-expanded={menuWiecej}
            aria-haspopup="true"
          >
            Więcej <span aria-hidden>▾</span>
          </button>
          {menuWiecej ? (
            <ul
              className="absolute right-0 top-full z-30 mt-1 min-w-[10rem] rounded-xl border border-stone-200 bg-white py-1 shadow-lg"
              role="menu"
            >
              {ukryte.map((tab) => (
                <li key={tab.href} role="none">
                  <a
                    href={tab.href}
                    role="menuitem"
                    onClick={(e) => przejdz(e, tab.href)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-stone-800 hover:bg-emerald-50"
                  >
                    {tab.ikona ? <span aria-hidden>{tab.ikona}</span> : null}
                    {tab.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  if (sticky) {
    return (
      <div className="wies-zakladki-sticky -mx-4 mt-4 sm:-mx-0">
        <nav
          className="wies-zakladki-nav rounded-xl border px-2 py-2 shadow-sm backdrop-blur-md sm:px-2.5"
          aria-label="Sekcje profilu wsi"
        >
          {navInner}
        </nav>
      </div>
    );
  }

  return (
    <nav
      className="mt-4 border-b border-stone-200/90 pb-3"
      aria-label="Sekcje profilu wsi"
    >
      {navInner}
    </nav>
  );
}
