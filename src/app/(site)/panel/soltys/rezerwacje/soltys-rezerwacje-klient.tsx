"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { odrzucRezerwacjeSwietlicy, zatwierdzRezerwacjeSwietlicy } from "../akcje";

export type WierszRezerwacji = {
  id: string;
  hall_id: string;
  sala_nazwa: string;
  mieszkaniec: string;
  start_at: string;
  end_at: string;
  event_type: string;
  event_title: string | null;
  expected_guests: number;
  has_alcohol: boolean | null;
  contact_phone: string | null;
  requested_inventory: { name: string; quantity: number; available: number | null }[];
  suggested_layout: string;
  preparation_warnings: string[];
  procurement_recommendations: string[];
  created_at: string;
};

type Props = { wiersze: WierszRezerwacji[] };

export function SoltysRezerwacjeKlient({ wiersze: poczatkowe }: Props) {
  const router = useRouter();
  const [odrzucDla, ustawOdrzucDla] = useState<string | null>(null);
  const [powod, ustawPowod] = useState("");
  const [blad, ustawBlad] = useState("");
  const [oczekuje, startTransition] = useTransition();

  function formatRange(a: string, b: string) {
    const s = new Date(a).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });
    const e = new Date(b).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });
    return `${s} — ${e}`;
  }

  async function zatwierdz(id: string) {
    ustawBlad("");
    startTransition(async () => {
      const w = await zatwierdzRezerwacjeSwietlicy(id);
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawOdrzucDla(null);
      router.refresh();
    });
  }

  async function odrzuc(id: string) {
    ustawBlad("");
    startTransition(async () => {
      const w = await odrzucRezerwacjeSwietlicy(id, powod);
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawOdrzucDla(null);
      ustawPowod("");
      router.refresh();
    });
  }

  function drukujChecklisty(r: WierszRezerwacji) {
    const warnings = r.preparation_warnings.length
      ? `<ul>${r.preparation_warnings.map((w) => `<li>${w}</li>`).join("")}</ul>`
      : "<p>Brak automatycznych alertów.</p>";
    const asortyment = r.requested_inventory.length
      ? `<ul>${r.requested_inventory
          .map(
            (i) =>
              `<li>${i.name}: ${i.quantity} szt.${i.available != null ? ` (dostępne: ${i.available})` : ""}</li>`
          )
          .join("")}</ul>`
      : "<p>Brak zamówionego asortymentu.</p>";
    const rekomendacje = r.procurement_recommendations.length
      ? `<ul>${r.procurement_recommendations.map((x) => `<li>${x}</li>`).join("")}</ul>`
      : "<p>Brak dodatkowych rekomendacji zakupowych.</p>";
    const html = `
      <html><head><meta charset="utf-8"/><title>Checklista przygotowania</title>
      <style>body{font-family:Arial,sans-serif;padding:24px;line-height:1.5} h1{margin:0 0 10px} h2{margin:18px 0 8px} .muted{color:#555}</style>
      </head><body>
      <h1>Checklista przygotowania wydarzenia</h1>
      <p class="muted">${r.sala_nazwa} · ${new Date(r.start_at).toLocaleString("pl-PL")} — ${new Date(r.end_at).toLocaleString("pl-PL")}</p>
      <p><strong>Mieszkaniec:</strong> ${r.mieszkaniec}</p>
      <p><strong>Typ:</strong> ${r.event_type}${r.event_title ? ` — ${r.event_title}` : ""}</p>
      <p><strong>Goście:</strong> ${r.expected_guests} · <strong>Układ sali:</strong> ${r.suggested_layout}</p>
      <h2>Alerty przygotowania</h2>
      ${warnings}
      <h2>Zamówiony asortyment</h2>
      ${asortyment}
      <h2>Rekomendacje przygotowania / zakupów</h2>
      ${rekomendacje}
      <h2>Checklista operacyjna</h2>
      <ul>
        <li>Sprawdź układ sali i drożność przejść.</li>
        <li>Zweryfikuj dostępność zamówionego asortymentu.</li>
        <li>Potwierdź kontakt z organizatorem wydarzenia.</li>
        <li>Przygotuj protokół po wydarzeniu (stan sali / ewentualne szkody).</li>
      </ul>
      </body></html>
    `;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  }

  if (poczatkowe.length === 0) {
    return <p className="mt-4 text-sm text-stone-600">Brak oczekujących wniosków o rezerwację.</p>;
  }

  return (
    <div className="mt-6 space-y-4">
      {blad ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {blad}
        </p>
      ) : null}
      <ul className="space-y-4">
      {poczatkowe.map((r) => (
        <li key={r.id} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <p className="font-medium text-stone-900">{r.sala_nazwa}</p>
          <p className="text-xs text-stone-500">
            {r.mieszkaniec} · złożono {new Date(r.created_at).toLocaleString("pl-PL")}
          </p>
          <p className="mt-2 text-sm text-stone-800">{formatRange(r.start_at, r.end_at)}</p>
          <p className="mt-1 text-sm text-stone-600">
            {r.event_type}
            {r.event_title ? ` — ${r.event_title}` : ""} · {r.expected_guests} os.
            {r.has_alcohol ? " · alkohol: tak" : ""}
            {r.contact_phone ? ` · tel. ${r.contact_phone}` : ""}
          </p>
          <p className="mt-1 text-xs text-stone-500">Sugerowany układ sali: {r.suggested_layout}</p>
          {r.requested_inventory.length > 0 ? (
            <div className="mt-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
              <p className="text-xs font-medium text-stone-700">Zamówiony asortyment:</p>
              <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-stone-600">
                {r.requested_inventory.map((it, idx) => (
                  <li key={`${r.id}-${idx}`}>
                    {it.name}: <strong>{it.quantity}</strong>
                    {it.available != null && it.quantity > it.available ? (
                      <span className="ml-1 text-red-700">(brak: {it.quantity - it.available})</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {r.preparation_warnings.length > 0 ? (
            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="text-xs font-semibold text-amber-900">Alerty przygotowania:</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-amber-900">
                {r.preparation_warnings.map((w, i) => (
                  <li key={`${r.id}-warn-${i}`}>{w}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {r.procurement_recommendations.length > 0 ? (
            <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
              <p className="text-xs font-semibold text-emerald-900">Rekomendacje przygotowania / zakupów:</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-emerald-900">
                {r.procurement_recommendations.map((w, i) => (
                  <li key={`${r.id}-reco-${i}`}>{w}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {odrzucDla === r.id ? (
            <div className="mt-4 space-y-2 border-t border-stone-100 pt-4">
              <label className="block text-xs font-medium text-stone-600" htmlFor={`powod-${r.id}`}>
                Powód odrzucenia
              </label>
              <textarea
                id={`powod-${r.id}`}
                value={powod}
                onChange={(e) => ustawPowod(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                placeholder="np. Sala już zajęta w tym terminie"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={oczekuje}
                  onClick={() => odrzuc(r.id)}
                  className="rounded-lg bg-red-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-900 disabled:opacity-60"
                >
                  Potwierdź odrzucenie
                </button>
                <button
                  type="button"
                  onClick={() => {
                    ustawOdrzucDla(null);
                    ustawPowod("");
                  }}
                  className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-50"
                >
                  Anuluj
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={oczekuje}
                onClick={() => zatwierdz(r.id)}
                className="rounded-lg bg-green-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-60"
              >
                Zatwierdź
              </button>
              <button
                type="button"
                onClick={() => drukujChecklisty(r)}
                className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-50"
              >
                Drukuj checklistę
              </button>
              <button
                type="button"
                disabled={oczekuje}
                onClick={() => {
                  ustawOdrzucDla(r.id);
                  ustawPowod("");
                  ustawBlad("");
                }}
                className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-50"
              >
                Odrzuć
              </button>
            </div>
          )}
        </li>
      ))}
      </ul>
    </div>
  );
}
