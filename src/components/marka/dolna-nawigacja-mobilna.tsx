"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  dolnaNawigacjaZKluczy,
  wczytajPreferencjeUiZLocalStorage,
  type KluczDolnejNawigacji,
} from "@/lib/uzytkownik/preferencje-ui";

function czyAktywny(href: string, pathname: string): boolean {
  if (href === "/panel") return pathname === "/panel" || pathname.startsWith("/panel/");
  if (href === "/panel/moje") return pathname.startsWith("/panel/moje");
  return pathname === href || pathname.startsWith(`${href}/`);
}

type Props = {
  zalogowany?: boolean;
  /** Klucze z serwera (metadane konta). */
  kluczePoczatkowe?: KluczDolnejNawigacji[];
};

/** Dolny pasek nawigacji na mobile — konfigurowalny w profilu. */
export function DolnaNawigacjaMobilna({ zalogowany = false, kluczePoczatkowe }: Props) {
  const pathname = usePathname() ?? "";
  const [klucze, ustawKlucze] = useState<KluczDolnejNawigacji[] | undefined>(kluczePoczatkowe);

  useEffect(() => {
    const ls = wczytajPreferencjeUiZLocalStorage();
    if (ls?.dolna_nawigacja?.length) {
      ustawKlucze(ls.dolna_nawigacja);
    } else if (kluczePoczatkowe?.length) {
      ustawKlucze(kluczePoczatkowe);
    }
  }, [kluczePoczatkowe]);

  useEffect(() => {
    function odswiez() {
      const ls = wczytajPreferencjeUiZLocalStorage();
      if (ls?.dolna_nawigacja?.length) ustawKlucze(ls.dolna_nawigacja);
    }
    window.addEventListener("naszawies-ui-prefs-changed", odswiez);
    return () => window.removeEventListener("naszawies-ui-prefs-changed", odswiez);
  }, []);

  const tabs = dolnaNawigacjaZKluczy(klucze, zalogowany);

  useEffect(() => {
    const nav = document.querySelector(".dolna-naw-mobilna");
    if (!nav) return;

    function sync() {
      const h = nav instanceof HTMLElement ? nav.offsetHeight : 0;
      document.documentElement.style.setProperty("--dolna-naw-offset", h > 0 ? `${h}px` : "0px");
    }

    sync();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(sync) : null;
    ro?.observe(nav);
    window.addEventListener("resize", sync);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", sync);
      document.documentElement.style.setProperty("--dolna-naw-offset", "0px");
    };
  }, []);

  return (
    <nav aria-label="Szybka nawigacja" className="dolna-naw-mobilna no-print">
      <div className="mx-auto flex max-w-lg items-stretch gap-0.5 px-2 pt-1.5">
        {tabs.map(({ href, label, ikona }) => {
          const aktywny = czyAktywny(href, pathname);
          return (
            <Link
              key={href}
              href={href}
              className={`dolna-naw-link nawigacja-pill ${aktywny ? "dolna-naw-link--aktywny" : ""}`}
              aria-current={aktywny ? "page" : undefined}
            >
              <span className="text-base leading-none" aria-hidden>
                {ikona}
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
