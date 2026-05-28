"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { GRUPY_CZATU_PRESET } from "@/lib/czat/grupy-preset";
import { dolaczDoGrupyPreset, utworzGrupeWlasna } from "./akcje";

export function CzatListaGrupKlient({ wsie }: { wsie: { id: string; name: string }[] }) {
  const router = useRouter();
  const [blad, ustawBlad] = useState("");
  const [czek, startT] = useTransition();
  const [wies, ustawWies] = useState(wsie[0]?.id ?? "");
  const [nazwaGrupy, ustawNazwaGrupy] = useState("");

  if (wsie.length === 0) {
    return (
      <p className="mt-4 text-sm text-amber-900">
        Dołącz do wsi jako mieszkaniec, aby korzystać z czatu grupowego.
      </p>
    );
  }

  return (
    <section className="mt-6 rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/60 to-white p-4 shadow-sm">
      <h2 className="font-serif text-lg text-green-950">Dołącz do grupy wsi</h2>
      <p className="mt-1 text-xs text-stone-600">Jedno kliknięcie — kanał mieszkańców, KGW, myśliwi, OSP lub własna grupa.</p>
      {blad ? (
        <p className="mt-2 text-sm text-red-800" role="alert">
          {blad}
        </p>
      ) : null}
      <label className="mt-3 block text-sm">
        Wieś
        <select
          value={wies}
          onChange={(e) => ustawWies(e.target.value)}
          className="mt-1 block w-full max-w-xs rounded border border-stone-300 bg-white px-2 py-1.5"
        >
          {wsie.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        {GRUPY_CZATU_PRESET.map((g) => (
          <button
            key={g.value}
            type="button"
            disabled={!!czek}
            title={g.opis}
            className="rounded-full border border-violet-300 bg-white px-3 py-1.5 text-xs font-medium text-violet-950 hover:bg-violet-100 disabled:opacity-50"
            onClick={() => {
              ustawBlad("");
              startT(async () => {
                const w = await dolaczDoGrupyPreset(wies, g.value);
                if ("blad" in w) {
                  ustawBlad(w.blad);
                  return;
                }
                if (w.conversationId) router.push(`/panel/czat/${w.conversationId}`);
              });
            }}
          >
            {g.label}
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-violet-200/60 pt-4">
        <label className="text-sm">
          Własna grupa
          <input
            value={nazwaGrupy}
            onChange={(e) => ustawNazwaGrupy(e.target.value)}
            placeholder="np. Sąsiedzi ul. Leśnej"
            maxLength={80}
            className="mt-1 block w-56 rounded border border-stone-300 px-2 py-1.5 text-sm"
          />
        </label>
        <button
          type="button"
          disabled={czek || nazwaGrupy.trim().length < 3}
          className="rounded-lg bg-green-800 px-3 py-2 text-xs font-medium text-white hover:bg-green-900 disabled:opacity-50"
          onClick={() => {
            ustawBlad("");
            startT(async () => {
              const w = await utworzGrupeWlasna(wies, nazwaGrupy);
              if ("blad" in w) {
                ustawBlad(w.blad);
                return;
              }
              if (w.conversationId) router.push(`/panel/czat/${w.conversationId}`);
            });
          }}
        >
          Utwórz grupę
        </button>
      </div>
    </section>
  );
}
