"use client";

import { useMemo, useState } from "react";

type ZajetyTermin = { start_at: string; end_at: string; status: string };

type Props = {
  zajeteTerminy: ZajetyTermin[];
  startValue: string;
  endValue: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
};

function parseLocalDatetime(v: string): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function nakladajaSie(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart;
}

function formatZakres(a: string, b: string) {
  return `${new Date(a).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })} — ${new Date(b).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })}`;
}

export function WyborTerminuSwietlicyKlient({
  zajeteTerminy,
  startValue,
  endValue,
  onStartChange,
  onEndChange,
}: Props) {
  const [pokazKalendarz, ustawPokazKalendarz] = useState(true);

  const start = parseLocalDatetime(startValue);
  const end = parseLocalDatetime(endValue);

  const kolizja = useMemo(() => {
    if (!start || !end || end <= start) return null;
    for (const z of zajeteTerminy) {
      const zs = new Date(z.start_at);
      const ze = new Date(z.end_at);
      if (!Number.isNaN(zs.getTime()) && !Number.isNaN(ze.getTime()) && nakladajaSie(start, end, zs, ze)) {
        return z;
      }
    }
    return null;
  }, [start, end, zajeteTerminy]);

  const nadchodzace = useMemo(() => {
    const teraz = Date.now();
    return [...zajeteTerminy]
      .filter((z) => new Date(z.end_at).getTime() > teraz)
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
      .slice(0, 12);
  }, [zajeteTerminy]);

  function ustawSzybkiStart(dniOdDzis: number, godzina: number, minuta: number) {
    const d = new Date();
    d.setDate(d.getDate() + dniOdDzis);
    d.setHours(godzina, minuta, 0, 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    const local = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    onStartChange(local);
    if (!endValue || (end && end <= d)) {
      const koniec = new Date(d.getTime() + 4 * 60 * 60 * 1000);
      onEndChange(
        `${koniec.getFullYear()}-${pad(koniec.getMonth() + 1)}-${pad(koniec.getDate())}T${pad(koniec.getHours())}:${pad(koniec.getMinutes())}`,
      );
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-stone-800">Termin rezerwacji</p>
        <button
          type="button"
          onClick={() => ustawPokazKalendarz((v) => !v)}
          className="text-xs text-green-800 underline"
        >
          {pokazKalendarz ? "Ukryj zajęte terminy" : "Pokaż zajęte terminy"}
        </button>
      </div>

      {pokazKalendarz && nadchodzace.length > 0 ? (
        <div>
          <p className="text-xs text-stone-600">Zajęte przedziały (unikaj nakładania):</p>
          <ul className="mt-2 max-h-36 space-y-1 overflow-y-auto text-xs">
            {nadchodzace.map((z, i) => (
              <li
                key={`${z.start_at}-${i}`}
                className={`rounded px-2 py-1 ${
                  z.status === "approved" ? "bg-red-50 text-red-900" : "bg-amber-50 text-amber-950"
                }`}
              >
                {formatZakres(z.start_at, z.end_at)}
                {z.status === "pending" ? " · wstępna" : " · potwierdzona"}
              </li>
            ))}
          </ul>
        </div>
      ) : pokazKalendarz ? (
        <p className="text-xs text-stone-500">Brak nadchodzących blokad — sala wygląda na wolną w kalendarzu.</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => ustawSzybkiStart(7, 16, 0)}
          className="rounded border border-stone-300 bg-white px-2 py-1 text-xs hover:bg-stone-50"
        >
          Za tydzień, 16:00 (4 h)
        </button>
        <button
          type="button"
          onClick={() => ustawSzybkiStart(14, 10, 0)}
          className="rounded border border-stone-300 bg-white px-2 py-1 text-xs hover:bg-stone-50"
        >
          Za 2 tygodnie, 10:00
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="rs-start" className="mb-1 block text-sm">
            Od
          </label>
          <input
            id="rs-start"
            name="start_at"
            type="datetime-local"
            required
            value={startValue}
            onChange={(e) => onStartChange(e.target.value)}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="rs-end" className="mb-1 block text-sm">
            Do
          </label>
          <input
            id="rs-end"
            name="end_at"
            type="datetime-local"
            required
            value={endValue}
            onChange={(e) => onEndChange(e.target.value)}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {kolizja ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-900" role="alert">
          Wybrany termin nakłada się z {kolizja.status === "pending" ? "wstępną" : "potwierdzoną"} rezerwacją (
          {formatZakres(kolizja.start_at, kolizja.end_at)}). Wybierz inne godziny.
        </p>
      ) : start && end && end > start ? (
        <p className="text-xs text-green-800">Termin nie koliduje z widocznymi blokadami w kalendarzu.</p>
      ) : null}
    </div>
  );
}
