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

/** Kompaktowy dropdown w pasku nagłówka (mobile/tablet) — bez pełnoekranowego panelu. */
export function MenuMobilneWitryny({ linkiGlowne, linkiAkcje }: Props) {
  const pathname = usePathname() ?? "";
  const menuId = useId();
  const [otwarte, ustawOtwarte] = useState(false);

  const zamknij = useCallback(() => ustawOtwarte(false), []);

  useEffect(() => {
    if (!otwarte) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") zamknij();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [otwarte, zamknij]);

  useEffect(() => {
    zamknij();
  }, [pathname, zamknij]);

  useEffect(() => {
    if (!otwarte) return;
    const onScroll = () => zamknij();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [otwarte, zamknij]);

  const linkKlasa = (aktywny: boolean) =>
    `flex min-h-9 w-full items-center rounded-lg px-2.5 py-2 text-left text-sm font-medium transition ${
      aktywny ? "bg-green-800 text-white" : "text-green-950 hover:bg-green-50"
    }`;

  return (
    <div className="relative shrink-0 lg:hidden">
      <button
        type="button"
        className="site-nav-toggle flex h-10 w-10 flex-col items-center justify-center gap-1 rounded-lg border border-green-900/10 bg-white/80 p-2"
        aria-expanded={otwarte}
        aria-controls={menuId}
        aria-haspopup="true"
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
          className="fixed inset-0 z-40 border-0 bg-green-950/10"
          aria-label="Zamknij menu"
          tabIndex={-1}
          onClick={zamknij}
        />
      ) : null}

      <div
        id={menuId}
        role="menu"
        aria-label="Menu mobilne"
        hidden={!otwarte}
        className={`absolute right-0 top-[calc(100%+0.3rem)] z-50 w-[min(16.5rem,calc(100vw-2rem))] max-h-[min(70vh,17.5rem)] overflow-y-auto overscroll-contain rounded-xl border border-green-900/12 bg-white py-1 shadow-[0_8px_28px_rgba(45,90,45,0.16)] ${otwarte ? "block" : "hidden"}`}
      >
        {linkiGlowne.length > 0 ? (
          <ul className="px-1 py-0.5" role="none">
            {linkiGlowne.map(({ href, label }) => {
              const aktywny = czyAktywny(href, pathname);
              return (
                <li key={href} role="none">
                  <Link
                    href={href}
                    role="menuitem"
                    className={linkKlasa(aktywny)}
                    aria-current={aktywny ? "page" : undefined}
                    onClick={zamknij}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}

        {linkiAkcje.length > 0 ? (
          <ul className="border-t border-green-900/8 px-1 py-1" role="none">
            {linkiAkcje.map(({ href, label }, i) => {
              const ostatni = i === linkiAkcje.length - 1;
              const wyloguj = href === "/wyloguj";
              const rejestracja = ostatni && !wyloguj && label === "Rejestracja";
              const klasa =
                rejestracja
                  ? "mt-0.5 flex min-h-9 w-full items-center justify-center rounded-full bg-green-800 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-green-900"
                  : wyloguj
                    ? "flex min-h-9 w-full items-center rounded-lg px-2.5 py-2 text-left text-sm text-stone-600 hover:bg-stone-50"
                    : linkKlasa(false);
              return (
                <li key={href} role="none">
                  <Link href={href} role="menuitem" className={klasa} onClick={zamknij}>
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
