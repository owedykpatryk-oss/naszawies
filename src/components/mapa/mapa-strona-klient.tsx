"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { MapaAutomatyzacjaKlient } from "@/components/mapa/mapa-automatyzacja-klient";
import { MapaStatystykiBanner } from "@/components/mapa/mapa-statystyki-banner";
import { MapaWsiStronaDynamic, MapaWsiStronaSkeleton } from "@/components/mapa/mapa-wsi-strona-dynamic";
import type { DaneMapyStrony } from "@/lib/mapa/pobierz-dane-mapy-strony";
import type { ZakresMapy } from "@/lib/mapa/pobierz-publiczne-dane-mapy";

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
          <p className="text-xs text-green-900/65">Kolejne wejścia będą szybsze dzięki cache.</p>
        </div>
      </div>
    </div>
  );
}

async function pobierzFaze(
  zakres: ZakresMapy,
  faza: "rdzen" | "pelne",
  signal: AbortSignal,
): Promise<DaneMapyStrony> {
  const params = new URLSearchParams({ zakres, faza });
  const res = await fetch(`/api/mapa/dane?${params}`, { credentials: "include", signal });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { blad?: string } | null;
    throw new Error(body?.blad ?? `Błąd ${res.status}`);
  }
  return res.json() as Promise<DaneMapyStrony>;
}

function polaczDane(rdzen: DaneMapyStrony, warstwy: DaneMapyStrony): DaneMapyStrony {
  return {
    ...warstwy,
    znaczniki: rdzen.znaczniki.length > 0 ? rdzen.znaczniki : warstwy.znaczniki,
    zakres: warstwy.zakres,
  };
}

export function MapaStronaKlient() {
  const [dane, ustawDane] = useState<DaneMapyStrony | null>(null);
  const [blad, ustawBlad] = useState<string | null>(null);
  const [etap, ustawEtap] = useState<"start" | "rdzen" | "warstwy" | "polska">("start");
  const [zakres, ustawZakres] = useState<ZakresMapy>("nakielski");
  const [ladowanieWarstw, ustawLadowanieWarstw] = useState(false);

  const zaladujZakres = useCallback(async (cel: ZakresMapy, signal: AbortSignal) => {
    ustawEtap(cel === "polska" ? "polska" : "rdzen");
    ustawLadowanieWarstw(true);

    const rdzen = await pobierzFaze(cel, "rdzen", signal);
    ustawDane(rdzen);
    ustawZakres(cel);
    ustawEtap("warstwy");

    const pelne = await pobierzFaze(cel, "pelne", signal);
    ustawDane((prev) => (prev ? polaczDane(prev, pelne) : pelne));
    ustawLadowanieWarstw(false);
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    ustawBlad(null);
    void zaladujZakres("nakielski", ctrl.signal).catch((err: unknown) => {
      if (ctrl.signal.aborted) return;
      ustawBlad(err instanceof Error ? err.message : "Nie udało się wczytać mapy.");
      ustawLadowanieWarstw(false);
    });
    return () => {
      ctrl.abort();
    };
  }, [zaladujZakres]);

  const rozszerzDoPolski = useCallback(() => {
    if (zakres === "polska" || ladowanieWarstw) return;
    const ctrl = new AbortController();
    ustawBlad(null);
    void zaladujZakres("polska", ctrl.signal).catch((err: unknown) => {
      if (ctrl.signal.aborted) return;
      ustawBlad(err instanceof Error ? err.message : "Nie udało się wczytać całej Polski.");
      ustawLadowanieWarstw(false);
    });
  }, [zakres, ladowanieWarstw, zaladujZakres]);

  if (blad && !dane) {
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
        : etap === "polska"
          ? "Wczytujemy katalog Polski…"
          : etap === "rdzen"
            ? "Wczytujemy wsie powiatu nakielskiego…"
            : "Dodajemy POI i warstwy…";
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
      {blad ? (
        <p className="mx-3 mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800 sm:mx-4" role="alert">
          {blad}
        </p>
      ) : null}
      {dane.bladZapytania ? (
        <p className="mx-3 mt-2 rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs text-amber-950 sm:mx-4">
          {dane.bladZapytania}
        </p>
      ) : null}
      {ladowanieWarstw ? (
        <p className="pointer-events-none mx-3 mt-1 text-center text-[11px] text-green-900/60 sm:mx-4">
          Uzupełniamy POI i warstwy w tle…
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
          onRozszerzDoPolski={rozszerzDoPolski}
          ladowaniePelnejPolski={ladowanieWarstw && zakres === "polska"}
        />
      </Suspense>
    </div>
  );
}
