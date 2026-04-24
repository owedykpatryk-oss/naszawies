import type { PlanSaliJson } from "@/lib/swietlica/plan-sali";

const VB_W = 100;
const VB_H = 70;

type Props = {
  plan: PlanSaliJson;
  className?: string;
};

/** Plan sali w skali 0–100 × 0–70 (proporcje sali na widoku). */
export function PlanSaliRysunek({ plan, className }: Props) {
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
      <rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#siatka-planu)" />
      <rect
        x="0.5"
        y="0.5"
        width={VB_W - 1}
        height={VB_H - 1}
        fill="none"
        stroke="#2d5a2d"
        strokeWidth="0.35"
        rx="0.4"
      />
      {plan.elementy.map((el) => {
        const cx = el.x + el.szer / 2;
        const cy = el.y + el.wys / 2;
        const jestOkragly = el.typ === "stol_okragly";
        return (
          <g key={el.id} transform={`rotate(${el.obrot}, ${cx}, ${cy})`}>
            {jestOkragly ? (
              <ellipse
                cx={cx}
                cy={cy}
                rx={el.szer / 2}
                ry={el.wys / 2}
                fill="#e8f0e3"
                stroke="#2d5a2d"
                strokeWidth="0.2"
              />
            ) : (
              <rect
                x={el.x}
                y={el.y}
                width={el.szer}
                height={el.wys}
                fill={el.typ === "lawka" ? "#ebe5d4" : "#d4e8c8"}
                stroke="#2d5a2d"
                strokeWidth="0.2"
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
              {el.etykieta || (el.typ === "stol_okragly" ? "○" : "▭")}
            </text>
            {el.miejsca != null && el.miejsca > 0 ? (
              <text
                x={cx}
                y={cy + 4}
                textAnchor="middle"
                fontSize="2"
                fill="#5a6b5a"
                style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
              >
                {el.miejsca} os.
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
