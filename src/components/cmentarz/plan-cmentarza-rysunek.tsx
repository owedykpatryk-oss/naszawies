import type { PointerEvent as ReactPointerEvent } from "react";
import type { KafelSatelitarny } from "@/lib/cmentarz/podklad-satelitarny";
import type { ElementPlanuCmentarza, PlanCmentarzaJson } from "@/lib/cmentarz/plan-cmentarza";

const VB_W = 100;
const VB_H = 70;

/** Szerokość niewidocznej strefy chwytu (viewBox). */
export const SLUP_PALCA_CMENTARZ = 1.6;

const KOLORY: Record<string, { fill: string; stroke: string }> = {
  kwatera: { fill: "rgba(231,229,228,0.88)", stroke: "#78716c" },
  rzad: { fill: "rgba(214,211,209,0.88)", stroke: "#57534e" },
  grob: { fill: "rgba(250,250,249,0.92)", stroke: "#44403c" },
  sciezka: { fill: "rgba(245,245,244,0.75)", stroke: "#a8a29e" },
  brama: { fill: "rgba(254,243,199,0.9)", stroke: "#b45309" },
  kaplica: { fill: "rgba(237,233,254,0.9)", stroke: "#6d28d9" },
  inne: { fill: "rgba(243,244,246,0.88)", stroke: "#9ca3af" },
};

type Props = {
  plan: PlanCmentarzaJson;
  className?: string;
  podswietlId?: string | null;
  /** Pojedynczy kafelek (legacy) */
  tloUrl?: string | null;
  /** Siatka kafelków satelitarnych — lepsze dopasowanie niż jeden kafelek */
  kafelkiSatelitarne?: KafelSatelitarny[];
  /** Obrys cmentarza (GeoJSON) — ścieżka SVG w viewBox po georeferencji */
  sciezkaObrysu?: string | null;
  tloOpacity?: number;
  onElementClick?: (id: string) => void;
  /** Tryb edytora — przeciąganie, większe strefy kliku */
  trybEdycji?: boolean;
  /** Krok siatki wizualnej (viewBox); domyślnie 5 */
  krokSiatki?: number;
  onPointerDownElement?: (e: ReactPointerEvent, id: string) => void;
  onPointerDownResize?: (e: ReactPointerEvent, id: string) => void;
};

export function PlanCmentarzaRysunek({
  plan,
  className,
  podswietlId = null,
  tloUrl,
  kafelkiSatelitarne = [],
  sciezkaObrysu = null,
  tloOpacity = 0.55,
  onElementClick,
  trybEdycji = false,
  krokSiatki = 5,
  onPointerDownElement,
  onPointerDownResize,
}: Props) {
  const wTle = kafelkiSatelitarne.length > 0 || tloUrl;

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      className={className}
      role="img"
      aria-label="Plan cmentarza"
      preserveAspectRatio="xMidYMid meet"
      style={trybEdycji ? { touchAction: "none" } : undefined}
    >
      <title>Plan cmentarza</title>
      <rect x="0" y="0" width={VB_W} height={VB_H} fill="#f5f1e8" />
      {kafelkiSatelitarne.length > 0
        ? kafelkiSatelitarne.map((k, i) => (
            <image
              key={`${k.url}-${i}`}
              href={k.url}
              x={k.x}
              y={k.y}
              width={k.szer}
              height={k.wys}
              opacity={tloOpacity}
              preserveAspectRatio="none"
            />
          ))
        : tloUrl ? (
            <image
              href={tloUrl}
              x="0"
              y="0"
              width={VB_W}
              height={VB_H}
              opacity={tloOpacity}
              preserveAspectRatio="xMidYMid slice"
            />
          ) : null}
      {wTle ? (
        <rect x="0" y="0" width={VB_W} height={VB_H} fill="rgba(255,255,255,0.08)" pointerEvents="none" />
      ) : null}
      {sciezkaObrysu ? (
        <path
          d={sciezkaObrysu}
          fill="rgba(34,197,94,0.12)"
          stroke="#15803d"
          strokeWidth="0.35"
          strokeDasharray="1.2 0.8"
          pointerEvents="none"
        />
      ) : null}
      <defs>
        <pattern id="siatka-cmentarz" width={krokSiatki} height={krokSiatki} patternUnits="userSpaceOnUse">
          <path
            d={`M ${krokSiatki} 0 L 0 0 0 ${krokSiatki}`}
            fill="none"
            stroke="#c4b8a8"
            strokeWidth="0.08"
          />
        </pattern>
      </defs>
      <rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#siatka-cmentarz)" opacity={wTle ? 0.25 : 0.4} pointerEvents="none" />
      {plan.elementy.map((el) => (
        <ElementSvg
          key={el.id}
          el={el}
          aktywny={el.id === podswietlId}
          trybEdycji={trybEdycji}
          onClick={onElementClick}
          onPointerDown={onPointerDownElement}
          onPointerDownResize={onPointerDownResize}
        />
      ))}
    </svg>
  );
}

