"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type LinkNav = { href: string; label: string };

function czyAktywny(href: string, pathname: string): boolean {
  if (href === "/panel") return pathname === "/panel";
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type Props = {
  linki: LinkNav[];
};

/** Główna nawigacja witryny z podświetleniem aktywnej zakładki. */
export function NawigacjaGlownaKlient({ linki }: Props) {
  const pathname = usePathname() ?? "";

  return (
    <nav
      aria-label="Główna nawigacja"
      className="flex min-w-0 flex-nowrap items-center gap-1 overflow-x-auto rounded-xl border border-green-900/10 bg-white/90 p-1.5 shadow-sm ring-1 ring-stone-900/[0.03] [scrollbar-width:none] sm:gap-1.5 sm:px-2 [&::-webkit-scrollbar]:hidden"
    >
      {linki.map(({ href, label }) => {
        const aktywny = czyAktywny(href, pathname);
        return (
          <Link
            key={href}
            href={href}
            className={`site-naw-pill nawigacja-pill ${aktywny ? "site-naw-pill--aktywny" : ""}`}
            aria-current={aktywny ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
