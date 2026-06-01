import Link from "next/link";
import { LogoNaszawies } from "./logo-naszawies";
import { MenuMobilneWitryny } from "./menu-mobilne-witryny";
import { NaglowekMobilnySync } from "./naglowek-mobilny-sync";
import { NawigacjaGlownaKlient } from "./nawigacja-glowna-klient";

type LinkPrawy = { href: string; label: string };

type Props = {
  /** Główna nawigacja (Szukaj, Mapa, Panel...) */
  linkiGlowne?: LinkPrawy[];
  /** Akcje po prawej (Logowanie, Rejestracja, Kontakt...) */
  linkiAkcje?: LinkPrawy[];
  /** Link z logo (domyślnie strona główna). */
  logoHref?: string;
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
  logoHref = "/",
  className = "",
}: Props) {
  return (
    <header
      id="site-header"
      className={`sticky top-0 z-50 border-b border-green-900/10 bg-[#f5f1e8]/95 shadow-[0_4px_24px_rgba(45,90,45,0.06)] backdrop-blur-md supports-[backdrop-filter]:bg-[#f5f1e8]/90 ${className}`}
    >
      <NaglowekMobilnySync />
      <div className="page-shell flex min-w-0 items-center justify-between gap-2 py-2 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:gap-4 sm:px-6 sm:py-2.5">
        <div className="shrink-0">
          <LogoNaszawies kompakt href={logoHref} />
        </div>

        {linkiAkcje.length > 0 ? (
          <nav
            aria-label="Akcje użytkownika"
            className="hidden min-w-0 flex-1 items-center justify-end gap-1.5 lg:flex"
          >
            {linkiAkcje.map(({ href, label }, i) => {
              const ostatni = i === linkiAkcje.length - 1;
              const wyloguj = href === "/wyloguj";
              return (
                <Link
                  key={href}
                  href={href}
                  className={`shrink-0 whitespace-nowrap rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                    wyloguj
                      ? "border-transparent text-stone-500 hover:border-stone-200 hover:bg-white hover:text-stone-700"
                      : ostatni && !wyloguj && label === "Rejestracja"
                        ? "border-green-800/20 bg-green-800 text-white shadow-sm hover:bg-green-900"
                        : "border-transparent text-stone-700 hover:border-green-900/10 hover:bg-white hover:text-green-900"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        ) : null}

        {(linkiGlowne.length > 0 || linkiAkcje.length > 0) && (
          <MenuMobilneWitryny linkiGlowne={linkiGlowne} linkiAkcje={linkiAkcje} />
        )}
      </div>

      {linkiGlowne.length > 0 ? (
        <div className="page-shell hidden px-4 pb-2.5 sm:px-6 sm:pb-3 lg:block">
          <NawigacjaGlownaKlient linki={linkiGlowne} />
        </div>
      ) : null}
    </header>
  );
}
