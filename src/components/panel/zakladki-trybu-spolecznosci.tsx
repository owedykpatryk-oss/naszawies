"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { TRYBY_PRACY_OPCJE, type TrybOrganizacji } from "@/app/(site)/panel/soltys/spolecznosc/tryby-pracy";

type Props = {
  aktywnyTryb: TrybOrganizacji;
};

/** Widoczne zakładki trybów pracy w module Społeczność (URL ?tryb=). */
export function ZakladkiTrybuSpolecznosci({ aktywnyTryb }: Props) {
  const pathname = usePathname() ?? "/panel/soltys/spolecznosc";
  const searchParams = useSearchParams();

  function hrefDlaTrybu(tryb: TrybOrganizacji): string {
    const p = new URLSearchParams(searchParams?.toString() ?? "");
    if (tryb === "ogolny") p.delete("tryb");
    else p.set("tryb", tryb);
    const q = p.toString();
    return q ? `${pathname}?${q}` : pathname;
  }

  return (
    <nav
      className="flex flex-wrap gap-1.5 rounded-2xl border border-indigo-200/70 bg-indigo-50/40 p-2"
      aria-label="Tryb pracy — społeczność"
    >
      {TRYBY_PRACY_OPCJE.map((t) => {
        const aktywny = aktywnyTryb === t.id;
        return (
          <Link
            key={t.id}
            href={hrefDlaTrybu(t.id)}
            className={`rounded-xl px-3 py-2 text-xs font-medium transition sm:text-sm ${
              aktywny
                ? "bg-indigo-700 text-white shadow-sm"
                : "bg-white text-stone-700 ring-1 ring-stone-200/80 hover:bg-indigo-50 hover:text-indigo-950"
            }`}
            aria-current={aktywny ? "page" : undefined}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
