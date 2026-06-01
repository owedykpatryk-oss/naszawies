"use client";

import Link from "next/link";
import { IkonaPanelNawigacji } from "@/components/marka/ikony-panel-nawigacji";
import { czyAktywnyLinkGlownyPanelu, klasaPillNawigacji } from "@/lib/panel/klasy-nawigacji-pill";
import {
  panelNawigacjaZKluczy,
  type KluczPanelNawigacji,
} from "@/lib/uzytkownik/preferencje-ui";
import { usePathname } from "next/navigation";

type PanelNawigacjaProps = {
  pokazLinkSoltysa?: boolean;
  liczbaWiadomosciNieprzeczytanych?: number;
  pokazAdmin?: boolean;
  kluczePanelu?: KluczPanelNawigacji[];
};

export function PanelNawigacja({
  pokazLinkSoltysa = false,
  liczbaWiadomosciNieprzeczytanych = 0,
  pokazAdmin = false,
  kluczePanelu,
}: PanelNawigacjaProps) {
  const pathname = usePathname();
  const linki = panelNawigacjaZKluczy(kluczePanelu, {
    pokazSoltysa: pokazLinkSoltysa,
    pokazAdmin,
  });

  return (
    <nav aria-label="Panel" className="panel-nawigacja-szklo mb-8 min-w-0 sm:mb-10">
      <div className="-mx-0.5 flex flex-nowrap gap-1 overflow-x-auto px-0.5 pb-0.5 text-xs [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] sm:flex-wrap sm:gap-1.5 sm:overflow-visible sm:px-0 sm:pb-0 sm:text-sm">
        {linki.map(({ href, label, klucz }) => {
          const aktywny = czyAktywnyLinkGlownyPanelu(href, pathname);
          const badge =
            href === "/panel/czat" && liczbaWiadomosciNieprzeczytanych > 0 ? liczbaWiadomosciNieprzeczytanych : 0;
          return (
            <Link
              key={href}
              href={href}
              className={`${klasaPillNawigacji(aktywny, false, true)} flex min-h-[44px] items-center sm:min-h-0`}
              aria-current={aktywny ? "page" : undefined}
            >
              <IkonaPanelNawigacji klucz={klucz} />
              {label}
              {badge > 0 ? (
                <span className="rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-sm">
                  {badge > 99 ? "99+" : badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
