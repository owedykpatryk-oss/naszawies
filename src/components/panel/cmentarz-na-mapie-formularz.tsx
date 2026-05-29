"use client";

import { FormEvent, useState, useTransition } from "react";
import {
  dodajCmentarzRecznie,
  dodajCmentarzeZOsm,
} from "@/app/(site)/panel/soltys/akcje-mapa-poi";
import { WyborPunktuMapyKlient } from "@/components/zgloszenia/wybor-punktu-mapy-klient";

type Props = {
  villageId: string;
  nazwaWsi: string;
  domyslnaLat?: number | null;
  domyslnaLng?: number | null;
  istniejaceCmentarze?: { name: string }[];
  maGps: boolean;
};

function formatujWynikOsm(wynik: {
  dodano: number;
  pominietoDuplikaty: number;
  odrzuconoBladZapisu: number;
}): string {
  const czesci: string[] = [];
  if (wynik.dodano > 0) {
    czesci.push(`Dodano ${wynik.dodano} cmentarz${wynik.dodano === 1 ? "" : "y"} z OSM.`);
  } else {
    czesci.push("Nie znaleziono nowego cmentarza w OSM w zasięgu (albo jest już zapisany).");
  }
  if (wynik.pominietoDuplikaty > 0) {
    czesci.push(`Pominięto ${wynik.pominietoDuplikaty} jako zbyt bliskie istniejącym.`);
  }
  if (wynik.odrzuconoBladZapisu > 0) {
    czesci.push(`Część zapisów nie powiodła się (${wynik.odrzuconoBladZapisu}).`);
  }
  return czesci.join(" ");
}

export function CmentarzNaMapieFormularz({
  villageId,
  nazwaWsi,
  domyslnaLat,
  domyslnaLng,
  istniejaceCmentarze = [],
  maGps,
}: Props) {
  const [lat, ustawLat] = useState<number | null>(domyslnaLat ?? null);
  const [lng, ustawLng] = useState<number | null>(domyslnaLng ?? null);
  const [blad, ustawBlad] = useState("");
  const [ok, ustawOk] = useState("");
  const [czekOsm, startOsm] = useTransition();
  const [czekReczny, startReczny] = useTransition();

  function pobierzZOsm() {
    ustawBlad("");
    ustawOk("");
    startOsm(async () => {
      const wynik = await dodajCmentarzeZOsm({ villageId, promienM: 4000 });
      if ("blad" in wynik) {
        ustawBlad(wynik.blad);
        return;
      }
      ustawOk(formatujWynikOsm(wynik));
    });
  }

  function zapiszRecznie(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    ustawBlad("");
    ustawOk("");
    if (lat == null || lng == null) {
      ustawBlad("Kliknij na mapie wejście lub środek cmentarza.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    startReczny(async () => {
      const wynik = await dodajCmentarzRecznie({
        villageId,
        name: String(fd.get("name") ?? `Cmentarz — ${nazwaWsi}`),
        latitude: lat,
        longitude: lng,
        description: String(fd.get("description") ?? "").trim() || null,
      });
      if ("blad" in wynik) {
        ustawBlad(wynik.blad);
        return;
      }
      ustawOk("Cmentarz zapisany na mapie wsi.");
      e.currentTarget.reset();
    });
  }

  return (
    <div className="mt-6 rounded-xl border border-stone-300/80 bg-stone-50/60 p-4">
      <h4 className="font-medium text-stone-900">🕯 Cmentarz na mapie</h4>
      <p className="mt-1 text-xs leading-relaxed text-stone-600">
        Pinezka cmentarza na mapie wsi (kategoria POI). Pełny <strong>plan grobów z wyszukiwarką</strong> z landingu
        to osobny moduł — tu szybko dodajesz lokalizację dla mieszkańców.
      </p>

      {istniejaceCmentarze.length > 0 ? (
        <ul className="mt-2 text-xs text-stone-700">
          {istniejaceCmentarze.map((c) => (
            <li key={c.name} className="flex items-center gap-1.5">
              <span aria-hidden>✓</span>
              {c.name}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-amber-900">Brak cmentarza na mapie — możesz zaimportować z OSM lub wskazać ręcznie.</p>
      )}

      {blad ? (
        <p className="mt-2 text-sm text-red-800" role="alert">
          {blad}
        </p>
      ) : null}
      {ok ? (
        <p className="mt-2 text-sm text-green-800" role="status">
          {ok}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={czekOsm || !maGps}
          onClick={pobierzZOsm}
          className="rounded-lg border border-stone-400 bg-white px-3 py-2 text-sm font-medium text-stone-900 shadow-sm hover:bg-stone-50 disabled:opacity-50"
        >
          {czekOsm ? "Szukam w OSM…" : "Szybko: cmentarz z OpenStreetMap"}
        </button>
      </div>

      <form onSubmit={zapiszRecznie} className="mt-4 space-y-3 border-t border-stone-200 pt-4">
        <p className="text-xs font-medium text-stone-700">Ręcznie (gdy OSM nie ma obrysu)</p>
        <input
          name="name"
          defaultValue={`Cmentarz parafialny — ${nazwaWsi}`}
          required
          className="w-full rounded border border-stone-300 px-3 py-2 text-sm"
          placeholder="Nazwa na mapie"
        />
        <textarea
          name="description"
          rows={2}
          placeholder="Np. wejście od drogi gminnej, obok kościoła (opcjonalnie)"
          className="w-full rounded border border-stone-300 px-3 py-2 text-sm"
        />
        {maGps ? (
          <WyborPunktuMapyKlient
            domyslnaLat={domyslnaLat}
            domyslnaLng={domyslnaLng}
            onChange={(nowaLat, nowaLng) => {
              ustawLat(nowaLat);
              ustawLng(nowaLng);
            }}
          />
        ) : (
          <p className="text-xs text-amber-900">Uzupełnij GPS wsi, aby wybrać punkt na mapie.</p>
        )}
        <button
          type="submit"
          disabled={czekReczny || !maGps}
          className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-900 disabled:opacity-50"
        >
          {czekReczny ? "Zapisuję…" : "Dodaj cmentarz na mapie"}
        </button>
      </form>
    </div>
  );
}
