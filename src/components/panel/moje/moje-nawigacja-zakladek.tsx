"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ZAKLADKI = [
  { href: "/panel/moje", label: "Przegląd", dokladnie: true },
  { href: "/panel/moje/wies", label: "Moje wsie", dokladnie: false },
  { href: "/panel/moje/samorzad", label: "Moja gmina", dokladnie: false },
  { href: "/panel/moje/organizacje", label: "Parafia / KGW / OSP", dokladnie: false },
  { href: "/panel/moje/ulubione", label: "Ulubione", dokladnie: false },
] as const;

export function MojeNawigacjaZakladek() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Moje — zakładki"
      className="mb-8 min-w-0 rounded-2xl border border-emerald-900/10 bg-gradient-to-br from-[#f5f9f0]/80 via-white to-white p-1.5 shadow-sm ring-1 ring-stone-900/[0.02]"
    >
      <div className="-mx-0.5 flex flex-nowrap gap-1 overflow-x-auto px-0.5 pb-0.5 text-xs [-webkit-overflow-scrolling:touch] sm:flex-wrap sm:gap-1.5 sm:text-sm">
        {ZAKLADKI.map(({ href, label, dokladnie }) => {
          const aktywny = dokladnie ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={
                aktywny
                  ? "nawigacja-pill flex min-h-[44px] shrink-0 items-center rounded-xl bg-gradient-to-b from-green-800 to-green-900 px-3 py-2 font-medium text-white shadow-sm sm:min-h-0"
                  : "nawigacja-pill flex min-h-[44px] shrink-0 items-center rounded-xl px-3 py-2 text-stone-700 transition hover:bg-emerald-50/80 hover:text-green-950 sm:min-h-0"
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
