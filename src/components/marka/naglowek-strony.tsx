import Link from "next/link";
import { LogoNaszawies } from "./logo-naszawies";

type LinkPrawy = { href: string; label: string };

type Props = {
  /** Główna nawigacja (Szukaj, Mapa, Panel...) */
  linkiGlowne?: LinkPrawy[];
  /** Akcje po prawej (Logowanie, Rejestracja, Kontakt...) */
  linkiAkcje?: LinkPrawy[];
  className?: string;
};

/**
 * Sticky nagłówek spójny z landingiem (krem + blur), z podziałem:
 * 1) główna nawigacja
 * 2) akcje użytkownika
 */
export function NaglowekStrony({
  linkiGlowne = [],
  linkiAkcje = [],
  className = "",
}: Props) {
  return (
    <header
      className={`sticky top-0 z-50 border-b border-green-900/10 bg-[#f5f1e8]/92 backdrop-blur-md ${className}`}
    >
      <div className="mx-auto flex min-w-0 max-w-6xl items-center justify-between gap-3 px-0 py-3">
        <div className="min-w-0 shrink-0">
          <LogoNaszawies kompakt />
        </div>

        {linkiAkcje.length > 0 ? (
          <nav
            aria-label="Akcje użytkownika"
            className="flex min-w-0 max-w-[min(100%,calc(100vw-7rem))] flex-nowrap items-center justify-end gap-1.5 overflow-x-auto py-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]"
          >
            {linkiAkcje.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="shrink-0 rounded-lg border border-transparent px-2 py-1.5 text-xs font-medium text-stone-700 transition hover:border-green-900/10 hover:bg-white/80 hover:text-green-900 sm:px-3 sm:text-sm"
              >
                {label}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>

      {linkiGlowne.length > 0 ? (
        <div className="mx-auto max-w-6xl pb-3">
          <nav
            aria-label="Główna nawigacja"
            className="flex min-w-0 flex-nowrap items-center gap-1.5 overflow-x-auto rounded-xl border border-green-900/10 bg-white/70 px-2 py-1.5 shadow-sm [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] sm:gap-2"
          >
            {linkiGlowne.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-green-900 transition hover:bg-green-50 hover:text-green-950 sm:px-3 sm:text-sm"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
