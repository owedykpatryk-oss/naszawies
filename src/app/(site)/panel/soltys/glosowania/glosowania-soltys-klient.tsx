"use client";

import { useState, useTransition } from "react";
import { utworzGlosowanieSoltys, zmienStatusGlosowaniaSoltys } from "./akcje";

export type WierszGlosowaniaSoltys = {
  id: string;
  village_id: string;
  pytanie: string;
  status: string;
  rozpoczyna_sie_at: string;
  konczy_sie_at: string;
  opcje: { id: string; tresc: string; glosy: number }[];
};

type Props = {
  wsie: { id: string; name: string }[];
  glosowania: WierszGlosowaniaSoltys[];
};

export function GlosowaniaSoltysKlient({ wsie, glosowania }: Props) {
  const [villageId, ustawVillageId] = useState(wsie[0]?.id ?? "");
  const [pytanie, ustawPytanie] = useState("");
  const [opcjeTekst, ustawOpcjeTekst] = useState("Tak\nNie\nWstrzymuję się");
  const [start, ustawStart] = useState("");
  const [koniec, ustawKoniec] = useState("");
  const [blad, ustawBlad] = useState("");
  const [czek, startT] = useTransition();

  function utworz(e: React.FormEvent) {
    e.preventDefault();
    ustawBlad("");
    const opcje = opcjeTekst.split("\n").map((l) => l.trim()).filter(Boolean);
    startT(async () => {
      const w = await utworzGlosowanieSoltys({
        villageId,
        pytanie,
        opcje,
        rozpoczynaSieAt: start || new Date().toISOString(),
        konczySieAt: koniec || new Date(Date.now() + 7 * 86400000).toISOString(),
        wymagaMieszkanca: true,
        wynikPublicznyWTrakcie: false,
      });
      if ("blad" in w && w.blad) ustawBlad(w.blad);
      else {
        ustawPytanie("");
      }
    });
  }

  function status(pollId: string, vid: string, s: "aktywne" | "zakonczone" | "anulowane") {
    startT(async () => {
      const w = await zmienStatusGlosowaniaSoltys(pollId, vid, s);
      if ("blad" in w && w.blad) ustawBlad(w.blad);
    });
  }

  return (
    <div className="space-y-8">
      <form onSubmit={utworz} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="font-serif text-lg text-green-950">Nowe głosowanie</h2>
        <label className="mt-3 block text-sm">
          Wieś
          <select className="mt-1 w-full rounded-lg border px-2 py-2" value={villageId} onChange={(e) => ustawVillageId(e.target.value)}>
            {wsie.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </label>
        <label className="mt-3 block text-sm">
          Pytanie
          <input required className="mt-1 w-full rounded-lg border px-3 py-2" value={pytanie} onChange={(e) => ustawPytanie(e.target.value)} />
        </label>
        <label className="mt-3 block text-sm">
          Opcje (jedna na linię)
          <textarea rows={4} className="mt-1 w-full rounded-lg border px-3 py-2 font-mono text-sm" value={opcjeTekst} onChange={(e) => ustawOpcjeTekst(e.target.value)} />
        </label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Start
            <input type="datetime-local" className="mt-1 w-full rounded-lg border px-2 py-2" value={start} onChange={(e) => ustawStart(e.target.value)} />
          </label>
          <label className="text-sm">
            Koniec
            <input type="datetime-local" className="mt-1 w-full rounded-lg border px-2 py-2" value={koniec} onChange={(e) => ustawKoniec(e.target.value)} />
          </label>
        </div>
        {blad ? <p className="mt-2 text-sm text-red-800">{blad}</p> : null}
        <button type="submit" disabled={czek} className="btn-panel-primary mt-4">Utwórz głosowanie</button>
      </form>

      <ul className="space-y-4">
        {glosowania.map((g) => (
          <li key={g.id} className="rounded-xl border border-stone-200 bg-white p-4">
            <p className="font-medium text-green-950">{g.pytanie}</p>
            <p className="text-xs text-stone-500">Status: {g.status}</p>
            <ul className="mt-2 text-sm text-stone-700">
              {g.opcje.map((o) => (
                <li key={o.id}>{o.tresc} — {o.glosy} głosów</li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              {g.status !== "aktywne" ? (
                <button type="button" className="btn-panel-secondary text-sm" onClick={() => status(g.id, g.village_id, "aktywne")}>Otwórz głosowanie</button>
              ) : null}
              {g.status === "aktywne" ? (
                <button type="button" className="btn-panel-primary text-sm" onClick={() => status(g.id, g.village_id, "zakonczone")}>Zakończ</button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
