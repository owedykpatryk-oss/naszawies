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
      className={`sticky top-0 z-50 border-b border-green-900/10 bg-[#f5f1e8]/95 backdrop-blur-md supports-[backdrop-filter]:bg-[#f5f1e8]/90 ${className}`}
    >
      <div className="page-shell flex min-w-0 items-center justify-between gap-3 px-1 py-2.5 sm:gap-4 sm:px-2 sm:py-3">
        <div className="shrink-0">
          <LogoNaszawies kompakt />
        </div>

        {linkiAkcje.length > 0 ? (
          <nav
            aria-label="Akcje użytkownika"
            className="flex min-w-0 flex-1 items-center justify-end gap-1 overflow-x-auto py-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] sm:gap-1.5 [&::-webkit-scrollbar]:hidden"
          >
            {linkiAkcje.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="shrink-0 whitespace-nowrap rounded-lg border border-transparent px-2 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:border-green-900/10 hover:bg-white hover:text-green-900 sm:px-3 sm:text-sm"
              >
                {label}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>

      {linkiGlowne.length > 0 ? (
        <div className="page-shell px-1 pb-2.5 sm:px-2 sm:pb-3">
          <nav
            aria-label="Główna nawigacja"
            className="flex min-w-0 flex-nowrap items-center gap-1 overflow-x-auto rounded-xl border border-green-900/10 bg-white px-1.5 py-1.5 [scrollbar-width:none] sm:gap-2 sm:px-2 [&::-webkit-scrollbar]:hidden"
          >
            {linkiGlowne.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold text-green-900 transition hover:bg-green-50 hover:text-green-950 sm:px-3 sm:text-sm"
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
