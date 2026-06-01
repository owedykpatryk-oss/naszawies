"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { TRYBY_PRACY_OPCJE, type TrybOrganizacji } from "@/app/(site)/panel/soltys/spolecznosc/tryby-pracy";
import { czyAktywnyHrefPanelu, klasaPillNawigacji } from "@/lib/panel/klasy-nawigacji-pill";

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
      className="panel-nawigacja-szklo flex flex-wrap gap-1 p-1.5"
      aria-label="Tryb pracy — społeczność"
    >
      {TRYBY_PRACY_OPCJE.map((t) => {
        const href = hrefDlaTrybu(t.id);
        const aktywny = czyAktywnyHrefPanelu(href, pathname, searchParams?.toString() ?? "") || aktywnyTryb === t.id;
        return (
          <Link
            key={t.id}
            href={href}
            className={klasaPillNawigacji(aktywny)}
            aria-current={aktywny ? "page" : undefined}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
