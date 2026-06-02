"use client";

import { PRESETY_HARMONOGRAMU_SPORT, type PresetHarmonogramuSport } from "@/lib/wies/harmonogram-presety-sport";

type Props = {
  formId: string;
};

function ustawPole(form: HTMLFormElement, name: string, value: string) {
  const el = form.elements.namedItem(name);
  if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
    el.value = value;
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

export function PresetyHarmonogramuSportKlient({ formId }: Props) {
  function zastosuj(p: PresetHarmonogramuSport) {
    const form = document.getElementById(formId);
    if (!(form instanceof HTMLFormElement)) return;
    ustawPole(form, "day_of_week", String(p.day_of_week));
    ustawPole(form, "time_start", p.time_start);
    ustawPole(form, "time_end", p.time_end ?? "");
    ustawPole(form, "title", p.title);
    ustawPole(form, "description", p.description);
    form.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  return (
    <div className="mt-3">
      <p className="text-xs font-medium text-teal-900">Szablony (kliknij, potem zapisz formularz):</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {PRESETY_HARMONOGRAMU_SPORT.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => zastosuj(p)}
            className="rounded-full border border-teal-300 bg-white px-3 py-1 text-xs font-medium text-teal-900 hover:bg-teal-50"
          >
            {p.etykieta}
          </button>
        ))}
      </div>
    </div>
  );
}
