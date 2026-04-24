import Link from "next/link";

const SvgChalupa = (
  <svg
    width={22}
    height={22}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
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

type Props = {
  /** Mniejszy wariant w wąskich paskach (np. mobile) */
  kompakt?: boolean;
  className?: string;
};

/**
 * Logo jak na landingu: znak + „nasza” „wies” „.pl” w kolorystyce marki.
 */
export function LogoNaszawies({ kompakt, className = "" }: Props) {
  const rozmiarZnaku = kompakt ? "h-9 w-9 min-h-9 min-w-9" : "h-11 w-11 min-h-11 min-w-11";
  const rozmiarTekstu = kompakt ? "text-lg" : "text-xl";

  return (
    <Link
      href="/"
      className={`group flex items-center gap-2.5 no-underline outline-none ring-green-800 ring-offset-2 ring-offset-stone-50 focus-visible:ring-2 ${className}`}
      aria-label="naszawies.pl — strona główna"
    >
      <span
        className={`flex ${rozmiarZnaku} shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#5a9c3e] to-[#2d5a2d] shadow-md shadow-green-900/15 transition group-hover:shadow-lg group-hover:shadow-green-900/25`}
      >
        {SvgChalupa}
      </span>
      <span
        className={`font-serif font-semibold tracking-tight ${rozmiarTekstu} leading-none sm:leading-tight`}
      >
        <span className="text-[#2d5a2d]">nasza</span>
        <span className="text-[#5a9c3e]">wies</span>
        <span className="font-medium text-[#d4a017]">.pl</span>
      </span>
    </Link>
  );
}
