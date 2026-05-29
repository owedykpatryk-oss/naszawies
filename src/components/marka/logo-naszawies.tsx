import Link from "next/link";
import { ZnakNaszawiesOkrag } from "./znak-naszawies";

type Wariant = "jasny" | "ciemny";

type Props = {
  /** Mniejszy znak i tekst (nagłówek aplikacji). */
  kompakt?: boolean;
  /** Tekst na ciemnym tle (stopka landingu). */
  wariant?: Wariant;
  className?: string;
  /** Bez linku do strony głównej (np. w mailu). */
  bezLinku?: boolean;
};

function TekstLogo({ kompakt, wariant }: { kompakt?: boolean; wariant: Wariant }) {
  const rozmiar = kompakt ? "text-sm sm:text-base md:text-lg" : "text-lg sm:text-xl md:text-[1.35rem]";
  const jasny = wariant === "jasny";

  return (
    <span
      className={`min-w-0 font-serif font-semibold tracking-tight ${rozmiar} leading-none`}
      aria-hidden
    >
      <span className={jasny ? "text-[#2d5a2d]" : "text-white"}>nasza</span>
      <span className={jasny ? "text-[#5a9c3e]" : "text-emerald-200"}>wies</span>
      <span className={`font-medium ${jasny ? "text-[#d4a017]" : "text-[#e8c468]"}`}>.pl</span>
    </span>
  );
}

/**
 * Logo marki: znak + „naszawies.pl” — czytelne na mobile, bez nachodzenia na nawigację.
 */
export function LogoNaszawies({ kompakt, wariant = "jasny", className = "", bezLinku = false }: Props) {
  const rozmiarKola = kompakt ? 34 : 44;
  const zawartosc = (
    <>
      <ZnakNaszawiesOkrag rozmiarKola={rozmiarKola} />
      <TekstLogo kompakt={kompakt} wariant={wariant} />
    </>
  );

  const klasy =
    "group inline-flex max-w-full min-w-0 items-center gap-2 sm:gap-2.5 no-underline outline-none ring-green-800 ring-offset-2 ring-offset-[#f5f1e8] focus-visible:ring-2";

  if (bezLinku) {
    return <span className={`${klasy} ${className}`}>{zawartosc}</span>;
  }

  return (
    <Link href="/" className={`${klasy} ${className}`} aria-label="naszawies.pl — strona główna">
      {zawartosc}
    </Link>
  );
}

/** Logo wyśrodkowane na stronach logowania / rejestracji (pełny znak z napisem). */
export function LogoNaszawiesWycentrowane({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-3 pb-6 ${className}`}>
      <Link href="/" className="block no-underline outline-none" aria-label="naszawies.pl — strona główna">
        <ZnakNaszawiesOkrag rozmiarKola={88} className="shadow-lg shadow-green-950/20" />
      </Link>
      <p className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl" aria-hidden>
        <span className="text-[#2d5a2d]">nasza</span>
        <span className="text-[#5a9c3e]">wies</span>
        <span className="font-medium text-[#d4a017]">.pl</span>
      </p>
    </div>
  );
}
