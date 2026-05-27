"use client";

import { useState } from "react";
import {
  odswiezTransportWsiSoltysa,
  ustawRecznaStacjePkpSoltys,
  usunRecznaStacjePkpSoltys,
} from "../akcje-transport";

export type WierszStacji = {
  id: string;
  villageId: string;
  wiesNazwa: string;
  stationId: string;
  stationName: string;
  stationNameSource: string | null;
  distanceKm: number | null;
  isManualOverride: boolean;
  poiName: string | null;
};

type Props = {
  wsie: { id: string; name: string }[];
  stacje: WierszStacji[];
  syncStan: Record<string, { lastRealtime: string | null; lastBus: string | null }>;
};

function formatSync(iso: string | null | undefined): string {
  if (!iso) return "nigdy";
  return new Date(iso).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });
}

export function SoltysTransportKlient({ wsie, stacje, syncStan }: Props) {
  const [villageId, setVillageId] = useState(wsie[0]?.id ?? "");
  const [fraza, setFraza] = useState("");
  const [wyniki, setWyniki] = useState<{ id: string; name: string }[]>([]);
  const [wybrana, setWybrana] = useState<{ id: string; name: string } | null>(null);
  const [komunikat, setKomunikat] = useState<string | null>(null);
  const [ladowanie, setLadowanie] = useState(false);

  async function szukaj() {
    if (fraza.trim().length < 2) return;
    setLadowanie(true);
    setKomunikat(null);
    try {
      const res = await fetch(`/api/transport/szukaj-stacji-pkp?q=${encodeURIComponent(fraza.trim())}`);
      const json = (await res.json()) as { stacje?: { id: string; name: string }[]; blad?: string };
      if (json.blad) setKomunikat(json.blad);
      setWyniki(json.stacje ?? []);
    } catch {
      setKomunikat("Błąd wyszukiwania stacji.");
    } finally {
      setLadowanie(false);
    }
  }

  async function zapisz() {
    if (!wybrana || !villageId) return;
    setLadowanie(true);
    const res = await ustawRecznaStacjePkpSoltys({
      villageId,
      stationId: wybrana.id,
      stationName: wybrana.name,
    });
    setLadowanie(false);
    if (!res.ok) {
      setKomunikat(res.blad);
      return;
    }
    setKomunikat("Zapisano mapowanie i odświeżono odjazdy PKP dla tej wsi.");
    setWybrana(null);
    setFraza("");
    setWyniki([]);
    window.location.reload();
  }

  async function odswiezCache() {
    if (!villageId) return;
    setLadowanie(true);
    setKomunikat(null);
    const res = await odswiezTransportWsiSoltysa({ villageId });
    setLadowanie(false);
    if (!res.ok) {
      setKomunikat(res.blad);
      return;
    }
    const err = res.bledy.length > 0 ? ` Uwagi: ${res.bledy.slice(0, 2).join("; ")}` : "";
    setKomunikat(
      `Zaktualizowano: ${res.kolejOdjazdy} odjazdów PKP, ${res.autobusOdjazdy} autobusów.${err}`,
    );
    window.location.reload();
  }

  const sync = syncStan[villageId];

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4 text-sm text-stone-700">
        <p>
          Ostatnia synchronizacja PKP: <strong>{formatSync(sync?.lastRealtime)}</strong>
          {" · "}
          autobusy: <strong>{formatSync(sync?.lastBus)}</strong>
        </p>
        <button
          type="button"
          className="btn-panel-primary mt-3 text-sm"
          disabled={ladowanie || !villageId}
          onClick={() => void odswiezCache()}
        >
          Odśwież rozkład dla wybranej wsi
        </button>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="font-serif text-lg text-green-950">Ręczne mapowanie stacji PKP</h2>
        <p className="mt-1 text-sm text-stone-600">
          Gdy nazwa z mapy OSM nie pasuje do PKP (np. „Stacja Kcynia” vs „Kcynia”), wybierz właściwą stację z wyszukiwarki.
          Mapowanie ręczne nie jest nadpisywane przez synchronizację automatyczną.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-stone-700">Wieś</span>
            <select
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              value={villageId}
              onChange={(e) => setVillageId(e.target.value)}
            >
              {wsie.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="font-medium text-stone-700">Szukaj stacji PKP</span>
            <div className="mt-1 flex flex-wrap gap-2">
              <input
                type="search"
                className="min-w-[12rem] flex-1 rounded-lg border border-stone-300 px-3 py-2"
                value={fraza}
                onChange={(e) => setFraza(e.target.value)}
                placeholder="np. Inowrocław, Bydgoszcz Główna"
              />
              <button type="button" className="btn-panel-secondary text-sm" disabled={ladowanie} onClick={() => void szukaj()}>
                Szukaj
              </button>
            </div>
          </label>
        </div>

        {wyniki.length > 0 ? (
          <ul className="mt-3 space-y-1 rounded-lg border border-stone-200 p-2">
            {wyniki.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                    wybrana?.id === s.id ? "bg-green-100 text-green-950" : "hover:bg-stone-50"
                  }`}
                  onClick={() => setWybrana(s)}
                >
                  {s.name}
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {wybrana ? (
          <p className="mt-3 text-sm text-stone-700">
            Wybrano: <strong>{wybrana.name}</strong>{" "}
            <button type="button" className="btn-panel-primary ml-2 text-sm" disabled={ladowanie} onClick={() => void zapisz()}>
              Zapisz dla wsi
            </button>
          </p>
        ) : null}

        {komunikat ? <p className="mt-3 text-sm text-amber-900">{komunikat}</p> : null}
      </section>

      <section>
        <h2 className="font-serif text-lg text-green-950">Przypisane stacje</h2>
        {stacje.length === 0 ? (
          <p className="mt-2 text-sm text-stone-600">Brak mapowań — używane są tylko punkty OSM z kategorii „stacja kolejowa”.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {stacje.map((s) => (
              <li key={s.id} className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-stone-900">
                      {s.stationName}
                      {s.isManualOverride ? (
                        <span className="ml-2 rounded bg-sky-100 px-1.5 py-0.5 text-xs text-sky-900">ręcznie</span>
                      ) : (
                        <span className="ml-2 rounded bg-stone-100 px-1.5 py-0.5 text-xs text-stone-600">auto OSM</span>
                      )}
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      {s.wiesNazwa}
                      {s.poiName ? ` · POI: ${s.poiName}` : ""}
                      {s.distanceKm != null ? ` · ${s.distanceKm} km` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-rose-700 underline"
                    onClick={async () => {
                      if (!confirm("Usunąć to mapowanie?")) return;
                      const res = await usunRecznaStacjePkpSoltys({ id: s.id });
                      if (res.ok) window.location.reload();
                      else alert(res.blad);
                    }}
                  >
                    Usuń
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
