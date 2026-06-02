"use client";

import { useState, useTransition } from "react";
import { utworzAlertWsi, rozwiazAlertWsi } from "./akcje";
import { ETYKIETY_ALERTU, IKONY_ALERTU, formatujDateAlertu, type AlertWsi } from "@/lib/alerty/typy-alertow";

type Props = {
  wsie: { id: string; name: string }[];
  alerty: (AlertWsi & { village_id: string })[];
};

export function AlertySoltysKlient({ wsie, alerty }: Props) {
  const [villageId, ustawVillageId] = useState(wsie[0]?.id ?? "");
  const [kind, ustawKind] = useState<keyof typeof ETYKIETY_ALERTU>("woda");
  const [title, ustawTitle] = useState("");
  const [body, ustawBody] = useState("");
  const [blad, ustawBlad] = useState("");
  const [ok, ustawOk] = useState("");
  const [czek, startT] = useTransition();

  function opublikuj(e: React.FormEvent) {
    e.preventDefault();
    ustawBlad("");
    ustawOk("");
    startT(async () => {
      const w = await utworzAlertWsi({ villageId, kind, title, body });
      if ("blad" in w && w.blad) {
        ustawBlad(w.blad);
        return;
      }
      ustawTitle("");
      ustawBody("");
      ustawOk("Alert opublikowany — mieszkańcy dostaną powiadomienie.");
    });
  }

  function rozwiaz(id: string, vid: string) {
    startT(async () => {
      const w = await rozwiazAlertWsi(id, vid);
      if ("blad" in w && w.blad) ustawBlad(w.blad);
    });
  }

  return (
    <div className="space-y-8">
      <form onSubmit={opublikuj} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="font-serif text-lg text-green-950">Nowy alert awarii</h2>
        <p className="mt-1 text-sm text-stone-600">
          Pilny komunikat (prąd, woda, droga) — push i e-mail do obserwujących wsi.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            Wieś
            <select
              className="mt-1 w-full rounded-lg border border-stone-300 px-2 py-2"
              value={villageId}
              onChange={(e) => ustawVillageId(e.target.value)}
            >
              {wsie.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Rodzaj
            <select
              className="mt-1 w-full rounded-lg border border-stone-300 px-2 py-2"
              value={kind}
              onChange={(e) => ustawKind(e.target.value as keyof typeof ETYKIETY_ALERTU)}
            >
              {(Object.keys(ETYKIETY_ALERTU) as Array<keyof typeof ETYKIETY_ALERTU>).map((k) => (
                <option key={k} value={k}>
                  {IKONY_ALERTU[k]} {ETYKIETY_ALERTU[k]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="mt-3 block text-sm">
          Tytuł
          <input
            required
            maxLength={200}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            value={title}
            onChange={(e) => ustawTitle(e.target.value)}
            placeholder="np. Brak wody na ul. Leśnej do 14:00"
          />
        </label>
        <label className="mt-3 block text-sm">
          Szczegóły (opcjonalnie)
          <textarea
            rows={3}
            maxLength={4000}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            value={body}
            onChange={(e) => ustawBody(e.target.value)}
          />
        </label>
        {blad ? <p className="mt-2 text-sm text-red-800">{blad}</p> : null}
        {ok ? <p className="mt-2 text-sm text-green-800">{ok}</p> : null}
        <button type="submit" disabled={czek || !villageId} className="btn-panel-primary mt-4">
          {czek ? "Publikuję…" : "Opublikuj alert"}
        </button>
      </form>

      <section>
        <h2 className="font-serif text-lg text-green-950">Aktywne i archiwalne</h2>
        <ul className="mt-4 space-y-3">
          {alerty.length === 0 ? (
            <li className="text-sm text-stone-500">Brak alertów — to dobra wiadomość.</li>
          ) : (
            alerty.map((a) => (
              <li
                key={a.id}
                className={`rounded-xl border p-4 ${a.status === "active" ? "border-red-200 bg-red-50/40" : "border-stone-200 bg-stone-50"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className="text-lg">{IKONY_ALERTU[a.kind]}</span>{" "}
                    <span className="font-medium text-stone-900">{a.title}</span>
                    <p className="mt-1 text-xs text-stone-500">
                      {ETYKIETY_ALERTU[a.kind]} · {formatujDateAlertu(a.created_at)}
                      {a.status === "resolved" ? " · rozwiązany" : " · aktywny"}
                    </p>
                    {a.body ? <p className="mt-2 text-sm text-stone-700 whitespace-pre-wrap">{a.body}</p> : null}
                  </div>
                  {a.status === "active" ? (
                    <button
                      type="button"
                      className="btn-panel-secondary text-sm"
                      disabled={czek}
                      onClick={() => rozwiaz(a.id, a.village_id)}
                    >
                      Oznacz jako rozwiązany
                    </button>
                  ) : null}
                </div>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
