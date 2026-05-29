import Link from "next/link";
import { LogoNaszawies } from "@/components/marka/logo-naszawies";
import { PanelNawigacja } from "@/components/panel/panel-nawigacja";

type Props = {
  pokazLinkSoltysa?: boolean;
  liczbaWiadomosciNieprzeczytanych?: number;
};

/** Pasek panelu: logo + nawigacja — spójnie na wszystkich podstronach. */
export function PanelNaglowekZLogo({
  pokazLinkSoltysa = true,
  liczbaWiadomosciNieprzeczytanych = 0,
}: Props) {
  return (
    <div className="no-print mb-8 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200/80 pb-4">
        <div className="shrink-0">
          <LogoNaszawies kompakt />
        </div>
        <Link
          href="/"
          className="text-xs font-medium text-stone-500 underline decoration-stone-300 underline-offset-2 hover:text-green-900"
        >
          Strona publiczna
        </Link>
      </div>
      <PanelNawigacja
        pokazLinkSoltysa={pokazLinkSoltysa}
        liczbaWiadomosciNieprzeczytanych={liczbaWiadomosciNieprzeczytanych}
      />
    </div>
  );
}
