"use client";

import { odliczanieZywHms, formatujDatePolowania } from "@/lib/mapa/formatuj-polowanie";
import type { ZnacznikPolowanie } from "./mapa-wsi-leaflet";

type Props = {
  widoczne: boolean;
  polowania: ZnacznikPolowanie[];
  liczbaKol: number;
  liczbaRewirow: number;
  onPokazAktywne?: () => void;
};

export function MapaLowiectwoOverlay({ widoczne, polowania, liczbaKol, liczbaRewirow, onPokazAktywne }: Props) {
  if (!widoczne) return null;

  const aktywne = polowania.filter((p) => p.faza === "aktywne");
  const nadchodzace = polowania
    .filter((p) => p.faza === "nadchodzace")
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .slice(0, 3);
  const pierwszeAktywne = aktywne[0];
  const zywe = pierwszeAktywne ? odliczanieZywHms(pierwszeAktywne.startsAt, pierwszeAktywne.endsAt) : null;

  return (
    <div className="mapa-lowiectwo-overlay pointer-events-none absolute inset-x-0 top-0 z-[420] flex flex-col gap-2 p-2 sm:p-3">
      {aktywne.length > 0 ? (
        <div
          className="mapa-lowiectwo-alert pointer-events-auto flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-300/90 bg-gradient-to-r from-red-600/95 via-red-700/95 to-rose-800/95 px-3 py-2 text-white shadow-lg backdrop-blur-sm"
          role="status"
        >
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-red-100">Uwaga — polowanie</p>
            <p className="truncate text-sm font-medium">
              {aktywne.length === 1 ? pierwszeAktywne?.title : `${aktywne.length} aktywnych polowań w regionie`}
            </p>
            {zywe ? (
              <p className="font-mono text-xs tabular-nums text-red-50">
                {zywe.etykieta}: <span className="text-base font-bold">{zywe.hms}</span>
              </p>
            ) : null}
          </div>
          {onPokazAktywne && pierwszeAktywne ? (
            <button
              type="button"
              className="shrink-0 rounded-lg bg-white/15 px-2.5 py-1.5 text-xs font-semibold text-white ring-1 ring-white/30 hover:bg-white/25"
              onClick={onPokazAktywne}
            >
              Pokaż na mapie
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="mapa-lowiectwo-stats pointer-events-none flex flex-wrap gap-1.5">
        <span className="rounded-full border border-amber-200/90 bg-amber-50/95 px-2.5 py-1 text-[11px] font-semibold text-amber-950 shadow-sm backdrop-blur">
          🦌 Tryb łowiectwo
        </span>
        {aktywne.length > 0 ? (
          <span className="rounded-full border border-red-200/90 bg-red-50/95 px-2.5 py-1 text-[11px] font-medium text-red-900 shadow-sm backdrop-blur">
            🔴 {aktywne.length} trwa
          </span>
        ) : null}
        {nadchodzace.length > 0 ? (
          <span className="rounded-full border border-orange-200/90 bg-orange-50/95 px-2.5 py-1 text-[11px] font-medium text-orange-900 shadow-sm backdrop-blur">
            🟠 {nadchodzace.length} zaplan.
          </span>
        ) : null}
        {liczbaKol > 0 ? (
          <span className="rounded-full border border-stone-200/90 bg-white/95 px-2.5 py-1 text-[11px] font-medium text-stone-800 shadow-sm backdrop-blur">
            🏕 {liczbaKol} {liczbaKol === 1 ? "koło" : "kół"}
          </span>
        ) : null}
        {liczbaRewirow > 0 ? (
          <span className="rounded-full border border-emerald-200/90 bg-emerald-50/95 px-2.5 py-1 text-[11px] font-medium text-emerald-900 shadow-sm backdrop-blur">
            🌲 {liczbaRewirow} {liczbaRewirow === 1 ? "rewir" : "rewiry"}
          </span>
        ) : null}
      </div>

      {aktywne.length === 0 && nadchodzace.length > 0 ? (
        <div className="mapa-lowiectwo-nadchodzace pointer-events-none max-w-md rounded-xl border border-orange-200/90 bg-white/92 px-3 py-2 shadow-md backdrop-blur-sm">
          <p className="text-[10px] font-bold uppercase tracking-wide text-orange-800">Najbliższe polowania</p>
          <ul className="mt-1 space-y-1">
            {nadchodzace.map((p) => (
              <li key={p.id} className="text-xs text-stone-800">
                <span className="font-medium">{p.title}</span>
                <span className="text-stone-500"> · {formatujDatePolowania(p.startsAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
