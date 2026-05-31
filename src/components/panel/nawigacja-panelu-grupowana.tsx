"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type LinkPanelu = {
  href: string;
  label: string;
  /** wyróżnienie */
  highlight?: boolean;
  /** liczba oczekujących (badge) */
  badge?: number;
};

export type GrupaNawigacjiPanelu = {
  id: string;
  tytul: string;
  linki: LinkPanelu[];
};

type Props = {
  grupy: GrupaNawigacjiPanelu[];
  ariaLabel: string;
};

function czyAktywny(href: string, pathname: string): boolean {
  if (href === "/panel/soltys" || href === "/panel/mieszkaniec") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NawigacjaPaneluGrupowana({ grupy, ariaLabel }: Props) {
  const pathname = usePathname() ?? "";

  return (
    <nav
      className="no-print panel-nawigacja-szklo mb-8 min-w-0 space-y-3 p-2 sm:p-3 lg:sticky lg:z-20 [top:var(--sticky-nav-offset)]"
      aria-label={ariaLabel}
    >
      {grupy.map((grupa) => (
        <div key={grupa.id}>
          <p className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-800/70">
            {grupa.tytul}
          </p>
          <div className="flex flex-wrap gap-1">
            {grupa.linki.map(({ href, label, highlight, badge }) => {
              const aktywny = czyAktywny(href, pathname);
              const pokazBadge = badge != null && badge > 0;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`nawigacja-pill inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs transition sm:px-3 sm:text-sm ${
                    aktywny
                      ? "bg-gradient-to-b from-green-800 to-green-900 font-medium text-white shadow-sm ring-1 ring-green-950/15"
                      : highlight
                        ? "bg-white/95 font-medium text-green-900 ring-1 ring-emerald-600/25 hover:bg-white hover:shadow-sm"
                        : "text-stone-700 hover:bg-white/90 hover:text-green-950 hover:shadow-sm"
                  }`}
                  aria-current={aktywny ? "page" : undefined}
                >
                  <span>{label}</span>
                  {pokazBadge ? (
                    <span
                      className={`min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold leading-none ${
                        aktywny ? "bg-white/25 text-white" : "bg-amber-500 text-white shadow-sm"
                      }`}
                      aria-label={`${badge} oczekujących`}
                    >
                      {badge > 99 ? "99+" : badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
