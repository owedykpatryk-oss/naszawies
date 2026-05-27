type Props = {
  /** Rozmiar ikony w px (średnica okręgu). */
  rozmiar?: number;
  className?: string;
};

/** Znak marki (chałupa na zielonym kole) — wspólny dla logo, favicon, maili. */
export function ZnakNaszawies({ rozmiar = 24, className = "" }: Props) {
  const s = rozmiar;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M3 20V11L12 4L21 11V20H14V14H10V20H3Z"
        fill="#f5f1e8"
        stroke="#d4a017"
        strokeWidth={1.2}
      />
      <circle cx={12} cy={7} r={1.2} fill="#d4a017" />
    </svg>
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
  const rozmiarIkony = Math.max(18, Math.round(rozmiarKola * 0.52));
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#5a9c3e] to-[#2d5a2d] shadow-md shadow-green-950/20 ring-2 ring-white/25 ${className}`}
      style={{ width: rozmiarKola, height: rozmiarKola, minWidth: rozmiarKola, minHeight: rozmiarKola }}
    >
      <ZnakNaszawies rozmiar={rozmiarIkony} />
    </span>
  );
}
