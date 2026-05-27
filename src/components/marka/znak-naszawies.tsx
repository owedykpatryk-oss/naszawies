import Image from "next/image";
import { MARKA_SCIEZKI } from "@/lib/marka/sciezki";

type Props = {
  /** Rozmiar ikony w px (średnica okręgu). */
  rozmiar?: number;
  className?: string;
};

/** Okrągły emblemat marki (wieś w kole) — favicon, logo, małe znaki. */
export function ZnakNaszawies({ rozmiar = 24, className = "" }: Props) {
  return (
    <Image
      src={MARKA_SCIEZKI.znakOkrag}
      alt=""
      width={rozmiar}
      height={rozmiar}
      className={`shrink-0 rounded-full object-cover ${className}`}
      aria-hidden
    />
  );
}

/** Okrągły kontener ze znakiem — używany w logo i stopce. */
export function ZnakNaszawiesOkrag({
  rozmiarKola = 44,
  className = "",
}: {
  rozmiarKola?: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 overflow-hidden rounded-full shadow-md shadow-green-950/15 ring-2 ring-white/25 ${className}`}
      style={{ width: rozmiarKola, height: rozmiarKola, minWidth: rozmiarKola, minHeight: rozmiarKola }}
    >
      <Image
        src={MARKA_SCIEZKI.znakOkrag}
        alt=""
        width={rozmiarKola}
        height={rozmiarKola}
        className="h-full w-full object-cover"
        aria-hidden
      />
    </span>
  );
}