function ElementSvg({
  el,
  aktywny,
  trybEdycji,
  onClick,
  onPointerDown,
  onPointerDownResize,
}: {
  el: ElementPlanuCmentarza;
  aktywny: boolean;
  trybEdycji: boolean;
  onClick?: (id: string) => void;
  onPointerDown?: (e: ReactPointerEvent, id: string) => void;
  onPointerDownResize?: (e: ReactPointerEvent, id: string) => void;
}) {
  const kol = KOLORY[el.typ] ?? KOLORY.inne;
  const cx = el.x + el.szer / 2;
  const cy = el.y + el.wys / 2;
  const fontSize = el.typ === "grob" ? 2.2 : el.typ === "rzad" ? 2.4 : 3;
  const hx1 = Math.max(0, el.x - SLUP_PALCA_CMENTARZ);
  const hy1 = Math.max(0, el.y - SLUP_PALCA_CMENTARZ);
  const hx2 = Math.min(VB_W, el.x + el.szer + SLUP_PALCA_CMENTARZ);
  const hy2 = Math.min(VB_H, el.y + el.wys + SLUP_PALCA_CMENTARZ);
  const interaktywny = trybEdycji ? onPointerDown : onClick;

  return (
    <g transform={`rotate(${el.obrot ?? 0} ${cx} ${cy})`}>
      {trybEdycji && onPointerDown ? (
        <rect
          x={hx1}
          y={hy1}
          width={hx2 - hx1}
          height={hy2 - hy1}
          fill="rgba(0,0,0,0.01)"
          stroke="none"
          className="cursor-grab active:cursor-grabbing"
          onPointerDown={(ev) => onPointerDown(ev, el.id)}
        />
      ) : null}
      <g
        className={interaktywny && !trybEdycji ? "cursor-pointer" : undefined}
        onClick={!trybEdycji && onClick ? () => onClick(el.id) : undefined}
        onKeyDown={
          !trybEdycji && onClick
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") onClick(el.id);
              }
            : undefined
        }
        role={!trybEdycji && onClick ? "button" : undefined}
        tabIndex={!trybEdycji && onClick ? 0 : undefined}
      >
        <rect
          x={el.x}
          y={el.y}
          width={el.szer}
          height={el.wys}
          fill={kol.fill}
          stroke={aktywny ? "#b45309" : kol.stroke}
          strokeWidth={aktywny ? 0.55 : 0.25}
          rx={el.typ === "grob" ? 0.3 : el.typ === "sciezka" ? 0.2 : 0.8}
          pointerEvents={trybEdycji ? "none" : "all"}
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
      {trybEdycji && aktywny && onPointerDownResize ? (
        <rect
          x={el.x + el.szer - 1.2}
          y={el.y + el.wys - 1.2}
          width={2.4}
          height={2.4}
          fill="#b45309"
          stroke="#fff"
          strokeWidth={0.2}
          rx={0.3}
          className="cursor-se-resize"
          onPointerDown={(ev) => {
            ev.stopPropagation();
            onPointerDownResize(ev, el.id);
          }}
        />
      ) : null}
    </g>
  );
}
