"use client";

import type { KompletnoscMapyWsi } from "@/lib/mapa/oblicz-kompletnosc-mapy-wsi";

type Props = {
  nazwaWsi: string;
  kompletnosc: KompletnoscMapyWsi;
};

export function PasekKompletnosciMapy({ nazwaWsi, kompletnosc }: Props) {
  const { procent, brakujace, doWeryfikacji, oczekujacePropozycje, maGps, maObrys } = kompletnosc;
  const kolor =
    procent >= 80 ? "from-emerald-500 to-green-600" : procent >= 50 ? "from-amber-400 to-orange-500" : "from-red-400 to-rose-500";

  return (
    <section className="mt-4 rounded-xl border border-stone-200/90 bg-white/90 p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-green-950">Kompletność mapy — {nazwaWsi}</h3>
          <p className="mt-0.5 text-xs text-stone-600">
            {kompletnosc.posiadaneKategorie}/{kompletnosc.lacznieKategorii} kluczowych kategorii POI
            {!maGps ? " · brak GPS wsi" : ""}
            {!maObrys ? " · brak obrysu PRG" : ""}
          </p>
        </div>
        <p className="text-2xl font-bold tabular-nums text-green-950">{procent}%</p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-200/80">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${kolor} transition-all`}
          style={{ width: `${procent}%` }}
          role="progressbar"
          aria-valuenow={procent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Kompletność mapy ${procent} procent`}
        />
      </div>
      {brakujace.length > 0 ? (
        <p className="mt-2 text-xs text-stone-600">
          Brakuje:{" "}
          {brakujace
            .slice(0, 6)
            .map((b) => b.etykieta)
            .join(", ")}
          {brakujace.length > 6 ? ` (+${brakujace.length - 6})` : ""}
        </p>
      ) : (
        <p className="mt-2 text-xs text-emerald-800">Wszystkie kluczowe kategorie są na mapie.</p>
      )}
      {(doWeryfikacji > 0 || oczekujacePropozycje > 0) && (
        <p className="mt-2 text-xs font-medium text-sky-900">
          {doWeryfikacji > 0 ? `${doWeryfikacji} do weryfikacji (OSM)` : ""}
          {doWeryfikacji > 0 && oczekujacePropozycje > 0 ? " · " : ""}
          {oczekujacePropozycje > 0 ? `${oczekujacePropozycje} propozycji mieszkańców` : ""}
          {" — "}
          <a href="#kolejka-weryfikacji-mapy" className="text-green-800 underline">
            przejdź do kolejki
          </a>
        </p>
      )}
      {brakujace.length > 0 && procent < 80 ? (
        <p className="mt-2 text-xs text-stone-600">
          Użyj przycisków „Pobierz z OSM” poniżej albo zaakceptuj propozycje mieszkańców, aby uzupełnić braki.
        </p>
      ) : null}
    </section>
  );
}
