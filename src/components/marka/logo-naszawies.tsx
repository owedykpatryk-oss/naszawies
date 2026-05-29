import Image from "next/image";
import Link from "next/link";

/** Oficjalne logo marki (ikona z emblematem wsi). */
export const LOGO_MARKI_SRC = "/marka/logo-naszawies.png";

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

/** Emblem (górna część pliku PNG — bez powtórzonego napisu w nagłówku). */
function EmblemMarki({ rozmiar }: { rozmiar: number }) {
  return (
    <span
      className="inline-flex shrink-0 overflow-hidden rounded-xl shadow-md shadow-green-950/15 ring-1 ring-white/25"
      style={{ width: rozmiar, height: rozmiar }}
    >
      <Image
        src={LOGO_MARKI_SRC}
        alt=""
        width={rozmiar}
        height={Math.round(rozmiar * 1.42)}
        className="h-auto max-w-none object-cover object-top"
        style={{ width: rozmiar, marginTop: 0 }}
        priority
      />
    </span>
  );
}

function TekstLogo({ kompakt, wariant }: { kompakt?: boolean; wariant: Wariant }) {
  const rozmiar = kompakt ? "text-sm sm:text-base md:text-lg" : "text-lg sm:text-xl md:text-[1.35rem]";
  const jasny = wariant === "jasny";

  return (
    <span
      className={`min-w-0 font-sans font-semibold tracking-tight ${rozmiar} leading-none`}
      aria-hidden
    >
      <span className={jasny ? "text-[#7cb342]" : "text-emerald-200"}>naszawies</span>
      <span className={`font-medium ${jasny ? "text-[#d4a017]" : "text-[#e8c468]"}`}>.pl</span>
    </span>
  );
}

/**
 * Logo marki: emblem + „naszawies.pl” — zgodne z oficjalną ikoną aplikacji.
 */
export function LogoNaszawies({ kompakt, wariant = "jasny", className = "", bezLinku = false }: Props) {
  const rozmiarEmblematu = kompakt ? 36 : 44;
  const zawartosc = (
    <>
      <EmblemMarki rozmiar={rozmiarEmblematu} />
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

/** Logo wyśrodkowane na stronach logowania / rejestracji (pełna ikona z napisem). */
export function LogoNaszawiesWycentrowane({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center pb-6 ${className}`}>
      <Link href="/" className="block no-underline outline-none" aria-label="naszawies.pl — strona główna">
        <Image
          src={LOGO_MARKI_SRC}
          alt="naszawies.pl"
          width={152}
          height={152}
          className="h-auto w-[min(152px,42vw)] rounded-2xl shadow-lg shadow-green-950/20"
          priority
        />
      </Link>
    </div>
  );
}
