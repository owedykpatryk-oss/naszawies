"use client";

import { useState, useTransition } from "react";
import { oddajGlosWMiescie } from "@/app/(site)/panel/soltys/glosowania/akcje";

export type GlosowaniePubliczne = {
  id: string;
  pytanie: string;
  opis: string | null;
  status: string;
  rozpoczyna_sie_at: string;
  konczy_sie_at: string;
  wynik_publiczny_w_trakcie: boolean;
  opcje: { id: string; tresc: string; glosy: number }[];
};

type Props = {
  glosowania: GlosowaniePubliczne[];
  mojGlos: Record<string, string>;
  zalogowany: boolean;
};

export function SekcjaGlosowaniaWsi({ glosowania, mojGlos: poczatkowy, zalogowany }: Props) {
  const [mojGlos, ustawMojGlos] = useState(poczatkowy);
  const [blad, ustawBlad] = useState("");
  const [czek, startT] = useTransition();

  const aktywne = glosowania.filter((g) => g.status === "aktywne");
  const zakonczone = glosowania.filter((g) => g.status === "zakonczone");
  if (aktywne.length === 0 && zakonczone.length === 0) return null;

  function glosuj(pollId: string, optionId: string) {
    ustawBlad("");
    startT(async () => {
      const w = await oddajGlosWMiescie({ pollId, optionId });
      if ("blad" in w && w.blad) {
        ustawBlad(w.blad);
        return;
      }
      ustawMojGlos((m) => ({ ...m, [pollId]: optionId }));
    });
  }

  function renderPoll(g: GlosowaniePubliczne, mozeGlosowac: boolean) {
    const suma = g.opcje.reduce((s, o) => s + o.glosy, 0);
    return (
      <li key={g.id} className="rounded-2xl border border-stone-200 bg-white/90 p-4 shadow-sm">
        <p className="font-serif text-lg text-green-950">{g.pytanie}</p>
        {g.opis ? <p className="mt-1 text-sm text-stone-600">{g.opis}</p> : null}
        {blad && mozeGlosowac ? <p className="mt-2 text-sm text-red-800">{blad}</p> : null}
        <ul className="mt-4 space-y-2">
          {g.opcje.map((o) => {
            const pct = suma > 0 ? Math.round((o.glosy / suma) * 100) : 0;
            const wybrane = mojGlos[g.id] === o.id;
            return (
              <li key={o.id}>
                {mozeGlosowac && zalogowany ? (
                  <button
                    type="button"
                    disabled={czek}
                    onClick={() => glosuj(g.id, o.id)}
                    className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${wybrane ? "border-green-700 bg-green-50" : "border-stone-200 hover:bg-stone-50"}`}
                  >
                    {o.tresc} {wybrane ? "✓" : ""}
                  </button>
                ) : (
                  <div className="rounded-xl border border-stone-100 bg-stone-50 px-3 py-2 text-sm">
                    <div className="flex justify-between gap-2">
                      <span>{o.tresc}</span>
                      <span className="text-stone-500">{o.glosy} ({pct}%)</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-stone-200">
                      <div className="h-full bg-green-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        {!zalogowany && mozeGlosowac ? (
          <p className="mt-2 text-xs text-stone-500">Zaloguj się jako mieszkaniec, aby oddać głos.</p>
        ) : null}
      </li>
    );
  }

  return (
    <section id="sekcja-glosowania" className="scroll-mt-24 py-8">
      <h2 className="font-serif text-2xl text-green-950">Głosowania sołeckie</h2>
      {aktywne.length > 0 ? (
        <ul className="mt-4 space-y-4">{aktywne.map((g) => renderPoll(g, true))}</ul>
      ) : null}
      {zakonczone.length > 0 ? (
        <>
          <h3 className="mt-8 text-sm font-semibold uppercase tracking-wide text-stone-500">Zakończone</h3>
          <ul className="mt-3 space-y-4">{zakonczone.map((g) => renderPoll(g, false))}</ul>
        </>
      ) : null}
    </section>
  );
}
