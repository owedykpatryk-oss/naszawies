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
      className="no-print mb-8 min-w-0 space-y-3 rounded-2xl border border-stone-200/60 bg-stone-100/35 p-2 shadow-inner ring-1 ring-stone-900/[0.03] lg:sticky lg:z-20 sm:p-3 [top:var(--sticky-nav-offset)]"
      aria-label={ariaLabel}
    >
      {grupy.map((grupa) => (
        <div key={grupa.id}>
          <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-wider text-stone-500">{grupa.tytul}</p>
          <div className="flex flex-wrap gap-1">
            {grupa.linki.map(({ href, label, highlight, badge }) => {
              const aktywny = czyAktywny(href, pathname);
              const pokazBadge = badge != null && badge > 0;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs transition sm:px-3 sm:text-sm ${
                    aktywny
                      ? "bg-green-800 font-medium text-white shadow-sm"
                      : highlight
                        ? "bg-white/90 font-medium text-green-900 ring-1 ring-green-700/30 hover:bg-white"
                        : "text-stone-700 hover:bg-white/90 hover:text-green-950 hover:shadow-sm"
                  }`}
                  aria-current={aktywny ? "page" : undefined}
                >
                  <span>{label}</span>
                  {pokazBadge ? (
                    <span
                      className={`min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold leading-none ${
                        aktywny ? "bg-white/25 text-white" : "bg-amber-500 text-white"
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
