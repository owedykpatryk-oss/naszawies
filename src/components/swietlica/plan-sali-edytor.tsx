"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import type { ElementPlanuSali, PlanSaliJson, TypElementuPlanu } from "@/lib/swietlica/plan-sali";
import { zapiszPlanSali } from "@/app/(site)/panel/soltys/akcje";
import { PlanSaliRysunek } from "./plan-sali-rysunek";

type Props = {
  hallId: string;
  poczatkowyPlan: PlanSaliJson;
};

function nowyStol(typ: TypElementuPlanu): ElementPlanuSali {
  return {
    id: crypto.randomUUID(),
    typ,
    x: 12,
    y: 12,
    szer: typ === "stol_okragly" ? 10 : 14,
    wys: typ === "stol_okragly" ? 10 : 9,
    obrot: 0,
    etykieta: "S",
    miejsca: typ === "lawka" ? 4 : 8,
    szer_cm: typ === "stol_okragly" ? 120 : 180,
    dl_cm: typ === "stol_okragly" ? 120 : 80,
  };
}

export function PlanSaliEdytor({ hallId, poczatkowyPlan }: Props) {
  const [plan, ustawPlan] = useState<PlanSaliJson>(() => ({
    wersja: 1,
    szerokosc_sali_m: poczatkowyPlan.szerokosc_sali_m,
    dlugosc_sali_m: poczatkowyPlan.dlugosc_sali_m,
    elementy: [...poczatkowyPlan.elementy],
  }));
  const [wybrany, ustawWybrany] = useState<string | null>(null);
  const [komunikat, ustawKomunikat] = useState<{ typ: "ok" | "blad"; t: string } | null>(null);
  const [oczekuje, startTransition] = useTransition();
  const wrapRef = useRef<HTMLDivElement>(null);
  const przeciag = useRef<{ id: string; startClientX: number; startClientY: number; startX: number; startY: number } | null>(
    null
  );

  const ustawElement = useCallback((id: string, patch: Partial<ElementPlanuSali>) => {
    ustawPlan((p) => ({
      ...p,
      elementy: p.elementy.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  }, []);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = przeciag.current;
      const wrap = wrapRef.current;
      if (!d || !wrap) return;
      const r = wrap.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      ustawPlan((p) => {
        const el = p.elementy.find((x) => x.id === d.id);
        if (!el) return p;
        const dx = ((e.clientX - d.startClientX) / r.width) * 100;
        const dy = ((e.clientY - d.startClientY) / r.height) * 70;
        const nx = Math.min(100 - el.szer, Math.max(0, d.startX + dx));
        const ny = Math.min(70 - el.wys, Math.max(0, d.startY + dy));
        return {
          ...p,
          elementy: p.elementy.map((x) => (x.id === d.id ? { ...x, x: nx, y: ny } : x)),
        };
      });
    };
    const up = () => {
      przeciag.current = null;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, []);

  const usunWybrany = () => {
    if (!wybrany) return;
    ustawPlan((p) => ({ ...p, elementy: p.elementy.filter((e) => e.id !== wybrany) }));
    ustawWybrany(null);
  };

  const onPointerDownEl = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    ustawWybrany(id);
    const el = plan.elementy.find((x) => x.id === id);
    if (!el) return;
    przeciag.current = {
      id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: el.x,
      startY: el.y,
    };
    e.preventDefault();
  };

  const zapisz = () => {
    ustawKomunikat(null);
    startTransition(async () => {
      const w = await zapiszPlanSali(hallId, plan);
      if ("blad" in w) {
        ustawKomunikat({ typ: "blad", t: w.blad });
        return;
      }
      ustawKomunikat({ typ: "ok", t: "Plan zapisany w bazie." });
    });
  };

  const wybranyEl = wybrany ? plan.elementy.find((e) => e.id === wybrany) : null;

  return (
    <section className="mt-10 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="font-serif text-xl text-green-950">Plan sali (układ stołów)</h2>
      <p className="mt-1 text-sm text-stone-600">
        Przeciągaj stoły na planie. Wymiary w centymetrach trafiają do dokumentu wynajmu. Mieszkaniec widzi ten sam
        schemat przy sali.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            ustawPlan((p) => ({
              ...p,
              elementy: [...p.elementy, nowyStol("stol_prostokatny")],
            }))
          }
          className="rounded-lg bg-green-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-900"
        >
          + Stół prostokątny
        </button>
        <button
          type="button"
          onClick={() =>
            ustawPlan((p) => ({
              ...p,
              elementy: [...p.elementy, nowyStol("stol_okragly")],
            }))
          }
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-50"
        >
          + Stół okrągły
        </button>
        <button
          type="button"
          onClick={() =>
            ustawPlan((p) => ({
              ...p,
              elementy: [...p.elementy, nowyStol("lawka")],
            }))
          }
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-50"
        >
          + Ławka
        </button>
        <button
          type="button"
          onClick={usunWybrany}
          disabled={!wybrany}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-800 hover:bg-red-50 disabled:opacity-40"
        >
          Usuń zaznaczony
        </button>
        <button
          type="button"
          disabled={oczekuje}
          onClick={zapisz}
          className="rounded-lg bg-stone-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60"
        >
          {oczekuje ? "Zapisywanie…" : "Zapisz plan"}
        </button>
      </div>

      {komunikat ? (
        <p
          className={
            komunikat.typ === "ok"
              ? "mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-900"
              : "mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800"
          }
          role="status"
        >
          {komunikat.t}
        </p>
      ) : null}

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div
          ref={wrapRef}
          className="relative overflow-hidden rounded-xl border border-stone-200 bg-[#faf8f3]"
          onPointerDown={() => ustawWybrany(null)}
        >
          <svg viewBox="0 0 100 70" className="aspect-[10/7] w-full touch-none select-none">
            <rect x="0" y="0" width="100" height="70" fill="#faf8f3" />
            <rect x="0.5" y="0.5" width="99" height="69" fill="none" stroke="#2d5a2d" strokeWidth="0.35" rx="0.4" />
            {plan.elementy.map((el) => {
              const zaznaczony = el.id === wybrany;
              const cx = el.x + el.szer / 2;
              const cy = el.y + el.wys / 2;
              const okr = el.typ === "stol_okragly";
              return (
                <g key={el.id} transform={`rotate(${el.obrot}, ${cx}, ${cy})`}>
                  {okr ? (
                    <ellipse
                      cx={cx}
                      cy={cy}
                      rx={el.szer / 2}
                      ry={el.wys / 2}
                      fill={zaznaczony ? "#c8e6b8" : "#e8f0e3"}
                      stroke={zaznaczony ? "#d4a017" : "#2d5a2d"}
                      strokeWidth={zaznaczony ? 0.45 : 0.2}
                      className="cursor-grab active:cursor-grabbing"
                      onPointerDown={(ev) => onPointerDownEl(ev, el.id)}
                    />
                  ) : (
                    <rect
                      x={el.x}
                      y={el.y}
                      width={el.szer}
                      height={el.wys}
                      fill={zaznaczony ? "#c8e6b8" : el.typ === "lawka" ? "#ebe5d4" : "#d4e8c8"}
                      stroke={zaznaczony ? "#d4a017" : "#2d5a2d"}
                      strokeWidth={zaznaczony ? 0.45 : 0.2}
                      rx="0.25"
                      className="cursor-grab active:cursor-grabbing"
                      onPointerDown={(ev) => onPointerDownEl(ev, el.id)}
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
                    pointerEvents="none"
                  >
                    {el.etykieta}
                  </text>
                </g>
              );
            })}
          </svg>
          <p className="border-t border-stone-200 px-3 py-2 text-center text-xs text-stone-500">
            Zaznacz element i przeciągnij. Klik w tło — odznaczenie.
          </p>
        </div>

        <div className="space-y-4 rounded-xl border border-stone-100 bg-stone-50 p-4 text-sm">
          <p className="font-medium text-stone-800">Wymiary sali (do dokumentu)</p>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-stone-600">
              Szer. (m)
              <input
                type="number"
                min={0}
                step={0.1}
                value={plan.szerokosc_sali_m ?? ""}
                onChange={(e) =>
                  ustawPlan((p) => ({
                    ...p,
                    szerokosc_sali_m: e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
                className="mt-0.5 w-full rounded border border-stone-300 px-2 py-1"
              />
            </label>
            <label className="text-xs text-stone-600">
              Dł. (m)
              <input
                type="number"
                min={0}
                step={0.1}
                value={plan.dlugosc_sali_m ?? ""}
                onChange={(e) =>
                  ustawPlan((p) => ({
                    ...p,
                    dlugosc_sali_m: e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
                className="mt-0.5 w-full rounded border border-stone-300 px-2 py-1"
              />
            </label>
          </div>

          {wybranyEl ? (
            <div className="space-y-2 border-t border-stone-200 pt-3">
              <p className="font-medium text-stone-800">Zaznaczony element</p>
              <label className="block text-xs text-stone-600">
                Etykieta
                <input
                  value={wybranyEl.etykieta}
                  onChange={(e) => ustawElement(wybranyEl.id, { etykieta: e.target.value.slice(0, 24) })}
                  className="mt-0.5 w-full rounded border border-stone-300 px-2 py-1"
                />
              </label>
              <label className="block text-xs text-stone-600">
                Obrót (°)
                <input
                  type="number"
                  min={0}
                  max={359}
                  value={wybranyEl.obrot}
                  onChange={(e) => ustawElement(wybranyEl.id, { obrot: Number(e.target.value) || 0 })}
                  className="mt-0.5 w-full rounded border border-stone-300 px-2 py-1"
                />
              </label>
              <label className="block text-xs text-stone-600">
                Miejsca
                <input
                  type="number"
                  min={0}
                  max={500}
                  value={wybranyEl.miejsca ?? ""}
                  onChange={(e) =>
                    ustawElement(wybranyEl.id, {
                      miejsca: e.target.value === "" ? undefined : Number(e.target.value),
                    })
                  }
                  className="mt-0.5 w-full rounded border border-stone-300 px-2 py-1"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-stone-600">
                  Szer. cm
                  <input
                    type="number"
                    min={1}
                    value={wybranyEl.szer_cm ?? ""}
                    onChange={(e) =>
                      ustawElement(wybranyEl.id, {
                        szer_cm: e.target.value === "" ? undefined : Number(e.target.value),
                      })
                    }
                    className="mt-0.5 w-full rounded border border-stone-300 px-2 py-1"
                  />
                </label>
                <label className="text-xs text-stone-600">
                  Dł. cm
                  <input
                    type="number"
                    min={1}
                    value={wybranyEl.dl_cm ?? ""}
                    onChange={(e) =>
                      ustawElement(wybranyEl.id, {
                        dl_cm: e.target.value === "" ? undefined : Number(e.target.value),
                      })
                    }
                    className="mt-0.5 w-full rounded border border-stone-300 px-2 py-1"
                  />
                </label>
              </div>
            </div>
          ) : (
            <p className="text-xs text-stone-500">Wybierz element na planie.</p>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-stone-100 bg-stone-50 p-3">
        <p className="text-xs font-medium text-stone-700">Podgląd (jak u mieszkańca)</p>
        <PlanSaliRysunek plan={plan} className="mt-2 max-h-52 w-full max-w-md" />
      </div>
    </section>
  );
}
