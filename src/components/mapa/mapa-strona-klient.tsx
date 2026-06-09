"use client";

import { Suspense, useEffect, useState } from "react";
import { MapaAutomatyzacjaKlient } from "@/components/mapa/mapa-automatyzacja-klient";
import { MapaStatystykiBanner } from "@/components/mapa/mapa-statystyki-banner";
import { MapaWsiStronaDynamic, MapaWsiStronaSkeleton } from "@/components/mapa/mapa-wsi-strona-dynamic";
import type { DaneMapyStrony } from "@/lib/mapa/pobierz-dane-mapy-strony";

function MapaLadowanie({ komunikat }: { komunikat: string }) {
  return (
    <div
      className="mapa-widget-pelny relative flex min-h-[280px] flex-1 flex-col overflow-hidden bg-gradient-to-br from-emerald-50/80 to-stone-100/60"
      role="status"
      aria-live="polite"
      aria-label="Ładowanie mapy"
    >
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="h-12 w-12 rounded-full border-2 border-green-800/15 border-t-green-800/70 animate-spin" />
        <div className="max-w-sm space-y-1">
          <p className="text-sm font-medium text-green-950">{komunikat}</p>
          <p className="text-xs text-green-900/65">To chwilę potrwa przy pierwszym wejściu — kolejne odświeżenia będą szybsze.</p>
        </div>
      </div>
    </div>
  );
}

export function MapaStronaKlient({ liczbaWsiHint }: { liczbaWsiHint?: number | null }) {
  const [dane, ustawDane] = useState<DaneMapyStrony | null>(null);
  const [blad, ustawBlad] = useState<string | null>(null);
  const [etap, ustawEtap] = useState<"start" | "znaczniki" | "warstwy">("start");

  useEffect(() => {
    const ctrl = new AbortController();
    ustawEtap("znaczniki");

    void fetch("/api/mapa/dane", { credentials: "include", signal: ctrl.signal })
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { blad?: string } | null;
          throw new Error(body?.blad ?? `Błąd ${res.status}`);
        }
        return res.json() as Promise<DaneMapyStrony>;
      })
      .then((json) => {
        ustawEtap("warstwy");
        ustawDane(json);
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        ustawBlad(err instanceof Error ? err.message : "Nie udało się wczytać mapy.");
      });

    return () => {
      ctrl.abort();
    };
  }, []);

  if (blad) {
    return (
      <p className="mx-3 mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 sm:mx-4" role="alert">
        {blad}
      </p>
    );
  }

  if (!dane) {
    const tekst =
      etap === "start"
        ? "Przygotowujemy mapę…"
        : etap === "znaczniki"
          ? liczbaWsiHint
            ? `Wczytujemy katalog ${liczbaWsiHint} wiosek…`
            : "Wczytujemy katalog wsi…"
          : "Przygotowujemy warstwy mapy…";
    return <MapaLadowanie komunikat={tekst} />;
  }

  if (dane.znaczniki.length === 0) {
    return (
      <p className="mx-3 mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 sm:mx-4">
        Brak wsi z uzupełnionymi współrzędnymi. Po dodaniu danych w bazie mapa się wypełni.
      </p>
    );
  }

  return (
    <div className="mapa-widget-pelny flex min-h-0 flex-1 flex-col">
      {dane.bladZapytania ? (
        <p className="mx-3 mt-2 rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs text-amber-950 sm:mx-4">
          {dane.bladZapytania}
        </p>
      ) : null}
      <MapaStatystykiBanner statystyki={dane.statystykiMapy} />
      <Suspense fallback={<MapaWsiStronaSkeleton />}>
        <MapaAutomatyzacjaKlient
          znaczniki={dane.znacznikiDoSync}
          villageIdsDoUzupelnienia={dane.villageIdsDoUzupelnienia}
          statystyki={dane.statystykiMapy}
        />
        <MapaWsiStronaDynamic
          znaczniki={dane.znaczniki}
          punktyPoi={dane.punktyPoi}
          punktyAdresy={dane.punktyAdresy}
          punktyRynek={dane.punktyRynek}
          punktyRynekDzialki={dane.punktyRynekDzialki}
          punktyZgloszenia={dane.punktyZgloszenia}
          punktyPolowania={dane.punktyPolowania}
          ostrzezeniaLesne={dane.ostrzezeniaLesne}
          punktyKola={dane.punktyKola}
          rewiryLowieckie={dane.rewiryLowieckie}
          punktyCmentarze={dane.obrysyCmentarzy}
          punktyGeoKontekst={dane.punktyGeoKontekst}
        />
      </Suspense>
    </div>
  );
}
