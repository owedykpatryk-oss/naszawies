"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import type { PlanSaliJson } from "@/lib/swietlica/plan-sali";
import { klonPlanuSali, sumaMiejscWPlanie } from "@/lib/swietlica/plan-sali";
import { PlanSaliRysunek, type ZnacznikNaPlanie } from "./plan-sali-rysunek";

type Props = {
  poczatkowyPlan: PlanSaliJson;
  znaczniki?: ZnacznikNaPlanie[];
  onPlanChange?: (plan: PlanSaliJson) => void;
  tylkoOdczyt?: boolean;
  maxGosci?: number | null;
};

/** Uproszczony edytor planu dla mieszkańca (rezerwacja „własny układ"). */
export function PlanRezerwacjiEdytorKlient({
  poczatkowyPlan,
  znaczniki = [],
  onPlanChange,
  tylkoOdczyt = false,
  maxGosci = null,
}: Props) {
  const [plan, ustawPlan] = useState<PlanSaliJson>(() => klonPlanuSali(poczatkowyPlan));
  const [wybrany, ustawWybrany] = useState<string | null>(null);
  const przeciag = useRef<{ id: string; sx: number; sy: number; ox: number; oy: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();

  const suma = sumaMiejscWPlanie(plan);

  const powiadom = useCallback(
    (p: PlanSaliJson) => {
      ustawPlan(p);
      startTransition(() => onPlanChange?.(p));
    },
    [onPlanChange],
  );

  const wspDoPlanu = useCallback((clientX: number, clientY: number) => {
    const wrap = wrapRef.current;
    if (!wrap) return { x: 0, y: 0 };
    const r = wrap.getBoundingClientRect();
    return {
      x: Math.min(95, Math.max(0, ((clientX - r.left) / r.width) * 100)),
      y: Math.min(65, Math.max(0, ((clientY - r.top) / r.height) * 70)),
    };
  }, []);

  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-4">
      <p className="text-sm font-semibold text-sky-950">Twój układ sali</p>
      <p className="mt-1 text-xs text-stone-600">
        {tylkoOdczyt
          ? "Podgląd planu zapisany w rezerwacji."
          : "Przeciągnij stoły. Plan bazuje na układzie sołtysa — możesz go dostosować."}
      </p>
      <p className="mt-1 text-xs text-stone-700">
        Miejsca: <strong>{suma}</strong>
        {maxGosci != null ? ` / max ${maxGosci}` : ""}
      </p>
      <div ref={wrapRef} className="mt-3 touch-none">
        <svg viewBox="0 0 100 70" className="w-full max-h-64 bg-[#faf8f3] rounded-lg border border-stone-200">
          {znaczniki.map((z, i) => (
            <rect key={i} x={z.x} y={z.y} width={z.w} height={z.h} fill="#bae6fd" fillOpacity={0.5} stroke="#0369a1" strokeWidth="0.15" />
          ))}
          {plan.elementy.map((el) => (
            <g
              key={el.id}
              onPointerDown={
                tylkoOdczyt
                  ? undefined
                  : (ev) => {
                      ev.preventDefault();
                      const w = wspDoPlanu(ev.clientX, ev.clientY);
                      ustawWybrany(el.id);
                      przeciag.current = { id: el.id, sx: ev.clientX, sy: ev.clientY, ox: w.x - el.x, oy: w.y - el.y };
                    }
              }
              onPointerMove={
                tylkoOdczyt
                  ? undefined
                  : (ev) => {
                      if (!przeciag.current || przeciag.current.id !== el.id) return;
                      const w = wspDoPlanu(ev.clientX, ev.clientY);
                      powiadom({
                        ...plan,
                        elementy: plan.elementy.map((e) =>
                          e.id === el.id
                            ? {
                                ...e,
                                x: Math.min(100 - e.szer, Math.max(0, w.x - przeciag.current!.ox)),
                                y: Math.min(70 - e.wys, Math.max(0, w.y - przeciag.current!.oy)),
                              }
                            : e,
                        ),
                      });
                    }
              }
              onPointerUp={() => { przeciag.current = null; }}
            >
              <rect
                x={el.x}
                y={el.y}
                width={el.szer}
                height={el.wys}
                fill={el.typ === "stol_okragly" ? "#e8f0e3" : "#d4e8c8"}
                stroke={wybrany === el.id ? "#2563eb" : "#2d5a2d"}
                strokeWidth={wybrany === el.id ? 0.4 : 0.2}
                rx="0.3"
                className={tylkoOdczyt ? undefined : "cursor-grab"}
              />
              <text x={el.x + el.szer / 2} y={el.y + el.wys / 2} textAnchor="middle" dominantBaseline="middle" fontSize="2.5" fill="#1a2e1a">
                {el.etykieta}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="mt-2 hidden sm:block">
        <PlanSaliRysunek plan={plan} znaczniki={znaczniki} className="h-24 w-full opacity-70" />
      </div>
    </div>
  );
}
