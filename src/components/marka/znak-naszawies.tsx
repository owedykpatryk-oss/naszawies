import { ZnakNaszawiesSvg } from "./znak-naszawies-svg";

type Props = {
  /** Rozmiar ikony w px (średnica okręgu). */
  rozmiar?: number;
  className?: string;
};

/** Okrągły emblemat marki (wieś w kole) — favicon, logo, małe znaki. */
export function ZnakNaszawies({ rozmiar = 24, className = "" }: Props) {
  return <ZnakNaszawiesSvg rozmiar={rozmiar} className={`shrink-0 rounded-full ${className}`} />;
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
      <ZnakNaszawiesSvg rozmiar={rozmiarKola} className="h-full w-full" />
    </span>
  );
}
