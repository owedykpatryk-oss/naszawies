"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { WpisHistoriiPubliczny } from "@/lib/historia/typy-historii";

type Props = {
  wpisy: WpisHistoriiPubliczny[];
  sciezkaProfilu: string;
  nazwaWsi: string;
};

export function HistoriaListaFiltryKlient({ wpisy, sciezkaProfilu, nazwaWsi }: Props) {
  const [szukaj, ustawSzukaj] = useState("");
  const [epoka, ustawEpoke] = useState<string>("");

  const epoki = useMemo(() => {
    const s = new Set<string>();
    for (const w of wpisy) {
      s.add(w.era_label?.trim() || "Inne okresy");
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b, "pl"));
  }, [wpisy]);

  const filtrowane = useMemo(() => {
    const q = szukaj.trim().toLowerCase();
    return wpisy.filter((w) => {
      if (epoka && (w.era_label?.trim() || "Inne okresy") !== epoka) return false;
      if (!q) return true;
      const blob = `${w.title} ${w.short_description ?? ""} ${w.location_label ?? ""}`.toLowerCase();
      return blob.includes(q);
    });
  }, [wpisy, szukaj, epoka]);

  return (
    <>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="min-w-0 flex-1 text-sm">
          <span className="font-medium text-stone-700">Szukaj</span>
          <input
            type="search"
            value={szukaj}
            onChange={(e) => ustawSzukaj(e.target.value)}
            placeholder="Tytuł, miejsce, opis…"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm sm:w-48">
          <span className="font-medium text-stone-700">Epoka</span>
          <select
            value={epoka}
            onChange={(e) => ustawEpoke(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          >
            <option value="">Wszystkie</option>
            {epoki.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="mt-3 text-xs text-stone-500">
        {filtrowane.length} z {wpisy.length} wpisów · {nazwaWsi}
      </p>
      {filtrowane.length === 0 ? (
        <p className="mt-6 text-sm text-stone-500">Brak wpisów dla wybranych filtrów.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {filtrowane.map((w) => (
            <li key={w.id}>
              <Link
                href={`${sciezkaProfilu}/historia/${w.id}`}
                className="flex gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm transition hover:border-amber-300 hover:bg-amber-50/40"
              >
                {w.media_urls[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={w.media_urls[0]} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" loading="lazy" />
                ) : (
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-lg" aria-hidden>
                    📜
                  </span>
                )}
                <div className="min-w-0">
                  {w.era_label ? <p className="text-xs text-amber-800">{w.era_label}</p> : null}
                  <p className="font-medium text-stone-900">{w.title}</p>
                  {w.short_description ? <p className="mt-1 text-sm text-stone-700">{w.short_description}</p> : null}
                  <p className="mt-2 text-xs text-stone-500">
                    {w.event_date
                      ? new Date(w.event_date).toLocaleDateString("pl-PL")
                      : new Date(w.created_at).toLocaleDateString("pl-PL")}
                    {w.location_label ? ` · ${w.location_label}` : ""}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
