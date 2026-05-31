"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

type Tab = {
  href: string;
  label: string;
  ikona: string;
};

const TABS_ZALOGOWANY: Tab[] = [
  { href: "/panel", label: "Panel", ikona: "🏠" },
  { href: "/rynek", label: "Rynek", ikona: "🛒" },
  { href: "/mapa", label: "Mapa", ikona: "🗺️" },
  { href: "/szukaj", label: "Szukaj", ikona: "🔍" },
  { href: "/panel/moje", label: "Moje", ikona: "★" },
];

const TABS_PUBLICZNY: Tab[] = [
  { href: "/rynek", label: "Rynek", ikona: "🛒" },
  { href: "/szukaj", label: "Szukaj", ikona: "🔍" },
  { href: "/pomoc", label: "Pomoc", ikona: "💡" },
  { href: "/logowanie", label: "Login", ikona: "👤" },
];

function czyAktywny(href: string, pathname: string): boolean {
  if (href === "/panel") return pathname === "/panel" || pathname.startsWith("/panel/");
  if (href === "/panel/moje") return pathname.startsWith("/panel/moje");
  return pathname === href || pathname.startsWith(`${href}/`);
}

type Props = {
  zalogowany?: boolean;
};

/** Dolny pasek nawigacji na mobile — szybkie przełączanie modułów. */
export function DolnaNawigacjaMobilna({ zalogowany = false }: Props) {
  const pathname = usePathname() ?? "";
  const tabs = zalogowany ? TABS_ZALOGOWANY : TABS_PUBLICZNY;

  useEffect(() => {
    document.documentElement.style.setProperty("--dolna-naw-offset", "4.25rem");
    return () => {
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
