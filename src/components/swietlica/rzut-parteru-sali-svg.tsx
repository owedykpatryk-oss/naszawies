import type { ElementArchRzutu, RzutParteruSaliJson } from "@/lib/swietlica/rzut-parteru-sali";

const KOLORY_ZNACZNIKA: Record<ElementArchRzutu["typ"], { fill: string; stroke: string }> = {
  wejscie: { fill: "#fef3c7", stroke: "#b45309" },
  drzwi: { fill: "#fde68a", stroke: "#92400e" },
  drzwi_wew: { fill: "#fef9c3", stroke: "#a16207" },
  okno: { fill: "#bae6fd", stroke: "#0369a1" },
  rampa: { fill: "#d1fae5", stroke: "#047857" },
  sciana: { fill: "none", stroke: "#44403c" },
};

function ZnacznikArch({
  el,
  uid,
  podswietlony,
}: {
  el: ElementArchRzutu;
  uid: string;
  podswietlony?: boolean;
}) {
  const kol = KOLORY_ZNACZNIKA[el.typ];
  const strokeW = podswietlony ? 0.6 : 0.35;

  if (el.typ === "sciana" && el.x1 != null && el.y1 != null && el.x2 != null && el.y2 != null) {
    return (
      <line
        x1={el.x1}
        y1={el.y1}
        x2={el.x2}
        y2={el.y2}
        stroke={kol.stroke}
        strokeWidth={strokeW}
        strokeLinecap="round"
      />
    );
  }

  const x = el.x ?? el.x1 ?? 0;
  const y = el.y ?? el.y1 ?? 0;
  const w = el.w ?? (Math.abs((el.x2 ?? x) - (el.x1 ?? x)) || 2);
  const h = el.h ?? (Math.abs((el.y2 ?? y) - (el.y1 ?? y)) || 1.2);

  if (el.typ === "rampa") {
    return (
      <g>
        <defs>
          <pattern id={`rampa-${uid}-${el.id}`} width="1.2" height="1.2" patternUnits="userSpaceOnUse">
            <path d="M0 1.2 L1.2 0" stroke="#047857" strokeWidth="0.15" opacity={0.5} />
          </pattern>
        </defs>
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          fill={`url(#rampa-${uid}-${el.id})`}
          stroke={kol.stroke}
          strokeWidth={strokeW}
          rx="0.2"
        />
      </g>
    );
  }

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill={kol.fill}
        fillOpacity={0.85}
        stroke={kol.stroke}
        strokeWidth={strokeW}
        rx="0.2"
      />
      {el.etykieta ? (
        <text
          x={x + w / 2}
          y={y + h / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={Math.min(w, h) < 3 ? 1.6 : 2.2}
          fill="#1c1917"
          fontWeight="700"
          className="select-none pointer-events-none"
        >
          {el.etykieta}
        </text>
      ) : null}
    </g>
  );
}

export function RzutParteruSaliSvg({
  plan,
  className,
  ariaLabel = "Schemat rzutu parteru sali",
  pokazPolnoc = true,
  podswietloneArchId,
  onClickPomieszczenie,
  onClickArch,
  trybInteraktywny = false,
}: {
  plan: RzutParteruSaliJson;
  className?: string;
  ariaLabel?: string;
  pokazPolnoc?: boolean;
  podswietloneArchId?: string | null;
  onClickPomieszczenie?: (id: string) => void;
  onClickArch?: (id: string) => void;
  trybInteraktywny?: boolean;
}) {
  const uid = "rz";
  const arch = plan.elementy_arch ?? [];

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

      {plan.tlo?.url ? (
        <image
          href={plan.tlo.url}
          x="0"
          y="0"
          width="100"
          height="100"
          preserveAspectRatio="xMidYMid meet"
          opacity={plan.tlo.opacity ?? 0.5}
        />
      ) : null}

      {plan.pomieszczenia.map((p) => {
        const jestSalaGlowna = plan.sala_glowna_id === p.id;
        return (
          <g key={p.id}>
            <rect
              x={p.x}
              y={p.y}
              width={p.w}
              height={p.h}
              fill={p.color}
              fillOpacity={0.55}
              stroke={jestSalaGlowna ? "#15803d" : "#44403c"}
              strokeWidth={jestSalaGlowna ? 0.45 : 0.25}
              strokeDasharray={jestSalaGlowna ? undefined : undefined}
              rx="0.4"
              className={trybInteraktywny ? "cursor-pointer" : undefined}
              onClick={trybInteraktywny && onClickPomieszczenie ? () => onClickPomieszczenie(p.id) : undefined}
            />
            <text
              x={p.x + 1.2}
              y={p.y + 3.5}
              fill="#1c1917"
              fontSize={p.w < 18 ? 2.2 : 2.8}
              fontWeight="700"
              className="select-none pointer-events-none"
            >
              {p.lp}
              {jestSalaGlowna ? " ★" : ""}
            </text>
            <text
              x={p.x + 1.2}
              y={p.y + 6.5}
              fill="#292524"
              fontSize={p.w < 18 ? 1.85 : 2.1}
              fontWeight="600"
              className="select-none pointer-events-none"
            >
              {p.nazwa.length > 28 ? `${p.nazwa.slice(0, 26)}…` : p.nazwa}
            </text>
          </g>
        );
      })}

      {arch.map((el) => (
        <g
          key={el.id}
          className={trybInteraktywny ? "cursor-pointer" : undefined}
          onClick={trybInteraktywny && onClickArch ? () => onClickArch(el.id) : undefined}
        >
          <ZnacznikArch el={el} uid={uid} podswietlony={podswietloneArchId === el.id} />
        </g>
      ))}

      {pokazPolnoc ? (
        <g aria-hidden transform="translate(82,4)">
          <circle cx="6" cy="6" r="5.5" fill="white" fillOpacity="0.92" stroke="#57534e" strokeWidth="0.2" />
          <path
            d="M 6 1.2 L 7.8 8.2 L 6 6.8 L 4.2 8.2 Z"
            fill="#14532d"
            stroke="#14532d"
            strokeWidth="0.15"
            strokeLinejoin="round"
          />
          <text x="6" y="11.2" textAnchor="middle" fill="#44403c" fontSize="2.4" fontWeight="700" className="select-none">
            N
          </text>
        </g>
      ) : null}
    </svg>
  );
}
