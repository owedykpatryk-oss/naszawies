"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { IkonaDolnejNawigacji } from "@/components/marka/ikony-dolnej-nawigacji";
import {
  dolnaNawigacjaZKluczy,
  wczytajPreferencjeUiZLocalStorage,
  type KluczDolnejNawigacji,
} from "@/lib/uzytkownik/preferencje-ui";

function czyAktywny(href: string, pathname: string): boolean {
  if (href === "/panel") return pathname === "/panel" || pathname.startsWith("/panel/");
  if (href === "/panel/moje") return pathname.startsWith("/panel/moje");
  if (href === "/mapa") return pathname === "/mapa" || pathname.startsWith("/mapa/");
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
      <div className="mx-auto flex max-w-lg items-end gap-0.5 px-1.5 pt-1">
        {tabs.map(({ href, label, klucz }) => {
          const aktywny = czyAktywny(href, pathname);
          const centralnaMapa = klucz === "mapa";
          return (
            <Link
              key={href}
              href={href}
              className={`dolna-naw-link nawigacja-pill ${centralnaMapa ? "dolna-naw-link--mapa" : ""} ${aktywny ? "dolna-naw-link--aktywny" : ""}`}
              aria-current={aktywny ? "page" : undefined}
            >
              <span className={`dolna-naw-ikona-wrap ${centralnaMapa ? "dolna-naw-ikona-wrap--mapa" : ""}`}>
                <IkonaDolnejNawigacji klucz={klucz} />
              </span>
              <span className="dolna-naw-etykieta">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
