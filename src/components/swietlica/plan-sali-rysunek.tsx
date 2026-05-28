import type { PlanSaliJson } from "@/lib/swietlica/plan-sali";

const VB_W = 100;
const VB_H = 70;

export type ZnacznikNaPlanie = {
  typ: string;
  etykieta: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

type Props = {
  plan: PlanSaliJson;
  className?: string;
  /** Znaczniki wejść/okien z rzutu parteru */
  znaczniki?: ZnacznikNaPlanie[];
  /** Półprzezroczyste tło rzutu (opcjonalnie) */
  tloUrl?: string | null;
  tloOpacity?: number;
};

const KOLORY_STREFY: Record<string, string> = {
  bufet: "#fef3c7",
  scena: "#fce7f3",
  taniec: "#e0e7ff",
  wyjscie: "#fee2e2",
  default: "#f3f4f6",
};

/** Plan sali w skali 0–100 × 0–70 (proporcje sali na widoku). */
export function PlanSaliRysunek({ plan, className, znaczniki = [], tloUrl, tloOpacity = 0.25 }: Props) {
  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      className={className}
      role="img"
      aria-label="Schemat ustawienia stołów i elementów w sali"
      preserveAspectRatio="xMidYMid meet"
    >
      <title>Plan sali</title>
      <defs>
        <pattern id="siatka-planu" width="5" height="5" patternUnits="userSpaceOnUse">
          <path d="M 5 0 L 0 0 0 5" fill="none" stroke="#c4b8a8" strokeWidth="0.08" opacity={0.45} />
        </pattern>
      </defs>
      <rect x="0" y="0" width={VB_W} height={VB_H} fill="#faf8f3" />
      {tloUrl ? (
        <image href={tloUrl} x="0" y="0" width={VB_W} height={VB_H} opacity={tloOpacity} preserveAspectRatio="xMidYMid meet" />
      ) : null}
      <rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#siatka-planu)" />
      <rect x="0.5" y="0.5" width={VB_W - 1} height={VB_H - 1} fill="none" stroke="#2d5a2d" strokeWidth="0.35" rx="0.4" />

      {znaczniki.map((z, i) => (
        <g key={`zn-${i}`}>
          <rect
            x={z.x}
            y={z.y}
            width={z.w}
            height={z.h}
            fill={z.typ === "okno" ? "#bae6fd" : z.typ === "rampa" ? "#d1fae5" : "#fef3c7"}
            fillOpacity={0.75}
            stroke="#57534e"
            strokeWidth="0.15"
            rx="0.15"
          />
          <text x={z.x + z.w / 2} y={z.y + z.h / 2} textAnchor="middle" dominantBaseline="middle" fontSize="1.8" fill="#1c1917" fontWeight="600">
            {z.etykieta}
          </text>
        </g>
      ))}

      {plan.elementy.map((el) => {
        const cx = el.x + el.szer / 2;
        const cy = el.y + el.wys / 2;
        const jestOkragly = el.typ === "stol_okragly";
        const jestStrefa = el.typ === "strefa";
        const kolorStrefy = jestStrefa
          ? KOLORY_STREFY[el.etykieta.toLowerCase()] ?? KOLORY_STREFY.default
          : undefined;
        return (
          <g key={el.id} transform={`rotate(${el.obrot}, ${cx}, ${cy})`}>
            {jestOkragly ? (
              <ellipse cx={cx} cy={cy} rx={el.szer / 2} ry={el.wys / 2} fill="#e8f0e3" stroke="#2d5a2d" strokeWidth="0.2" />
            ) : (
              <rect
                x={el.x}
                y={el.y}
                width={el.szer}
                height={el.wys}
                fill={jestStrefa ? kolorStrefy : el.typ === "lawka" ? "#ebe5d4" : "#d4e8c8"}
                fillOpacity={jestStrefa ? 0.55 : 1}
                stroke={jestStrefa ? "#78716c" : "#2d5a2d"}
                strokeWidth="0.2"
                strokeDasharray={jestStrefa ? "0.8 0.4" : undefined}
                rx="0.25"
              />
            )}
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="2.8"
              fill="#1a2e1a"
              fontWeight="600"
              style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
            >
              {el.etykieta || (jestOkragly ? "○" : jestStrefa ? "▢" : "▭")}
            </text>
            {el.miejsca != null && el.miejsca > 0 && !jestStrefa ? (
              <text x={cx} y={cy + 4} textAnchor="middle" fontSize="2" fill="#5a6b5a">
                {el.miejsca} os.
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
