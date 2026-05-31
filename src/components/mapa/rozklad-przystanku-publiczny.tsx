"use client";

import { useEffect, useState } from "react";
import type { OdjazdAutobusApi } from "@/lib/transport/scal-odjazdy-przystanku";

type Props = {
  poiId: string;
  kategoria: string;
};

export function RozkladPrzystankuPubliczny({ poiId, kategoria }: Props) {
  const [laduje, ustawLaduje] = useState(true);
  const [odjazdy, ustawOdjazdy] = useState<OdjazdAutobusApi[]>([]);
  const [notatka, ustawNotatka] = useState<string | null>(null);
  const [linkPdf, ustawLinkPdf] = useState<string | null>(null);
  const [maReczny, ustawMaReczny] = useState(false);

  useEffect(() => {
    if (kategoria.trim().toLowerCase() !== "przystanek") {
      ustawLaduje(false);
      return;
    }
    let anuluj = false;
    void fetch(`/api/mapa/poi/${encodeURIComponent(poiId)}/odjazdy`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (anuluj || !json) return;
        ustawOdjazdy(json.odjazdy ?? []);
        ustawNotatka(json.notatka ?? null);
        ustawLinkPdf(json.linkPdf ?? null);
        ustawMaReczny(Boolean(json.maReczny));
      })
      .finally(() => {
        if (!anuluj) ustawLaduje(false);
      });
    return () => {
      anuluj = true;
    };
  }, [poiId, kategoria]);

  if (kategoria.trim().toLowerCase() !== "przystanek") return null;

  return (
    <section className="rounded-2xl border border-sky-200/80 bg-sky-50/40 p-5 shadow-sm sm:p-6">
      <h2 className="font-serif text-lg text-sky-950">
        Rozkład autobusów
        {maReczny ? (
          <span className="ml-2 align-middle rounded-full bg-sky-200/80 px-2 py-0.5 text-[10px] font-sans font-semibold uppercase tracking-wide text-sky-950">
            od sołtysa
          </span>
        ) : null}
      </h2>
      {laduje ? (
        <p className="mt-2 text-sm text-stone-500">Ładowanie rozkładu…</p>
      ) : (
        <>
          {notatka ? <p className="mt-2 text-sm leading-relaxed text-stone-700">{notatka}</p> : null}
          {odjazdy.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {odjazdy.map((o, i) => (
                <li key={`${o.czas}-${i}`} className="rounded-lg border border-white/80 bg-white/90 px-3 py-2 text-sm">
                  <strong>{o.czas}</strong>
                  {o.przyjazd ? ` · przyjazd ${o.przyjazd}` : ""}
                  {" · "}
                  {o.linia}
                  {o.cel ? ` → ${o.cel}` : ""}
                  {o.przez ? ` · przez ${o.przez}` : ""}
                  {o.zrodlo === "soltys" ? (
                    <span className="ml-1 text-xs text-sky-800">(wpis sołtysa)</span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : !notatka ? (
            <p className="mt-2 text-sm text-stone-600">Brak wpisanych kursów — sprawdź e-podróżnik poniżej na mapie wsi.</p>
          ) : null}
          {linkPdf ? (
            <p className="mt-3 text-sm">
              <a href={linkPdf} target="_blank" rel="noopener noreferrer" className="font-medium text-green-800 underline">
                Oficjalny PDF rozkładu ↗
              </a>
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
