import Image from "next/image";
import { EMBLEM_MARKI_SRC } from "./logo-naszawies";

type Props = {
  /** Rozmiar ikony w px. */
  rozmiar?: number;
  className?: string;
};

/** Okrągły emblem marki (przezroczyste tło). */
export function ZnakNaszawies({ rozmiar = 24, className = "" }: Props) {
  return (
    <Image
      src={EMBLEM_MARKI_SRC}
      alt="naszawies.pl"
      width={rozmiar}
      height={rozmiar}
      className={`shrink-0 ${className}`}
    />
  );
}

/** Emblem — nagłówek, stopka. */
export function ZnakNaszawiesOkrag({
  rozmiarKola = 44,
  className = "",
}: {
  rozmiarKola?: number;
  className?: string;
}) {
  return (
    <Image
      src={EMBLEM_MARKI_SRC}
      alt=""
      width={rozmiarKola}
      height={rozmiarKola}
      className={`shrink-0 ${className}`}
    />
  );
}
