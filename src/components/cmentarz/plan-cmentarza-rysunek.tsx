import type { ElementPlanuCmentarza, PlanCmentarzaJson } from "@/lib/cmentarz/plan-cmentarza";

const VB_W = 100;
const VB_H = 70;

const KOLORY: Record<string, { fill: string; stroke: string }> = {
  kwatera: { fill: "#e7e5e4", stroke: "#78716c" },
  rzad: { fill: "#d6d3d1", stroke: "#57534e" },
  grob: { fill: "#fafaf9", stroke: "#44403c" },
  sciezka: { fill: "#f5f5f4", stroke: "#a8a29e" },
  brama: { fill: "#fef3c7", stroke: "#b45309" },
  kaplica: { fill: "#ede9fe", stroke: "#6d28d9" },
  inne: { fill: "#f3f4f6", stroke: "#9ca3af" },
};

type Props = {
  plan: PlanCmentarzaJson;
  className?: string;
  podswietlId?: string | null;
  tloUrl?: string | null;
  tloOpacity?: number;
  onElementClick?: (id: string) => void;
};

export function PlanCmentarzaRysunek({
  plan,
  className,
  podswietlId = null,
  tloUrl,
  tloOpacity = 0.35,
  onElementClick,
}: Props) {
  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      className={className}
      role="img"
      aria-label="Plan cmentarza"
      preserveAspectRatio="xMidYMid meet"
    >
      <title>Plan cmentarza</title>
      <rect x="0" y="0" width={VB_W} height={VB_H} fill="#f5f1e8" />
      {tloUrl ? (
        <image href={tloUrl} x="0" y="0" width={VB_W} height={VB_H} opacity={tloOpacity} preserveAspectRatio="xMidYMid slice" />
      ) : null}
      <rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#siatka-cmentarz)" opacity={0.4} />
      <defs>
        <pattern id="siatka-cmentarz" width="5" height="5" patternUnits="userSpaceOnUse">
          <path d="M 5 0 L 0 0 0 5" fill="none" stroke="#c4b8a8" strokeWidth="0.08" />
        </pattern>
      </defs>
      {plan.elementy.map((el) => (
        <ElementSvg key={el.id} el={el} aktywny={el.id === podswietlId} onClick={onElementClick} />
      ))}
    </svg>
  );
}

function ElementSvg({
  el,
  aktywny,
  onClick,
}: {
  el: ElementPlanuCmentarza;
  aktywny: boolean;
  onClick?: (id: string) => void;
}) {
  const kol = KOLORY[el.typ] ?? KOLORY.inne;
  const cx = el.x + el.szer / 2;
  const cy = el.y + el.wys / 2;
  const fontSize = el.typ === "grob" ? 2.2 : el.typ === "rzad" ? 2.4 : 3;

  return (
    <g
      transform={`rotate(${el.obrot ?? 0} ${cx} ${cy})`}
      className={onClick ? "cursor-pointer" : undefined}
      onClick={onClick ? () => onClick(el.id) : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick(el.id);
            }
          : undefined
      }
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <rect
        x={el.x}
        y={el.y}
        width={el.szer}
        height={el.wys}
        fill={kol.fill}
        stroke={aktywny ? "#b45309" : kol.stroke}
        strokeWidth={aktywny ? 0.5 : 0.25}
        rx={el.typ === "grob" ? 0.3 : el.typ === "sciezka" ? 0.2 : 0.8}
        opacity={el.typ === "sciezka" ? 0.85 : 1}
      />
      {el.etykieta && el.typ !== "sciezka" ? (
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={fontSize}
          fill="#292524"
          pointerEvents="none"
        >
          {el.etykieta.length > 10 ? `${el.etykieta.slice(0, 9)}…` : el.etykieta}
        </text>
      ) : null}
    </g>
  );
}
