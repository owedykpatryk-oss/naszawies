import Link from "next/link";
import { LogoNaszawies } from "@/components/marka/logo-naszawies";
import { PanelNawigacja } from "@/components/panel/panel-nawigacja";
import type { KluczPanelNawigacji } from "@/lib/uzytkownik/preferencje-ui";

type Props = {
  pokazLinkSoltysa?: boolean;
  liczbaWiadomosciNieprzeczytanych?: number;
  pokazAdmin?: boolean;
  kluczePanelu?: KluczPanelNawigacji[];
};

/** Pasek panelu: logo + nawigacja — spójnie na wszystkich podstronach. */
export function PanelNaglowekZLogo({
  pokazLinkSoltysa = true,
  liczbaWiadomosciNieprzeczytanych = 0,
  pokazAdmin = false,
  kluczePanelu,
}: Props) {
  return (
    <div className="no-print sticky top-0 z-40 -mx-4 mb-4 space-y-3 border-b border-stone-200/80 bg-[var(--nasza-tlo-panel)]/95 px-4 py-2.5 shadow-[0_4px_24px_rgba(45,90,45,0.05)] backdrop-blur-md sm:-mx-6 sm:mb-6 sm:space-y-4 sm:px-6 sm:py-3 lg:-mx-8 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="shrink-0">
          <LogoNaszawies kompakt href="/panel" />
        </div>
        <Link
          href="/wyloguj"
          className="text-xs font-medium text-stone-500 underline decoration-stone-300 underline-offset-2 hover:text-green-900"
        >
          Wyloguj
        </Link>
      </div>
      <PanelNawigacja
        pokazLinkSoltysa={pokazLinkSoltysa}
        liczbaWiadomosciNieprzeczytanych={liczbaWiadomosciNieprzeczytanych}
        pokazAdmin={pokazAdmin}
        kluczePanelu={kluczePanelu}
      />
    </div>
  );
}
