"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const linkiStale: { href: string; label: string; ikona?: string }[] = [
  { href: "/panel", label: "Start", ikona: "🏠" },
  { href: "/panel/moje", label: "Moje ★", ikona: "★" },
  { href: "/panel/czat", label: "Wiadomości", ikona: "💬" },
  { href: "/panel/powiadomienia", label: "Powiadomienia", ikona: "🔔" },
  { href: "/panel/profil", label: "Ustawienia", ikona: "⚙️" },
];

type PanelNawigacjaProps = {
  /** Gdy `true`, pokaż wejście „Działania” (panel sołtysa / współadmina). */
  pokazLinkSoltysa?: boolean;
  liczbaWiadomosciNieprzeczytanych?: number;
  /** Tylko administrator platformy widzi link Admin. */
  pokazAdmin?: boolean;
};

export function PanelNawigacja({
  pokazLinkSoltysa = false,
  liczbaWiadomosciNieprzeczytanych = 0,
  pokazAdmin = false,
}: PanelNawigacjaProps) {
  const pathname = usePathname();

  const linki = [...linkiStale];
  if (pokazLinkSoltysa) {
    linki.splice(3, 0, { href: "/panel/soltys", label: "Działania", ikona: "✅" });
  }
  if (pokazAdmin) {
    linki.push({ href: "/panel/admin", label: "Admin", ikona: "🛡️" });
  }

  return (
    <nav aria-label="Panel" className="panel-nawigacja-szklo mb-8 min-w-0 sm:mb-10">
      <div className="-mx-0.5 flex flex-nowrap gap-1 overflow-x-auto px-0.5 pb-0.5 text-xs [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] sm:flex-wrap sm:gap-1.5 sm:overflow-visible sm:px-0 sm:pb-0 sm:text-sm">
        {linki.map(({ href, label, ikona }) => {
          const aktywny =
            href === "/panel" ? pathname === "/panel" : pathname === href || pathname.startsWith(`${href}/`);
          const badge =
            href === "/panel/czat" && liczbaWiadomosciNieprzeczytanych > 0 ? liczbaWiadomosciNieprzeczytanych : 0;
          return (
            <Link
              key={href}
              href={href}
              className={
                aktywny
                  ? "nawigacja-pill flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-b from-green-800 to-green-900 px-2.5 py-2 font-medium text-white shadow-md ring-1 ring-green-950/20 sm:min-h-0 sm:px-3.5"
                  : "nawigacja-pill flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-2 text-stone-700 transition hover:bg-white/95 hover:text-green-950 hover:shadow-sm sm:min-h-0 sm:px-3.5"
              }
              aria-current={aktywny ? "page" : undefined}
            >
              {ikona ? (
                <span className="text-sm leading-none opacity-90" aria-hidden>
                  {ikona}
                </span>
              ) : null}
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
