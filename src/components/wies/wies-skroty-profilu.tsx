import Link from "next/link";
import { UjawnijPoPrzewinieciu } from "@/components/ui/ujawnij-po-przewinieciu";
import type { SkrotWsiPubliczny } from "@/lib/wies/ustawienia-wsi";

type Props = {
  skroty: SkrotWsiPubliczny[];
};

/** Kafelki szybkiego dostępu konfigurowane przez sołtysa. */
export function WiesSkrotyProfilu({ skroty }: Props) {
  if (skroty.length === 0) return null;

  return (
    <nav
      aria-label="Szybkie skróty"
      className="mt-5 grid grid-cols-2 gap-2 max-[380px]:grid-cols-1 sm:grid-cols-3 lg:grid-cols-6"
    >
      {skroty.map((s, i) => {
        const zewnetrzny = s.href.startsWith("http");
        const klasa =
          "wies-skrot-kafelek flex min-h-[4.5rem] flex-col items-center justify-center gap-1 rounded-xl border px-2 py-3 text-center text-sm font-semibold shadow-sm transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--wies-akcent,#166534)]";

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

        const kafelek = zewnetrzny ? (
          <a href={s.href} className={klasa} target="_blank" rel="noopener noreferrer">
            {zawartosc}
          </a>
        ) : (
          <Link href={s.href} className={klasa}>
            {zawartosc}
          </Link>
        );

        return (
          <UjawnijPoPrzewinieciu key={`${s.href}-${i}`} as="li" opoznienieMs={i * 70}>
            {kafelek}
          </UjawnijPoPrzewinieciu>
        );
      })}
    </nav>
  );
}
