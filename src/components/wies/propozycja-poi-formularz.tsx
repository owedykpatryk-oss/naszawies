"use client";

import { FormEvent, useState, useTransition } from "react";
import { zlozPropozycjePoi } from "@/app/(site)/panel/soltys/akcje-poi-propozycje";
import { WyborPunktuMapyKlient } from "@/components/zgloszenia/wybor-punktu-mapy-klient";
import { etykietaKategoriiPoi } from "@/lib/mapa/kategorie-poi";
import { KATEGORIE_PROPONOWALNE_POI } from "@/lib/mapa/kategorie-poi-bazowe";

type Props = {
  villageId: string;
  nazwaWsi: string;
  domyslnaLat?: number | null;
  domyslnaLng?: number | null;
};

export function PropozycjaPoiFormularz({ villageId, nazwaWsi, domyslnaLat, domyslnaLng }: Props) {
  const [czek, start] = useTransition();
  const [blad, ustawBlad] = useState("");
  const [ok, ustawOk] = useState(false);
  const [lat, ustawLat] = useState<number | null>(domyslnaLat ?? null);
  const [lng, ustawLng] = useState<number | null>(domyslnaLng ?? null);

  function wyslij(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    ustawBlad("");
    ustawOk(false);
    if (lat == null || lng == null) {
      ustawBlad("Wskaż punkt na mapie.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const w = await zlozPropozycjePoi({
        villageId,
        category: String(fd.get("category") ?? "inne"),
        name: String(fd.get("name") ?? ""),
        description: String(fd.get("description") ?? "") || null,
        latitude: lat,
        longitude: lng,
      });
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawOk(true);
      e.currentTarget.reset();
    });
  }

  return (
    <details className="mt-4 rounded-xl border border-stone-200/80 bg-stone-50/60 p-3 text-sm open:bg-white/90">
      <summary className="cursor-pointer font-medium text-green-950">
        Brakuje miejsca na mapie? Zaproponuj punkt
      </summary>
      <p className="mt-2 text-xs text-stone-600">
        Propozycja trafia do sołtysa {nazwaWsi}. Po zatwierdzeniu pojawi się na mapie wsi.
      </p>
      <form onSubmit={wyslij} className="mt-3 space-y-3">
        <label className="block text-xs font-medium">
          Nazwa miejsca
          <input
            name="name"
            required
            minLength={2}
            maxLength={200}
            placeholder="np. Sklep Spożywczy u Kowalskich"
            className="mt-1 block w-full rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block text-xs font-medium">
          Kategoria
          <select
            name="category"
            defaultValue="sklep"
            className="mt-1 block w-full rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
          >
            {KATEGORIE_PROPONOWALNE_POI.map((k) => (
              <option key={k} value={k}>
                {etykietaKategoriiPoi(k)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium">
          Uwagi (opcj.)
          <textarea
            name="description"
            rows={2}
            maxLength={800}
            placeholder="np. przy skrzyżowaniu, obok kościoła"
            className="mt-1 block w-full rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
          />
        </label>
        <WyborPunktuMapyKlient
          domyslnaLat={domyslnaLat}
          domyslnaLng={domyslnaLng}
          onChange={(nowaLat, nowaLng) => {
            ustawLat(nowaLat);
            ustawLng(nowaLng);
          }}
          wskazowka="Kliknij mapę lub użyj GPS telefonu, żeby wskazać miejsce."
        />
        {blad ? (
          <p className="text-sm text-red-800" role="alert">
            {blad}
          </p>
        ) : null}
        {ok ? (
          <p className="text-sm text-emerald-800" role="status">
            Dziękujemy — sołtys zobaczy propozycję w panelu.
          </p>
        ) : null}
        <button
          type="submit"
          disabled={czek}
          className="rounded-lg bg-green-800 px-4 py-2 text-xs font-medium text-white hover:bg-green-900 disabled:opacity-60"
        >
          {czek ? "Wysyłam…" : "Wyślij propozycję"}
        </button>
      </form>
    </details>
  );
}
