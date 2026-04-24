"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { MapaWsiLeaflet, type ZnacznikWsi } from "./mapa-wsi-leaflet";

function normalizuj(tekst: string): string {
  return tekst.trim().toLowerCase();
}

export function MapaWsiStrona({ znaczniki }: { znaczniki: ZnacznikWsi[] }) {
  const [szukaj, setSzukaj] = useState("");
  const szukajOdroczone = useDeferredValue(szukaj);

  const odfiltrowane = useMemo(() => {
    const q = normalizuj(szukajOdroczone);
    if (!q) return znaczniki;
    return znaczniki.filter(
      (z) =>
        normalizuj(z.name).includes(q) ||
        z.sciezka.toLowerCase().includes(q.replace(/\s+/g, ""))
    );
  }, [znaczniki, szukajOdroczone]);

  return (
    <div className="flex flex-col gap-0 lg:mx-auto lg:max-w-[1400px] lg:flex-row lg:items-stretch lg:gap-0">
      <aside className="flex max-h-[min(42vh,380px)] shrink-0 flex-col border-b border-stone-200 bg-white lg:max-h-none lg:w-[min(100%,340px)] lg:border-b-0 lg:border-r">
        <div className="border-b border-stone-100 p-4">
          <label htmlFor="mapa-szukaj" className="sr-only">
            Szukaj wsi na mapie
          </label>
          <input
            id="mapa-szukaj"
            type="search"
            value={szukaj}
            onChange={(e) => setSzukaj(e.target.value)}
            placeholder="Nazwa miejscowości…"
            autoComplete="off"
            className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-900 outline-none ring-green-800/30 placeholder:text-stone-400 focus:border-green-700 focus:ring-2"
          />
          <p className="mt-2 text-xs text-stone-500">
            Pokazano {odfiltrowane.length} z {znaczniki.length}. Kliknij wieś na liście lub znacznik — zobaczysz oferty i link do strony.
          </p>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-3">
          {odfiltrowane.map((z) => (
            <li key={z.id}>
              <Link
                href={z.sciezka}
                className="flex flex-col gap-0.5 rounded-lg px-3 py-2.5 text-sm hover:bg-green-50/80"
              >
                <span className="font-medium text-stone-900">{z.name}</span>
                <span className="text-xs text-stone-500">
                  {z.public_offers_count > 0
                    ? `${z.public_offers_count} ofert na targu · `
                    : "Brak publicznych ofert · "}
                  {z.boundary_geojson ? "granica na mapie" : "punkt GPS"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </aside>
      <div className="min-h-[min(72dvh,560px)] flex-1 bg-stone-100/50 p-3 md:p-4">
        {odfiltrowane.length === 0 ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            Brak wsi pasujących do wyszukiwania. Wyczyść pole albo użyj{" "}
            <Link href="/szukaj" className="font-semibold text-green-900 underline">
              szukajki TERYT
            </Link>
            .
          </p>
        ) : (
          <MapaWsiLeaflet znaczniki={odfiltrowane} />
        )}
      </div>
    </div>
  );
}
