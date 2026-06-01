"use client";

import { useMemo } from "react";
import { klasaPillNawigacji } from "@/lib/panel/klasy-nawigacji-pill";

export type SekcjaNawigacji = {
  id: string;
  label: string;
  badge?: string;
};

export type GrupaSekcjiNawigacji = {
  id: string;
  tytul: string;
  ids: string[];
};

type Props = {
  grupy: GrupaSekcjiNawigacji[];
  sekcje: SekcjaNawigacji[];
  aktywna: string;
  onZmiana: (id: string) => void;
  ariaLabel?: string;
};

/** Dwupoziomowe zakładki: najpierw kategoria, potem sekcja (mniej chaosu niż jeden długi pasek). */
export function NawigacjaSekcjiGrupowana({
  grupy,
  sekcje,
  aktywna,
  onZmiana,
  ariaLabel = "Sekcje modułu",
}: Props) {
  const grupaAktywna = useMemo(() => {
    const zSekcji = grupy.find((g) => g.ids.includes(aktywna));
    return zSekcji ?? grupy[0];
  }, [grupy, aktywna]);

  const sekcjeWGrupie = useMemo(
    () => sekcje.filter((s) => grupaAktywna?.ids.includes(s.id)),
    [sekcje, grupaAktywna],
  );

  if (!grupaAktywna) return null;

  return (
    <nav className="panel-nawigacja-szklo no-print space-y-3 p-2 sm:p-3 lg:sticky lg:z-20 [top:var(--sticky-nav-offset)]" aria-label={ariaLabel}>
      <div>
        <p className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-800/70">
          Obszar pracy
        </p>
        <div className="flex flex-wrap gap-1">
          {grupy.map((grupa) => {
            const aktywnaGrupa = grupa.id === grupaAktywna.id;
            const pierwsza = grupa.ids[0];
            return (
              <button
                key={grupa.id}
                type="button"
                onClick={() => onZmiana(pierwsza)}
                className={klasaPillNawigacji(aktywnaGrupa)}
                aria-current={aktywnaGrupa ? "true" : undefined}
              >
                {grupa.tytul}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <p className="mb-1.5 px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">
          Sekcja
        </p>
        <div className="-mx-0.5 flex flex-nowrap gap-1 overflow-x-auto px-0.5 pb-0.5 [-webkit-overflow-scrolling:touch] sm:flex-wrap sm:overflow-visible">
          {sekcjeWGrupie.map((sekcja) => {
            const aktywnaSekcja = sekcja.id === aktywna;
            return (
              <button
                key={sekcja.id}
                type="button"
                onClick={() => onZmiana(sekcja.id)}
                className={`${klasaPillNawigacji(aktywnaSekcja)} flex shrink-0 items-center gap-1.5`}
                aria-current={aktywnaSekcja ? "page" : undefined}
              >
                <span>{sekcja.label}</span>
                {sekcja.badge != null ? (
                  <span className="rounded-full bg-stone-200 px-1.5 py-0.5 text-[10px] text-stone-700">
                    {sekcja.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
