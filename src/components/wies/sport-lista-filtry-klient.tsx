"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { KARTA_LISTY_WIES } from "@/components/wies/oslona-sekcji-wies";
import type { WydarzenieSportowePubliczne } from "@/lib/wies/pobierz-terminarz-sportu-wsi";
import { etykietaRodzajuWydarzenia } from "@/lib/wies/teksty-organizacji";

type Filtr =
  | "wszystkie"
  | "mecz"
  | "trening"
  | "proba"
  | "spacer"
  | "rajd"
  | "wyjazd";

type Props = {
  wydarzenia: WydarzenieSportowePubliczne[];
  sciezkaProfilu: string;
};

export function SportListaFiltryKlient({ wydarzenia, sciezkaProfilu }: Props) {
  const [filtr, ustawFiltr] = useState<Filtr>("wszystkie");

  const lista = useMemo(() => {
    if (filtr === "wszystkie") return wydarzenia;
    return wydarzenia.filter((w) => w.event_kind === filtr);
  }, [wydarzenia, filtr]);

  const przycisk = (id: Filtr, label: string) => (
    <button
      type="button"
      onClick={() => ustawFiltr(id)}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
        filtr === id
          ? "bg-emerald-800 text-white"
          : "border border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2">
        {przycisk("wszystkie", "Wszystkie")}
        {przycisk("mecz", "Mecze")}
        {przycisk("trening", "Treningi")}
        {przycisk("proba", "Zajęcia")}
        {przycisk("spacer", "Spacery")}
        {przycisk("rajd", "Rajdy")}
        {przycisk("wyjazd", "Wyjazdy")}
      </div>
      {lista.length === 0 ? (
        <p className="mt-4 text-sm text-stone-500">Brak wydarzeń w tym filtrze.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {lista.map((ev) => (
            <li key={ev.id}>
              <Link
                href={`${sciezkaProfilu}/wydarzenia/${ev.id}`}
                className={`${KARTA_LISTY_WIES} block hover:border-emerald-300 hover:bg-emerald-50/40`}
              >
                <p className="text-xs text-emerald-800">
                  {etykietaRodzajuWydarzenia(ev.event_kind)}
                  {ev.nazwa_grupy ? ` · ${ev.nazwa_grupy}` : ""}
                </p>
                <p className="mt-1 font-medium text-stone-900">{ev.title}</p>
                <p className="mt-1 text-xs text-stone-600">
                  {new Date(ev.starts_at).toLocaleString("pl-PL", { dateStyle: "medium", timeStyle: "short" })}
                  {ev.location_text ? ` · ${ev.location_text}` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
