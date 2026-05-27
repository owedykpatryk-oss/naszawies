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
  const rozmiar = kompakt
    ? "text-base sm:text-lg"
    : "text-lg sm:text-xl md:text-[1.35rem]";
  const jasny = wariant === "jasny";

  return (
    <span
      className={`font-serif font-semibold tracking-tight ${rozmiar} leading-none whitespace-nowrap`}
      aria-hidden
    >
      <span className={jasny ? "text-[#2d5a2d]" : "text-white"}>nasza</span>
      <span className={jasny ? "text-[#5a9c3e]" : "text-emerald-200"}>wies</span>
      <span className={`font-medium ${jasny ? "text-[#d4a017]" : "text-[#e8c468]"}`}>.pl</span>
    </span>
  );
}

/**
 * Logo marki: znak + „naszawies.pl” — zawsze widoczne (tekst nie chowa się na mobile).
 */
export function LogoNaszawies({ kompakt, wariant = "jasny", className = "", bezLinku = false }: Props) {
  const rozmiarKola = kompakt ? 36 : 44;
  const zawartosc = (
    <>
      <ZnakNaszawiesOkrag rozmiarKola={rozmiarKola} />
      <TekstLogo kompakt={kompakt} wariant={wariant} />
    </>
  );

  const klasy =
    "group inline-flex max-w-full items-center gap-2 sm:gap-2.5 no-underline outline-none ring-green-800 ring-offset-2 ring-offset-[#f5f1e8] focus-visible:ring-2";

  if (bezLinku) {
    return <span className={`${klasy} ${className}`}>{zawartosc}</span>;
  }

  return (
    <Link href="/" className={`${klasy} ${className}`} aria-label="naszawies.pl — strona główna">
      {zawartosc}
    </Link>
  );
}

/** Logo wyśrodkowane na stronach logowania / rejestracji. */
export function LogoNaszawiesWycentrowane({ className = "" }: { className?: string }) {
  return (
    <div className={`flex justify-center pb-6 ${className}`}>
      <LogoNaszawies />
    </div>
  );
}
