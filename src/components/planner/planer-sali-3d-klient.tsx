"use client";

import { Suspense, useMemo } from "react";
import type { ElementPlanuSali } from "@/lib/swietlica/plan-sali";

type Props = {
  elementy: ElementPlanuSali[];
  szerokoscSaliM?: number | null;
  dlugoscSaliM?: number | null;
};

function kolorTypu(typ: string): string {
  if (typ.includes("stol")) return "#8B6914";
  if (typ === "lawka") return "#6B5344";
  return "#94a3b8";
}

function wysokosc3d(typ: string): number {
  if (typ.includes("okrag")) return 0.75;
  if (typ.includes("prost")) return 0.7;
  return 0.5;
}

/** Widok izometryczny planu sali (CSS 3D — bez WebGL, działa wszędzie). */
export function PlanerSali3dKlient({ elementy, szerokoscSaliM, dlugoscSaliM }: Props) {
  const meta = useMemo(() => {
    const sumaMiejsc = elementy.reduce((s, e) => s + (e.miejsca ?? 0), 0);
    return { sumaMiejsc, liczba: elementy.length };
  }, [elementy]);

  return (
    <div className="rounded-2xl border border-stone-200 bg-gradient-to-b from-sky-50/80 to-stone-100/80 p-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="font-serif text-lg text-green-950">Plan sali 3D</h3>
          <p className="text-xs text-stone-600">
            {meta.liczba} elementów · {meta.sumaMiejsc} miejsc
            {szerokoscSaliM && dlugoscSaliM ? ` · sala ~${szerokoscSaliM}×${dlugoscSaliM} m` : ""}
          </p>
        </div>
      </div>

      <Suspense fallback={<div className="mt-4 h-64 animate-pulse rounded-xl bg-stone-200" />}>
        <div
          className="relative mt-4 mx-auto aspect-[4/3] max-h-[420px] w-full max-w-2xl overflow-hidden rounded-xl border border-stone-300/80 bg-stone-200/50"
          style={{ perspective: "900px" }}
        >
          <div
            className="absolute inset-[8%] origin-bottom"
            style={{
              transform: "rotateX(52deg) rotateZ(-38deg)",
              transformStyle: "preserve-3d",
            }}
          >
            {/* Podłoga */}
            <div
              className="absolute inset-0 rounded-sm border border-stone-400/40 bg-gradient-to-br from-amber-100/90 to-stone-200/90 shadow-inner"
              style={{ transform: "translateZ(0px)" }}
            />
            {elementy.map((el) => {
              const h = wysokosc3d(el.typ);
              const left = `${el.x}%`;
              const top = `${el.y}%`;
              const w = `${Math.max(el.szer, 2)}%`;
              const d = `${Math.max(el.wys, 2)}%`;
              return (
                <div
                  key={el.id}
                  className="absolute"
                  style={{
                    left,
                    top,
                    width: w,
                    height: d,
                    transform: `translateZ(${h * 20}px) rotate(${el.obrot ?? 0}deg)`,
                    transformStyle: "preserve-3d",
                  }}
                  title={el.etykieta ?? el.typ}
                >
                  <div
                    className="absolute inset-0 rounded-sm border border-black/10 shadow-md"
                    style={{ background: kolorTypu(el.typ), transform: `translateZ(${h * 30}px)` }}
                  />
                  <div
                    className="absolute left-0 top-0 h-full origin-left bg-black/15"
                    style={{ width: 4, transform: "rotateY(-90deg) translateZ(2px)" }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </Suspense>

      <p className="mt-3 text-center text-xs text-stone-500">
        Widok poglądowy układu stołów. Pełna edycja w panelu świetlicy (plan 2D).
      </p>
    </div>
  );
}
