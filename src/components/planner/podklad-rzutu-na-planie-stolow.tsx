import type { RzutParteruSaliJson } from "@/lib/swietlica/rzut-parteru-sali";
import {
  mapujPunktRzutuNaPlan,
  znacznikiNaPlanieStolow,
  znajdzSalaGlowna,
} from "@/lib/swietlica/mapowanie-rzutu-plan";

const KOLORY_ARCH: Record<string, { fill: string; stroke: string }> = {
  wejscie: { fill: "#fef3c7", stroke: "#b45309" },
  drzwi: { fill: "#fde68a", stroke: "#92400e" },
  drzwi_wew: { fill: "#fef9c3", stroke: "#a16207" },
  okno: { fill: "#bae6fd", stroke: "#0369a1" },
  rampa: { fill: "#d1fae5", stroke: "#047857" },
  sciana: { fill: "none", stroke: "#78716c" },
};

/** Rzut parteru (sala główna + drzwi/okna) jako półprzezroczysty podkład pod plan stołów 100×70. */
export function PodkladRzutuNaPlanieStolow({ rzut }: { rzut: RzutParteruSaliJson }) {
  const sala = znajdzSalaGlowna(rzut);
  const znaczniki = znacznikiNaPlanieStolow(rzut);

  let salaRect = null;
  if (sala) {
    const p1 = mapujPunktRzutuNaPlan(sala.x, sala.y, rzut);
    const p2 = mapujPunktRzutuNaPlan(sala.x + sala.w, sala.y + sala.h, rzut);
    salaRect = {
      x: p1.x,
      y: p1.y,
      w: Math.max(0.5, p2.x - p1.x),
      h: Math.max(0.5, p2.y - p1.y),
      nazwa: sala.nazwa,
    };
  }

  return (
    <g aria-hidden pointerEvents="none" opacity={0.85}>
      {salaRect ? (
        <>
          <rect
            x={salaRect.x}
            y={salaRect.y}
            width={salaRect.w}
            height={salaRect.h}
            fill="#e7e5e4"
            fillOpacity={0.45}
            stroke="#57534e"
            strokeWidth={0.35}
            strokeDasharray="1 0.6"
            rx={0.3}
          />
          <text
            x={salaRect.x + 1}
            y={salaRect.y + 3}
            fontSize={2}
            fill="#44403c"
            fontWeight="600"
          >
            {salaRect.nazwa.length > 22 ? `${salaRect.nazwa.slice(0, 20)}…` : salaRect.nazwa}
          </text>
        </>
      ) : null}
      {znaczniki.map((z) => {
        const kol = KOLORY_ARCH[z.typ] ?? KOLORY_ARCH.drzwi;
        return (
          <rect
            key={`${z.typ}-${z.x}-${z.y}-${z.etykieta}`}
            x={z.x}
            y={z.y}
            width={z.w}
            height={z.h}
            fill={kol.fill}
            fillOpacity={0.35}
            stroke={kol.stroke}
            strokeWidth={0.2}
            rx={0.15}
          />
        );
      })}
    </g>
  );
}
