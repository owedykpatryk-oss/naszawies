"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";

type LinkNav = { href: string; label: string };

function czyAktywny(href: string, pathname: string): boolean {
  if (href === "/panel") return pathname === "/panel" || pathname.startsWith("/panel/");
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type Props = {
  linkiGlowne: LinkNav[];
  linkiAkcje: LinkNav[];
};

/** Kompaktowe menu hamburger na mobile — jeden rząd nagłówka zamiast dwóch pasków przewijanych. */
export function MenuMobilneWitryny({ linkiGlowne, linkiAkcje }: Props) {
  const pathname = usePathname() ?? "";
  const menuId = useId();
  const [otwarte, ustawOtwarte] = useState(false);

  const zamknij = useCallback(() => ustawOtwarte(false), []);

  useEffect(() => {
    if (!otwarte) {
      document.body.classList.remove("site-nav-open");
      return;
    }
    document.body.classList.add("site-nav-open");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") zamknij();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("site-nav-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [otwarte, zamknij]);

  useEffect(() => {
    zamknij();
  }, [pathname, zamknij]);

  return (
    <>
      <button
        type="button"
        className="site-nav-toggle flex h-10 w-10 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-green-900/10 bg-white/80 p-2 lg:hidden"
        aria-expanded={otwarte}
        aria-controls={menuId}
        aria-label={otwarte ? "Zamknij menu" : "Otwórz menu nawigacji"}
        onClick={() => ustawOtwarte((v) => !v)}
      >
        <span className="sr-only">{otwarte ? "Zamknij menu" : "Menu"}</span>
        <span
          aria-hidden
          className={`block h-0.5 w-5 rounded-full bg-green-900 transition ${otwarte ? "translate-y-1.5 rotate-45" : ""}`}
        />
        <span
          aria-hidden
          className={`block h-0.5 w-5 rounded-full bg-green-900 transition ${otwarte ? "opacity-0" : ""}`}
        />
        <span
          aria-hidden
          className={`block h-0.5 w-5 rounded-full bg-green-900 transition ${otwarte ? "-translate-y-1.5 -rotate-45" : ""}`}
        />
      </button>

      {otwarte ? (
        <button
          type="button"
          className="site-nav-backdrop fixed inset-0 top-[var(--site-header-height,3.5rem)] z-40 border-0 bg-green-950/25 backdrop-blur-[2px] lg:hidden"
          aria-label="Zamknij menu"
          onClick={zamknij}
        />
      ) : null}

      <div
        id={menuId}
        role="navigation"
        aria-label="Menu mobilne"
        hidden={!otwarte}
        className={`site-nav-sheet fixed inset-x-0 top-[var(--site-header-height,3.5rem)] z-50 max-h-[min(52vh,22rem)] overflow-y-auto overscroll-contain border-b border-green-900/10 bg-[#fcfbf7]/98 px-3 py-2 shadow-lg backdrop-blur-md lg:hidden ${otwarte ? "block" : "hidden"}`}
      >
        {linkiGlowne.length > 0 ? (
          <div className="mb-2">
            <p className="mb-1 px-1 text-[0.65rem] font-bold uppercase tracking-wider text-stone-500">
              Nawigacja
            </p>
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
              {linkiGlowne.map(({ href, label }) => {
                const aktywny = czyAktywny(href, pathname);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex min-h-10 items-center justify-center rounded-lg px-2 py-2 text-center text-sm font-medium transition ${
                      aktywny
                        ? "bg-green-800 text-white"
                        : "text-green-950 hover:bg-green-50"
                    }`}
                    aria-current={aktywny ? "page" : undefined}
                    onClick={zamknij}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}

        {linkiAkcje.length > 0 ? (
          <div className="border-t border-green-900/8 pt-2">
            <p className="mb-1 px-1 text-[0.65rem] font-bold uppercase tracking-wider text-stone-500">
              Konto
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {linkiAkcje.map(({ href, label }, i) => {
                const ostatni = i === linkiAkcje.length - 1;
                const wyloguj = href === "/wyloguj";
                const rejestracja = ostatni && !wyloguj && label === "Rejestracja";
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex min-h-10 items-center justify-center rounded-full border px-3 py-2 text-center text-sm font-medium transition ${
                      rejestracja
                        ? "col-span-2 border-green-800 bg-green-800 text-white hover:bg-green-900"
                        : wyloguj
                          ? "border-stone-200 text-stone-600 hover:bg-stone-50"
                          : "border-green-900/15 text-green-950 hover:bg-green-50"
                    }`}
                    onClick={zamknij}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
