"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { czyAktywnyHrefPanelu, klasaPillNawigacji } from "@/lib/panel/klasy-nawigacji-pill";

export type LinkPanelu = {
  href: string;
  label: string;
  highlight?: boolean;
  badge?: number;
  ikona?: string;
};

export type GrupaNawigacjiPanelu = {
  id: string;
  tytul: string;
  opis?: string;
  linki: LinkPanelu[];
};

type Props = {
  grupy: GrupaNawigacjiPanelu[];
  ariaLabel: string;
  szybkieLinki?: LinkPanelu[];
};

function LinkiGrupy({
  linki,
  pathname,
  search,
}: {
  linki: LinkPanelu[];
  pathname: string;
  search: string;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {linki.map(({ href, label, highlight, badge }) => {
        const aktywny = czyAktywnyHrefPanelu(href, pathname, search);
        const pokazBadge = badge != null && badge > 0;
        return (
          <Link
            key={href}
            href={href}
            className={klasaPillNawigacji(aktywny, highlight)}
            aria-current={aktywny ? "page" : undefined}
          >
            <span>{label}</span>
            {pokazBadge ? (
              <span
                className={`min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold leading-none ${
                  aktywny ? "bg-white/25 text-white" : "bg-amber-500 text-white shadow-sm"
                }`}
              >
                {badge > 99 ? "99+" : badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}

export function NawigacjaPaneluGrupowana({ grupy, ariaLabel, szybkieLinki }: Props) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ?? "";

  const domyslnieOtwarte = useMemo(() => {
    const ids = new Set<string>();
    for (const g of grupy) {
      if (g.linki.some((l) => czyAktywnyHrefPanelu(l.href, pathname, search))) ids.add(g.id);
    }
    if (ids.size === 0 && grupy[0]) ids.add(grupy[0].id);
    return ids;
  }, [grupy, pathname, search]);

  const [otwarteMobile, ustawOtwarteMobile] = useState<Set<string>>(() => new Set(domyslnieOtwarte));

  useEffect(() => {
    ustawOtwarteMobile((prev) => {
      const next = new Set(prev);
      Array.from(domyslnieOtwarte).forEach((id) => next.add(id));
      return next;
    });
  }, [domyslnieOtwarte]);

  return (
    <nav
      className="no-print panel-nawigacja-szklo mb-8 min-w-0 lg:sticky lg:z-20 [top:var(--sticky-nav-offset)]"
      aria-label={ariaLabel}
    >
      {szybkieLinki && szybkieLinki.length > 0 ? (
        <div className="border-b border-stone-200/60 p-2 sm:p-3">
          <p className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-800/80">
            Szybkie skróty
          </p>
          <div className="-mx-0.5 flex flex-nowrap gap-1 overflow-x-auto px-0.5 pb-0.5 [-webkit-overflow-scrolling:touch] sm:flex-wrap sm:overflow-visible">
            {szybkieLinki.map((link) => {
              const aktywny = czyAktywnyHrefPanelu(link.href, pathname, search);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={klasaPillNawigacji(aktywny, link.highlight, true)}
                  aria-current={aktywny ? "page" : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Desktop: wszystkie grupy rozwinięte */}
      <div className="hidden space-y-3 p-2 sm:p-3 lg:block">
        {grupy.map((grupa) => (
          <div key={grupa.id}>
            <p className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-800/70">
              {grupa.tytul}
            </p>
            {grupa.opis ? (
              <p className="mb-1.5 px-1 text-[11px] leading-snug text-stone-500">{grupa.opis}</p>
            ) : null}
            <LinkiGrupy linki={grupa.linki} pathname={pathname} search={search} />
          </div>
        ))}
      </div>

      {/* Mobile: zwijane sekcje */}
      <div className="space-y-1 p-2 sm:p-3 lg:hidden">
        {grupy.map((grupa) => {
          const otwarta = otwarteMobile.has(grupa.id);
          return (
            <details
              key={grupa.id}
              className="rounded-xl border border-stone-200/50 bg-white/30 open:border-stone-200/90 open:bg-white/50"
              open={otwarta}
            >
              <summary className="cursor-pointer list-none px-2 py-2.5 [&::-webkit-details-marker]:hidden">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-800/80">
                  {grupa.tytul}
                </span>
                {grupa.opis ? (
                  <span className="mt-0.5 block text-[11px] font-normal text-stone-500">{grupa.opis}</span>
                ) : null}
              </summary>
              <div className="px-1 pb-2">
                <LinkiGrupy linki={grupa.linki} pathname={pathname} search={search} />
              </div>
            </details>
          );
        })}
      </div>
    </nav>
  );
}
