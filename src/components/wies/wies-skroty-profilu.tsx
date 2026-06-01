import Link from "next/link";
import type { SkrotWsiPubliczny } from "@/lib/wies/ustawienia-wsi";

type Props = {
  skroty: SkrotWsiPubliczny[];
};

/** Kafelki szybkiego dostępu konfigurowane przez sołtysa. */
export function WiesSkrotyProfilu({ skroty }: Props) {
  if (skroty.length === 0) return null;

  return (
    <nav aria-label="Szybkie skróty" className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {skroty.map((s, i) => {
        const zewnetrzny = s.href.startsWith("http");
        const klasa =
          "flex min-h-[4.5rem] flex-col items-center justify-center gap-1 rounded-xl border border-stone-200/90 bg-white/90 px-2 py-3 text-center text-sm font-semibold text-stone-800 shadow-sm transition hover:border-[color-mix(in_srgb,var(--wies-ramka,#86efac)_55%,transparent)] hover:bg-[color-mix(in_srgb,var(--wies-tlo,#f0fdf4)_65%,white)] hover:text-[var(--wies-tekst,#14532d)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-800";

        const zawartosc = (
          <>
            {s.emoji ? (
              <span className="text-xl leading-none" aria-hidden>
                {s.emoji}
              </span>
            ) : null}
            <span>{s.label}</span>
            {s.opis ? <span className="text-[10px] font-normal leading-tight text-stone-500">{s.opis}</span> : null}
          </>
        );

        if (zewnetrzny) {
          return (
            <a key={`${s.href}-${i}`} href={s.href} className={klasa} target="_blank" rel="noopener noreferrer">
              {zawartosc}
            </a>
          );
        }

        return (
          <Link key={`${s.href}-${i}`} href={s.href} className={klasa}>
            {zawartosc}
          </Link>
        );
      })}
    </nav>
  );
}
