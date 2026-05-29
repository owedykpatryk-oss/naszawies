import Image from "next/image";
import { LOGO_MARKI_SRC } from "./logo-naszawies";

type Props = {
  /** Rozmiar ikony w px. */
  rozmiar?: number;
  className?: string;
};

/** Kwadratowy emblem marki (oficjalna ikona). */
export function ZnakNaszawies({ rozmiar = 24, className = "" }: Props) {
  return (
    <Image
      src={LOGO_MARKI_SRC}
      alt="naszawies.pl"
      width={rozmiar}
      height={rozmiar}
      className={`shrink-0 rounded-lg ${className}`}
    />
  );
}

/** Emblem w zaokrąglonym kwadracie — nagłówek, stopka. */
export function ZnakNaszawiesOkrag({
  rozmiarKola = 44,
  className = "",
}: {
  rozmiarKola?: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 overflow-hidden rounded-xl shadow-md shadow-green-950/15 ring-1 ring-white/25 ${className}`}
      style={{ width: rozmiarKola, height: rozmiarKola }}
    >
      <Image
        src={LOGO_MARKI_SRC}
        alt=""
        width={rozmiarKola}
        height={Math.round(rozmiarKola * 1.42)}
        className="h-auto max-w-none object-cover object-top"
        style={{ width: rozmiarKola }}
      />
    </span>
  );
}
