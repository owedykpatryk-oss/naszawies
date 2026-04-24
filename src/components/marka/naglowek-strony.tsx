import Link from "next/link";
import { LogoNaszawies } from "./logo-naszawies";

type LinkPrawy = { href: string; label: string };

type Props = {
  /** Dodatkowe linki po prawej (np. Logowanie / Panel) */
  linkiPrawe?: LinkPrawy[];
  className?: string;
};

/**
 * Sticky nagłówek spójny z landingiem (krem + blur), żeby logo było wszędzie czytelnie.
 */
export function NaglowekStrony({ linkiPrawe, className = "" }: Props) {
  return (
    <header
      className={`sticky top-0 z-50 border-b border-green-900/10 bg-[#f5f1e8]/90 backdrop-blur-md ${className}`}
    >
      <div className="mx-auto flex min-w-0 max-w-6xl items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-5">
        <div className="min-w-0 shrink-0">
          <LogoNaszawies kompakt />
        </div>
        {linkiPrawe && linkiPrawe.length > 0 ? (
          <nav
            aria-label="Skróty"
            className="flex min-w-0 max-w-[min(100%,calc(100vw-7rem))] flex-nowrap items-center justify-end gap-1.5 overflow-x-auto py-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] sm:max-w-none sm:flex-wrap sm:overflow-visible sm:gap-2 sm:gap-3"
          >
            {linkiPrawe.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="shrink-0 rounded-lg px-2 py-1.5 text-xs font-medium text-stone-700 transition hover:bg-white/80 hover:text-green-900 sm:px-3 sm:text-sm"
              >
                {label}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
    </header>
  );
}
