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
