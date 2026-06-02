"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { WiesNaHubieRynku } from "@/lib/marketplace/pobierz-hub-rynku";

export function RynekHubWyszukiwarka({
  wsie,
  fraza,
  onFrazaChange,
}: {
  wsie: WiesNaHubieRynku[];
  fraza?: string;
  onFrazaChange?: (v: string) => void;
}) {
  const frazaWewnetrzna = fraza ?? "";

  const przefiltrowane = useMemo(() => {
    const q = frazaWewnetrzna.trim().toLowerCase();
    if (!q) return wsie;
    return wsie.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.commune.toLowerCase().includes(q) ||
        w.county.toLowerCase().includes(q) ||
        w.voivodeship.toLowerCase().includes(q) ||
        (w.banner?.toLowerCase().includes(q) ?? false),
    );
  }, [frazaWewnetrzna, wsie]);

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
          value={frazaWewnetrzna}
          onChange={(e) => onFrazaChange?.(e.target.value)}
          placeholder="np. nazwa wsi, miód, gmina…"
          className="mt-1.5 w-full max-w-md rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm shadow-sm transition focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
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
              className="rynek-hub-wies-karta group block overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-sm transition-all duration-200 hover:border-orange-300 hover:shadow-lg"
            >
              <div className="bg-gradient-to-br from-orange-50/80 via-white to-emerald-50/40 px-4 py-3">
                <p className="font-semibold text-green-950 group-hover:text-green-900">{w.name}</p>
                <p className="mt-0.5 text-xs text-stone-600">
                  {w.commune} · {w.county}
                </p>
              </div>
              <div className="px-4 pb-4">
                {w.banner ? (
                  <p className="line-clamp-2 rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-950 ring-1 ring-amber-200/60">
                    🌾 {w.banner}
                  </p>
                ) : null}
                <p className={`text-xs font-bold text-orange-900 ${w.banner ? "mt-2" : "mt-0"}`}>
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-100/80 px-2 py-0.5 transition group-hover:bg-orange-200/80">
                    {w.liczbaOgloszen} {w.liczbaOgloszen === 1 ? "ogłoszenie" : w.liczbaOgloszen < 5 ? "ogłoszenia" : "ogłoszeń"} →
                  </span>
                </p>
              </div>
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
