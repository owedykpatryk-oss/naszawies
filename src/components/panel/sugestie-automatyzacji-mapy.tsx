"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { dodajBrakujacePoiZOpenStreetMap } from "@/app/(site)/panel/soltys/akcje-mapa-poi";
import { odswiezTransportWsiSoltysa } from "@/app/(site)/panel/soltys/akcje-transport";
import type { SugestiaAutomatyzacjiMapy } from "@/lib/mapa/pobierz-sugestie-automatyzacji-wsi";

type Props = {
  villageId: string;
  nazwaWsi: string;
  sugestie: SugestiaAutomatyzacjiMapy[];
};

export function SugestieAutomatyzacjiMapy({ villageId, nazwaWsi, sugestie }: Props) {
  const [czek, start] = useTransition();
  const [komunikat, ustawKomunikat] = useState<string | null>(null);
  const [blad, ustawBlad] = useState<string | null>(null);

  if (sugestie.length === 0) return null;

  const wysokie = sugestie.filter((s) => s.waga >= 70);

  function uruchomOsm() {
    ustawBlad(null);
    ustawKomunikat(null);
    start(async () => {
      const w = await dodajBrakujacePoiZOpenStreetMap({ villageId, promienM: 2800 });
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawKomunikat(
        w.dodano > 0
          ? `Dodano ${w.dodano} punktów z OSM (w tym przystanki i stacje, jeśli są w bazie).`
          : "Brak nowych punktów — sprawdź mapę lub spróbuj ponownie za kilka dni.",
      );
    });
  }

  function uruchomTransport() {
    ustawBlad(null);
    ustawKomunikat(null);
    start(async () => {
      const w = await odswiezTransportWsiSoltysa({ villageId });
      if (!w.ok) {
        ustawBlad(w.blad);
        return;
      }
      ustawKomunikat(
        `PKP: ${w.kolejOdjazdy} wpisów, autobusy: ${w.autobusOdjazdy}.${w.bledy.length ? ` Uwagi: ${w.bledy.slice(0, 2).join("; ")}` : ""}`,
      );
    });
  }

  return (
    <section className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/60 p-4">
      <h3 className="text-sm font-semibold text-amber-950">Sugestie mapy — {nazwaWsi}</h3>
      <p className="mt-1 text-xs text-amber-900/90">
        System podpowiada, co uzupełnić automatycznie. Większość działa też w tle (cron co 4 h).
      </p>
      <ul className="mt-3 space-y-2">
        {(wysokie.length > 0 ? wysokie : sugestie.slice(0, 4)).map((s) => (
          <li key={s.klucz} className="rounded-lg border border-amber-100 bg-white/80 px-3 py-2 text-sm">
            <p className="font-medium text-stone-900">{s.tytul}</p>
            <p className="mt-0.5 text-xs text-stone-600">{s.opis}</p>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-2">
        {sugestie.some((s) => s.akcja === "osm") && (
          <button
            type="button"
            disabled={czek}
            onClick={uruchomOsm}
            className="rounded-lg bg-green-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-900 disabled:opacity-60"
          >
            {czek ? "Trwa…" : "Uzupełnij z OSM"}
          </button>
        )}
        {sugestie.some((s) => s.akcja === "transport") && (
          <button
            type="button"
            disabled={czek}
            onClick={uruchomTransport}
            className="rounded-lg border border-green-800 px-3 py-1.5 text-xs font-medium text-green-900 hover:bg-green-50 disabled:opacity-60"
          >
            Odśwież PKP i autobusy
          </button>
        )}
        <Link
          href="/panel/soltys/transport"
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
        >
          Panel transportu
        </Link>
        <Link
          href="/mapa"
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
        >
          Mapa katalogu
        </Link>
      </div>
      {komunikat && <p className="mt-2 text-xs text-green-800">{komunikat}</p>}
      {blad && <p className="mt-2 text-xs text-red-800">{blad}</p>}
    </section>
  );
}
