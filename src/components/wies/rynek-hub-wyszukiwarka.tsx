"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { WiesNaHubieRynku } from "@/lib/marketplace/pobierz-hub-rynku";

export function RynekHubWyszukiwarka({ wsie }: { wsie: WiesNaHubieRynku[] }) {
  const [fraza, ustawFraze] = useState("");

  const przefiltrowane = useMemo(() => {
    const q = fraza.trim().toLowerCase();
    if (!q) return wsie;
    return wsie.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.commune.toLowerCase().includes(q) ||
        w.county.toLowerCase().includes(q) ||
        w.voivodeship.toLowerCase().includes(q),
    );
  }, [fraza, wsie]);

  if (wsie.length === 0) {
    return (
      <p className="rounded-xl border border-stone-200 bg-white p-6 text-sm text-stone-600">
        Jeszcze nie ma opublikowanych ogłoszeń na rynkach lokalnych. Sołtys może zachęcić mieszkańców do dodawania
        produktów z gospodarstwa —{" "}
        <Link href="/wybierz-wies" className="font-medium text-green-800 underline">
          wybierz swoją wieś
        </Link>
        .
      </p>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-stone-800">
        Szukaj wsi lub gminy
        <input
          type="search"
          value={fraza}
          onChange={(e) => ustawFraze(e.target.value)}
          placeholder="np. nazwa wsi, miód, gmina…"
          className="mt-1.5 w-full max-w-md rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-200"
        />
      </label>
      <p className="mt-2 text-xs text-stone-500">
        {przefiltrowane.length} z {wsie.length} miejscowości z aktywnym rynkiem
      </p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {przefiltrowane.map((w) => (
          <li key={w.id}>
            <Link
              href={w.sciezkaRynek}
              className="block rounded-xl border border-stone-200/90 bg-white p-4 shadow-sm transition hover:border-orange-300 hover:shadow-md"
            >
              <p className="font-semibold text-green-950">{w.name}</p>
              <p className="mt-0.5 text-xs text-stone-600">
                {w.commune} · {w.county}
              </p>
              {w.banner ? (
                <p className="mt-2 line-clamp-2 rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-950">
                  🌾 {w.banner}
                </p>
              ) : null}
              <p className="mt-2 text-xs font-semibold text-orange-900">
                {w.liczbaOgloszen} {w.liczbaOgloszen === 1 ? "ogłoszenie" : w.liczbaOgloszen < 5 ? "ogłoszenia" : "ogłoszeń"} →
              </p>
            </Link>
          </li>
        ))}
      </ul>
      {przefiltrowane.length === 0 ? (
        <p className="mt-4 text-sm text-stone-600">Brak wyników — spróbuj innej nazwy wsi lub gminy.</p>
      ) : null}
    </div>
  );
}
