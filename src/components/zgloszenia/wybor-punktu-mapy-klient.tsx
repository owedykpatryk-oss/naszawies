"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatujOdleglosc, odlegloscMetry } from "@/lib/geo/odleglosc-metry";
import { MiniMapaPunktuKlient } from "@/components/zgloszenia/mini-mapa-punktu-klient";

type Props = {
  domyslnaLat?: number | null;
  domyslnaLng?: number | null;
  onChange: (lat: number | null, lng: number | null) => void;
  /** Np. środek wsi — do porównania z GPS z telefonu. */
  punktOdniesienia?: { lat: number; lng: number } | null;
  tolerancjaMetry?: number;
  wskazowka?: string;
  pokazTelefon?: boolean;
};

function parsujWspolrzedna(raw: string): number | null {
  const n = parseFloat(raw.replace(",", ".").trim());
  if (!Number.isFinite(n)) return null;
  return n;
}

function wspolrzednePoprawne(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/** Wybór współrzędnych — ręcznie lub z GPS telefonu z podglądem mapy. */
export function WyborPunktuMapyKlient({
  domyslnaLat,
  domyslnaLng,
  onChange,
  punktOdniesienia = null,
  tolerancjaMetry = 2500,
  wskazowka,
  pokazTelefon = true,
}: Props) {
  const startLat = domyslnaLat ?? punktOdniesienia?.lat ?? 52.1;
  const startLng = domyslnaLng ?? punktOdniesienia?.lng ?? 19.4;
  const [wlacz, ustawWlacz] = useState(domyslnaLat != null && domyslnaLng != null);
  const [lat, ustawLat] = useState(
    domyslnaLat != null ? String(domyslnaLat) : String(startLat),
  );
  const [lng, ustawLng] = useState(
    domyslnaLng != null ? String(domyslnaLng) : String(startLng),
  );
  const [statusGps, ustawStatusGps] = useState<"idle" | "wczytuje" | "ok" | "blad">("idle");
  const [bladGps, ustawBladGps] = useState("");
  const [gpsTelefon, ustawGpsTelefon] = useState<{ lat: number; lng: number } | null>(null);
  const [zaakceptowanoTelefon, ustawZaakceptowanoTelefon] = useState(false);

  const la = parsujWspolrzedna(lat);
  const ln = parsujWspolrzedna(lng);
  const recznePoprawne = la != null && ln != null && wspolrzednePoprawne(la, ln);

  const odlegloscOdReferencji = useMemo(() => {
    if (!gpsTelefon || !punktOdniesienia) return null;
    return odlegloscMetry(gpsTelefon.lat, gpsTelefon.lng, punktOdniesienia.lat, punktOdniesienia.lng);
  }, [gpsTelefon, punktOdniesienia]);

  const zgadzaSie =
    odlegloscOdReferencji != null ? odlegloscOdReferencji <= tolerancjaMetry : gpsTelefon != null;

  const oczekujeAkceptacjiTelefonu = gpsTelefon != null && !zaakceptowanoTelefon;

  const wyslijDoRodzica = useCallback(
    (latitude: number | null, longitude: number | null) => {
      onChange(latitude, longitude);
    },
    [onChange],
  );

  useEffect(() => {
    if (!wlacz) {
      wyslijDoRodzica(null, null);
      return;
    }
    if (oczekujeAkceptacjiTelefonu) {
      wyslijDoRodzica(null, null);
      return;
    }
    if (recznePoprawne) {
      wyslijDoRodzica(la, ln);
      return;
    }
    wyslijDoRodzica(null, null);
  }, [wlacz, oczekujeAkceptacjiTelefonu, recznePoprawne, la, ln, wyslijDoRodzica]);

  useEffect(() => {
    if (domyslnaLat != null) ustawLat(String(domyslnaLat));
    if (domyslnaLng != null) ustawLng(String(domyslnaLng));
  }, [domyslnaLat, domyslnaLng]);

  function pobierzZGps() {
    ustawBladGps("");
    ustawZaakceptowanoTelefon(false);
    if (!("geolocation" in navigator)) {
      ustawStatusGps("blad");
      ustawBladGps("Przeglądarka nie obsługuje lokalizacji GPS.");
      return;
    }
    ustawStatusGps("wczytuje");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const punkt = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        ustawGpsTelefon(punkt);
        ustawLat(String(punkt.lat));
        ustawLng(String(punkt.lng));
        ustawStatusGps("ok");
      },
      (err) => {
        ustawStatusGps("blad");
        ustawGpsTelefon(null);
        if (err.code === err.PERMISSION_DENIED) {
          ustawBladGps("Brak zgody na lokalizację — włącz GPS w ustawieniach telefonu i przeglądarki.");
        } else {
          ustawBladGps("Nie udało się odczytać lokalizacji. Spróbuj ponownie lub wpisz współrzędne ręcznie.");
        }
      },
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 15_000 },
    );
  }

  function akceptujTelefon() {
    if (!gpsTelefon) return;
    ustawZaakceptowanoTelefon(true);
    wyslijDoRodzica(gpsTelefon.lat, gpsTelefon.lng);
  }

  function onRecznaZmiana(nowyLat: string, nowyLng: string) {
    ustawLat(nowyLat);
    ustawLng(nowyLng);
    ustawGpsTelefon(null);
    ustawZaakceptowanoTelefon(false);
    ustawStatusGps("idle");
    ustawBladGps("");
  }

  const domyslnaWskazowka =
    wskazowka ??
    "Wskazówka: w Google Maps przytrzymaj punkt → skopiuj współrzędne. Opcjonalne — przyspiesza lokalizację problemu.";

  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50/60 p-3">
      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-stone-800">
        <input
          type="checkbox"
          checked={wlacz}
          onChange={() => {
            const nowe = !wlacz;
            ustawWlacz(nowe);
            if (!nowe) {
              ustawGpsTelefon(null);
              ustawZaakceptowanoTelefon(false);
              ustawStatusGps("idle");
              ustawBladGps("");
            }
          }}
          className="accent-green-800"
        />
        Zaznacz punkt na mapie (współrzędne GPS)
      </label>
      {wlacz ? (
        <div className="mt-2 space-y-3">
          {pokazTelefon ? (
            <div className="rounded-lg border border-green-200/80 bg-green-50/50 p-2.5">
              <p className="text-xs font-medium text-green-950">Lokalizacja z telefonu</p>
              <p className="mt-0.5 text-xs text-green-900/80">
                Na miejscu odbioru lub sprzedaży użyj GPS — porównamy z okolicą wsi i pokażemy podgląd.
              </p>
              <button
                type="button"
                onClick={pobierzZGps}
                disabled={statusGps === "wczytuje"}
                className="mt-2 rounded-lg border border-green-800/25 bg-white px-3 py-2 text-sm font-medium text-green-900 hover:bg-green-50 disabled:opacity-60"
              >
                {statusGps === "wczytuje" ? "Pobieram lokalizację…" : "Użyj lokalizacji z telefonu"}
              </button>
              {bladGps ? <p className="mt-2 text-xs text-red-800">{bladGps}</p> : null}
            </div>
          ) : null}

          {gpsTelefon ? (
            <div className="space-y-2">
              <MiniMapaPunktuKlient
                lat={gpsTelefon.lat}
                lng={gpsTelefon.lng}
                punktOdniesienia={punktOdniesienia}
              />
              {punktOdniesienia && odlegloscOdReferencji != null ? (
                <p
                  className={`rounded-lg px-2.5 py-2 text-xs ${
                    zgadzaSie
                      ? "border border-green-200 bg-green-50 text-green-900"
                      : "border border-amber-200 bg-amber-50 text-amber-950"
                  }`}
                >
                  {zgadzaSie ? (
                    <>
                      Lokalizacja <strong>zgadza się</strong> z okolicą wsi (
                      {formatujOdleglosc(odlegloscOdReferencji)} od środka).
                    </>
                  ) : (
                    <>
                      Telefon jest <strong>{formatujOdleglosc(odlegloscOdReferencji)}</strong> od środka wsi —
                      upewnij się, że to właściwe miejsce odbioru.
                    </>
                  )}
                </p>
              ) : (
                <p className="text-xs text-stone-600">
                  Współrzędne z telefonu: {gpsTelefon.lat.toFixed(5)}, {gpsTelefon.lng.toFixed(5)}
                </p>
              )}
              {zaakceptowanoTelefon ? (
                <p className="text-xs font-medium text-green-800">✓ Lokalizacja zaakceptowana</p>
              ) : (
                <button
                  type="button"
                  onClick={akceptujTelefon}
                  className={`w-full rounded-lg px-3 py-2 text-sm font-semibold text-white ${
                    zgadzaSie ? "bg-green-800 hover:bg-green-900" : "bg-amber-700 hover:bg-amber-800"
                  }`}
                >
                  {zgadzaSie ? "Akceptuję lokalizację" : "Akceptuję tę lokalizację"}
                </button>
              )}
            </div>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <label className="mb-0.5 block text-xs text-stone-600" htmlFor="zgl-lat">
                Szerokość (lat)
              </label>
              <input
                id="zgl-lat"
                type="text"
                inputMode="decimal"
                value={lat}
                onChange={(e) => onRecznaZmiana(e.target.value, lng)}
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-0.5 block text-xs text-stone-600" htmlFor="zgl-lng">
                Długość (lng)
              </label>
              <input
                id="zgl-lng"
                type="text"
                inputMode="decimal"
                value={lng}
                onChange={(e) => onRecznaZmiana(lat, e.target.value)}
                className="w-full"
              />
            </div>
            <p className="sm:col-span-2 text-xs text-stone-500">{domyslnaWskazowka}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
