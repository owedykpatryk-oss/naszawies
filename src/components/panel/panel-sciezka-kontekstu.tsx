"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { budujOkruszkiPanelu } from "@/lib/panel/etykiety-sciezek-panelu";

/** Okruszki: gdzie jesteś w panelu (pod główną nawigacją modułu). */
export function PanelSciezkaKontekstu() {
  const pathname = usePathname() ?? "";
  const okruszki = budujOkruszkiPanelu(pathname);

  if (okruszki.length <= 1) return null;

  return (
    <nav aria-label="Ścieżka w panelu" className="no-print mb-4 text-xs text-stone-600 sm:text-sm">
      <ol className="flex flex-wrap items-center gap-1">
        {okruszki.map((o, i) => {
          const ostatni = i === okruszki.length - 1;
          return (
            <li key={o.href} className="flex items-center gap-1">
              {i > 0 ? (
                <span className="text-stone-400" aria-hidden>
                  /
                </span>
              ) : null}
              {ostatni ? (
                <span className="font-medium text-green-950" aria-current="page">
                  {o.label}
                </span>
              ) : (
                <Link href={o.href} className="text-green-800 underline decoration-emerald-700/30 hover:text-green-950">
                  {o.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
