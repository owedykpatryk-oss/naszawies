import type { RzutParteruSaliJson } from "@/lib/swietlica/rzut-parteru-sali";

export function RzutParteruSaliSvg({
  plan,
  className,
  ariaLabel = "Schemat rzutu parteru sali",
  pokazPolnoc = true,
}: {
  plan: RzutParteruSaliJson;
  className?: string;
  ariaLabel?: string;
  /** Symboliczna strzałka N (jak na prostym rzucie papierowym). */
  pokazPolnoc?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label={ariaLabel}
      preserveAspectRatio="xMidYMid meet"
    >
      <title>{plan.tytul}</title>
      <rect x="0" y="0" width="100" height="100" fill="#fafaf9" stroke="#d6d3d1" strokeWidth="0.35" />
      {plan.pomieszczenia.map((p) => (
        <g key={p.id}>
          <rect
            x={p.x}
            y={p.y}
            width={p.w}
            height={p.h}
            fill={p.color}
            fillOpacity={0.55}
            stroke="#44403c"
            strokeWidth="0.25"
            rx="0.4"
          />
          <text
            x={p.x + 1.2}
            y={p.y + 3.5}
            fill="#1c1917"
            fontSize={p.w < 18 ? 2.2 : 2.8}
            fontWeight="700"
            className="select-none"
          >
            {p.lp}
          </text>
          <text
            x={p.x + 1.2}
            y={p.y + 6.5}
            fill="#292524"
            fontSize={p.w < 18 ? 1.85 : 2.1}
            fontWeight="600"
            className="select-none"
          >
            {p.nazwa.length > 28 ? `${p.nazwa.slice(0, 26)}…` : p.nazwa}
          </text>
        </g>
      ))}
      {pokazPolnoc ? (
        <g aria-hidden transform="translate(82,4)">
          <circle cx="6" cy="6" r="5.5" fill="white" fillOpacity="0.92" stroke="#57534e" strokeWidth="0.2" />
          <path d="M 6 1.2 L 7.8 8.2 L 6 6.8 L 4.2 8.2 Z" fill="#14532d" stroke="#14532d" strokeWidth="0.15" strokeLinejoin="round" />
          <text x="6" y="11.2" textAnchor="middle" fill="#44403c" fontSize="2.4" fontWeight="700" className="select-none">
            N
          </text>
        </g>
      ) : null}
    </svg>
  );
}
