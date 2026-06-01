"use client";

import { useMemo, useState } from "react";
import {
  ETYKIETY_DNI_INTENCJI,
  type IntencjaTygodniowaParafii,
  type ProfilParafiiJson,
} from "@/lib/wies/profil-organizacji";

const KOLEJNOSC_DNI: IntencjaTygodniowaParafii["dzien"][] = ["nd", "pon", "wt", "sr", "czw", "pt", "sob"];

function pustyWiersz(): IntencjaTygodniowaParafii {
  return { dzien: "nd", godzina: "", intencja: "", celebrans: null };
}

export function IntencjeTygodnioweParafiaKlient({
  poczatkowe,
}: {
  poczatkowe: ProfilParafiiJson["intencje_tygodniowe"];
}) {
  const start = useMemo(() => {
    const arr = poczatkowe ?? [];
    return arr.length ? arr.map((r) => ({ ...r })) : [];
  }, [poczatkowe]);

  const [wiersze, ustawWiersze] = useState<IntencjaTygodniowaParafii[]>(start);

  const json = useMemo(() => JSON.stringify(wiersze.filter((w) => w.intencja.trim() || w.godzina.trim())), [wiersze]);

  function aktualizuj(idx: number, patch: Partial<IntencjaTygodniowaParafii>) {
    ustawWiersze((prev) => prev.map((w, i) => (i === idx ? { ...w, ...patch } : w)));
  }

  function dodaj() {
    if (wiersze.length >= 24) return;
    ustawWiersze((prev) => [...prev, pustyWiersz()]);
  }

  function usun(idx: number) {
    ustawWiersze((prev) => prev.filter((_, i) => i !== idx));
  }

  const posortowanePodglad = [...wiersze]
    .filter((w) => w.intencja.trim())
    .sort((a, b) => KOLEJNOSC_DNI.indexOf(a.dzien) - KOLEJNOSC_DNI.indexOf(b.dzien));

  return (
    <div className="mt-3 space-y-3">
      <input type="hidden" name="parafia_intencje_tygodniowe_json" value={json} readOnly />
      <p className="text-xs text-stone-600">
        Tabela intencji na bieżący tydzień — mieszkańcy zobaczą ją na publicznej karcie parafii (obok ogólnych informacji
        o intencjach).
      </p>
      {wiersze.length === 0 ? (
        <p className="text-xs text-stone-500">Brak wpisów — dodaj pierwszą intencję mszalną.</p>
      ) : (
        <ul className="space-y-2">
          {wiersze.map((w, idx) => (
            <li
              key={idx}
              className="grid gap-2 rounded-lg border border-violet-100 bg-white p-3 sm:grid-cols-[minmax(0,1fr)_72px_minmax(0,1.4fr)_minmax(0,1fr)_auto]"
            >
              <label className="text-xs">
                <span className="font-medium text-stone-700">Dzień</span>
                <select
                  value={w.dzien}
                  onChange={(e) => aktualizuj(idx, { dzien: e.target.value as IntencjaTygodniowaParafii["dzien"] })}
                  className="mt-0.5 w-full rounded border border-stone-300 px-2 py-1.5 text-sm"
                >
                  {KOLEJNOSC_DNI.map((d) => (
                    <option key={d} value={d}>
                      {ETYKIETY_DNI_INTENCJI[d]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs">
                <span className="font-medium text-stone-700">Godz.</span>
                <input
                  value={w.godzina}
                  onChange={(e) => aktualizuj(idx, { godzina: e.target.value })}
                  placeholder="10:00"
                  maxLength={12}
                  className="mt-0.5 w-full rounded border border-stone-300 px-2 py-1.5 text-sm"
                />
              </label>
              <label className="text-xs sm:col-span-1">
                <span className="font-medium text-stone-700">Intencja</span>
                <input
                  value={w.intencja}
                  onChange={(e) => aktualizuj(idx, { intencja: e.target.value })}
                  placeholder="Za…"
                  maxLength={280}
                  className="mt-0.5 w-full rounded border border-stone-300 px-2 py-1.5 text-sm"
                />
              </label>
              <label className="text-xs">
                <span className="font-medium text-stone-700">Celebrans (opc.)</span>
                <input
                  value={w.celebrans ?? ""}
                  onChange={(e) => aktualizuj(idx, { celebrans: e.target.value.trim() || null })}
                  placeholder="ks. …"
                  maxLength={80}
                  className="mt-0.5 w-full rounded border border-stone-300 px-2 py-1.5 text-sm"
                />
              </label>
              <button
                type="button"
                onClick={() => usun(idx)}
                className="self-end text-xs text-red-700 underline hover:text-red-900"
              >
                Usuń
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={dodaj}
        disabled={wiersze.length >= 24}
        className="rounded-lg border border-violet-300 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-900 hover:bg-violet-100 disabled:opacity-50"
      >
        + Dodaj intencję
      </button>
      {posortowanePodglad.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-violet-100 bg-violet-50/40 p-2">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-violet-800">Podgląd tygodnia</p>
          <table className="w-full min-w-[320px] text-left text-xs">
            <thead>
              <tr className="text-stone-600">
                <th className="py-1 pr-2 font-medium">Dzień</th>
                <th className="py-1 pr-2 font-medium">Godz.</th>
                <th className="py-1 pr-2 font-medium">Intencja</th>
                <th className="py-1 font-medium">Celebrans</th>
              </tr>
            </thead>
            <tbody>
              {posortowanePodglad.map((w, i) => (
                <tr key={i} className="border-t border-violet-100/80">
                  <td className="py-1 pr-2 whitespace-nowrap">{ETYKIETY_DNI_INTENCJI[w.dzien]}</td>
                  <td className="py-1 pr-2 whitespace-nowrap">{w.godzina || "—"}</td>
                  <td className="py-1 pr-2">{w.intencja}</td>
                  <td className="py-1 text-stone-600">{w.celebrans ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
