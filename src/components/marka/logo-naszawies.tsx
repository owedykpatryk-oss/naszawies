import Image from "next/image";
import Link from "next/link";
import { MARKA_SCIEZKI } from "@/lib/marka/sciezki";

/** Okrągły emblem (przezroczyste tło). */
export const EMBLEM_MARKI_SRC = MARKA_SCIEZKI.emblem;
/** Pełne logo z napisem (przezroczyste tło). */
export const LOGO_PELNE_SRC = MARKA_SCIEZKI.logoPelne;
/** Ikona PWA z gradientem. */
export const LOGO_APP_SRC = MARKA_SCIEZKI.logoApp;

/** @deprecated Użyj {@link EMBLEM_MARKI_SRC} lub {@link LOGO_PELNE_SRC}. */
export const LOGO_MARKI_SRC = EMBLEM_MARKI_SRC;

type Wariant = "jasny" | "ciemny";

type Props = {
  /** Mniejszy znak i tekst (nagłówek aplikacji). */
  kompakt?: boolean;
  /** Tekst na ciemnym tle (stopka landingu). */
  wariant?: Wariant;
  className?: string;
  /** Bez linku do strony głównej (np. w mailu). */
  bezLinku?: boolean;
  /** Docelowy URL po kliknięciu (domyślnie strona główna; zalogowani → panel). */
  href?: string;
};

function EmblemMarki({ rozmiar }: { rozmiar: number }) {
  return (
    <Image
      src={EMBLEM_MARKI_SRC}
      alt=""
      width={rozmiar}
      height={rozmiar}
      className="shrink-0"
      priority
    />
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
export function LogoNaszawies({
  kompakt,
  wariant = "jasny",
  className = "",
  bezLinku = false,
  href = "/",
}: Props) {
  const rozmiarEmblematu = kompakt ? 36 : 44;
  const zawartosc = (
    <>
      <EmblemMarki rozmiar={rozmiarEmblematu} />
      <TekstLogo kompakt={kompakt} wariant={wariant} />
    </>
  );

  const klasy =
    "group inline-flex max-w-full min-w-0 items-center gap-2 sm:gap-2.5 no-underline outline-none ring-green-800 ring-offset-2 ring-offset-[#f5f1e8] focus-visible:ring-2";

  const etykietaLinku = href === "/panel" ? "naszawies.pl — panel" : "naszawies.pl — strona główna";

  if (bezLinku) {
    return <span className={`${klasy} ${className}`}>{zawartosc}</span>;
  }

  return (
    <Link href={href} className={`${klasy} ${className}`} aria-label={etykietaLinku}>
      {zawartosc}
    </Link>
  );
}

/** Logo wyśrodkowane na stronach logowania / rejestracji — jeden plik PNG z pełnym znakiem. */
export function LogoNaszawiesWycentrowane({ className = "" }: { className?: string }) {
  return (
    <div className={`flex justify-center pb-6 ${className}`}>
      <Link
        href="/"
        className="inline-block outline-none ring-green-800 ring-offset-2 ring-offset-stone-50 focus-visible:ring-2"
        aria-label="naszawies.pl — strona główna"
      >
        <Image
          src={LOGO_PELNE_SRC}
          alt="naszawies.pl"
          width={682}
          height={1024}
          className="h-auto w-40 max-w-full sm:w-44"
          priority
        />
      </Link>
    </div>
  );
}
