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
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <LogoNaszawies kompakt />
        {linkiPrawe && linkiPrawe.length > 0 ? (
          <nav aria-label="Skróty" className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            {linkiPrawe.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-white/80 hover:text-green-900 sm:px-3"
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
