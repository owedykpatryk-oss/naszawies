"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const linki: { href: string; label: string }[] = [
  { href: "/panel", label: "Start" },
  { href: "/panel/pierwsze-kroki", label: "Pierwsze kroki" },
  { href: "/panel/profil", label: "Mój profil" },
  { href: "/panel/powiadomienia", label: "Powiadomienia" },
  { href: "/panel/mieszkaniec", label: "Mieszkaniec" },
  { href: "/panel/soltys", label: "Sołtys" },
  { href: "/panel/admin", label: "Admin" },
];

type PanelNawigacjaProps = {
  /** Gdy `false`, ukryj wejście do panelu sołtysa (użytkownik bez roli sołtysa / współadmina). */
  pokazLinkSoltysa?: boolean;
};

export function PanelNawigacja({ pokazLinkSoltysa = true }: PanelNawigacjaProps) {
  const pathname = usePathname();
  const linkiWidoczne = linki.filter(
    (l) => (l.href === "/panel/soltys" ? pokazLinkSoltysa : true)
  );

  return (
    <nav
      aria-label="Panel"
      className="mb-10 min-w-0 rounded-2xl border border-stone-200/70 bg-stone-100/40 p-1.5 shadow-inner ring-1 ring-stone-900/[0.03] sm:rounded-2xl"
    >
      <div className="-mx-0.5 flex flex-nowrap gap-1 overflow-x-auto px-0.5 pb-0.5 text-xs [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] sm:flex-wrap sm:gap-1.5 sm:overflow-visible sm:px-0 sm:pb-0 sm:text-sm">
        {linkiWidoczne.map(({ href, label }) => {
          const aktywny =
            href === "/panel" ? pathname === "/panel" : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={
                aktywny
                  ? "nawigacja-pill flex min-h-[44px] shrink-0 items-center rounded-xl bg-gradient-to-b from-green-800 to-green-900 px-2.5 py-2 font-medium text-white shadow-sm ring-1 ring-green-950/20 sm:min-h-0 sm:px-3.5"
                  : "nawigacja-pill flex min-h-[44px] shrink-0 items-center rounded-xl px-2.5 py-2 text-stone-700 transition hover:bg-white/90 hover:text-green-950 hover:shadow-sm sm:min-h-0 sm:px-3.5"
              }
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
