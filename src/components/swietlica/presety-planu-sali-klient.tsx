"use client";

import { useCallback, useState, useTransition } from "react";
import type { PlanSaliJson, PresetPlanuSali } from "@/lib/swietlica/plan-sali";
import { klonPlanuSali } from "@/lib/swietlica/plan-sali";
import { zapiszPresetPlanuSali, usunPresetPlanuSali } from "@/app/(site)/panel/soltys/akcje";

type Props = {
  hallId: string;
  aktualnyPlan: PlanSaliJson;
  presety: PresetPlanuSali[];
  onWczytajPreset: (plan: PlanSaliJson) => void;
};

export function PresetyPlanuSaliKlient({ hallId, aktualnyPlan, presety, onWczytajPreset }: Props) {
  const [nazwa, ustawNazwa] = useState("");
  const [komunikat, ustawKomunikat] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const zapiszPreset = useCallback(() => {
    const n = nazwa.trim();
    if (!n) {
      ustawKomunikat("Podaj nazwę wariantu (np. Bankiet 80 osób).");
      return;
    }
    startTransition(async () => {
      const w = await zapiszPresetPlanuSali(hallId, n, klonPlanuSali(aktualnyPlan));
      if ("blad" in w) {
        ustawKomunikat(w.blad);
        return;
      }
      ustawNazwa("");
      ustawKomunikat(`Zapisano wariant „${n}".`);
    });
  }, [hallId, nazwa, aktualnyPlan]);

  const usun = useCallback(
    (id: string) => {
      if (!window.confirm("Usunąć ten zapisany wariant?")) return;
      startTransition(async () => {
        const w = await usunPresetPlanuSali(hallId, id);
        if ("blad" in w) ustawKomunikat(w.blad);
        else ustawKomunikat("Usunięto wariant.");
      });
    },
    [hallId],
  );

  return (
    <div className="mt-4 rounded-xl border border-violet-200/80 bg-violet-50/30 p-4">
      <p className="text-sm font-semibold text-violet-950">Zapisane warianty planu</p>
      <p className="mt-1 text-xs text-stone-600">Bankiet, zebranie, warsztaty — szybkie przełączanie między układami.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          value={nazwa}
          onChange={(e) => ustawNazwa(e.target.value)}
          placeholder="Nazwa wariantu…"
          maxLength={80}
          className="min-w-[160px] flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm"
        />
        <button
          type="button"
          disabled={pending}
          onClick={zapiszPreset}
          className="rounded-lg bg-violet-800 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          Zapisz bieżący plan
        </button>
      </div>
      {presety.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {presety.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2">
              <span className="text-sm font-medium text-stone-800">{p.nazwa}</span>
              <span className="text-xs text-stone-500">{p.plan.elementy.length} elementów</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onWczytajPreset(p.plan)}
                  className="rounded border border-emerald-600 px-2 py-1 text-xs font-medium text-emerald-900"
                >
                  Wczytaj
                </button>
                <button type="button" onClick={() => usun(p.id)} className="rounded border border-red-200 px-2 py-1 text-xs text-red-800">
                  Usuń
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-stone-500">Brak zapisanych wariantów — ustaw stoły i kliknij „Zapisz bieżący plan”.</p>
      )}
      {komunikat ? <p className="mt-2 text-xs text-violet-900">{komunikat}</p> : null}
    </div>
  );
}
