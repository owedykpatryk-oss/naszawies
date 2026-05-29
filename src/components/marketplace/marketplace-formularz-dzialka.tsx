"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { GeoJsonPolygonPolowania } from "@/lib/lowiectwo/geojson-obszar";
import { formatujPowierzchnieDzialki } from "@/lib/marketplace/nieruchomosci";
import type { GeoJsonGeometriiDzialki } from "@/lib/geoportal/wkt-do-geojson";

const EdytorObszaruPolowania = dynamic(
  () => import("@/components/panel/edytor-obszaru-polowania").then((m) => ({ default: m.EdytorObszaruPolowania })),
  { ssr: false, loading: () => <p className="text-sm text-stone-500">Ładowanie mapy działki…</p> },
);

export type WartosciDzialkiRynek = {
  parcelGeojson: GeoJsonGeometriiDzialki | null;
  parcelNumber: string;
  cadastralDistrict: string;
  parcelAreaM2: number | null;
  geoportalParcelId: string;
};

type Props = {
  srodekLat: number;
  srodekLng: number;
  boundaryGeojson?: unknown | null;
  wartosci: WartosciDzialkiRynek;
  onChange: (v: WartosciDzialkiRynek) => void;
  onCentroid?: (lat: number, lng: number) => void;
};

type WynikApi = {
  ok?: boolean;
  blad?: string;
  dzialka?: {
    id: string;
    numer: string | null;
    obreb: string | null;
    geometria: GeoJsonGeometriiDzialki;
    powierzchniaM2: number | null;
    centroid: { lat: number; lng: number };
  };
};

function polygonDoEdytora(geo: GeoJsonGeometriiDzialki | null): GeoJsonPolygonPolowania | null {
  if (!geo) return null;
  if (geo.type === "Polygon") return geo;
  const first = geo.coordinates[0]?.[0];
  if (!first) return null;
  return { type: "Polygon", coordinates: [first] };
}

export function MarketplaceFormularzDzialka({ srodekLat, srodekLng, boundaryGeojson, wartosci, onChange, onCentroid }: Props) {
  const [tryb, ustawTryb] = useState<"geoportal" | "recznie">("geoportal");
  const [idSzukaj, ustawIdSzukaj] = useState(wartosci.geoportalParcelId);
  const [laduje, ustawLaduje] = useState(false);
  const [blad, ustawBlad] = useState("");

  async function pobierzZGeoportalu(body: { lng: number; lat: number } | { parcelId: string }) {
    ustawLaduje(true);
    ustawBlad("");
    try {
      const res = await fetch("/api/rynek/geoportal/dzialka", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as WynikApi;
      if (!res.ok || !json.dzialka) {
        ustawBlad(json.blad ?? "Nie udało się pobrać działki.");
        return;
      }
      const d = json.dzialka;
      onChange({
        parcelGeojson: d.geometria,
        parcelNumber: d.numer ?? "",
        cadastralDistrict: d.obreb ?? "",
        parcelAreaM2: d.powierzchniaM2,
        geoportalParcelId: d.id,
      });
      onCentroid?.(d.centroid.lat, d.centroid.lng);
    } catch {
      ustawBlad("Błąd połączenia z Geoportalu.");
    } finally {
      ustawLaduje(false);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/60 via-white to-sky-50/40 p-4">
      <div>
        <p className="text-sm font-semibold text-emerald-950">Mapa działki / domu (tylko dla tego ogłoszenia)</p>
        <p className="mt-1 text-xs text-stone-600">
          Pobierz granicę z{" "}
          <a href="https://uldk.gugik.gov.pl/" className="underline" target="_blank" rel="noreferrer">
            Geoportalu ULDK
          </a>{" "}
          albo narysuj obszar ręcznie. Kupujący zobaczy kolorowy poligon na mapie ogłoszenia.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`rounded-full px-3 py-1 text-xs font-medium ${tryb === "geoportal" ? "bg-emerald-800 text-white" : "border border-stone-300 bg-white"}`}
          onClick={() => ustawTryb("geoportal")}
        >
          Geoportal (klik / numer)
        </button>
        <button
          type="button"
          className={`rounded-full px-3 py-1 text-xs font-medium ${tryb === "recznie" ? "bg-emerald-800 text-white" : "border border-stone-300 bg-white"}`}
          onClick={() => ustawTryb("recznie")}
        >
          Rysuj ręcznie
        </button>
      </div>

      {tryb === "geoportal" ? (
        <div className="space-y-3">
          <form
            className="flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const id = idSzukaj.trim();
              if (id.length >= 5) void pobierzZGeoportalu({ parcelId: id });
            }}
          >
            <input
              value={idSzukaj}
              onChange={(e) => ustawIdSzukaj(e.target.value)}
              placeholder="Identyfikator ULDK, np. 141201_1.0001.6509"
              className="min-w-[220px] flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
            <button type="submit" disabled={laduje} className="btn-panel-primary text-sm">
              {laduje ? "Szukam…" : "Pobierz po numerze"}
            </button>
          </form>
          <p className="text-xs text-stone-500">
            Albo kliknij punkt na mapie poniżej — pobierzemy działkę pod kursorem (wymaga logowania).
          </p>
          <MapaKlikGeoportal
            srodekLat={srodekLat}
            srodekLng={srodekLng}
            boundaryGeojson={boundaryGeojson}
            geometria={wartosci.parcelGeojson}
            laduje={laduje}
            onKlik={(lat, lng) => void pobierzZGeoportalu({ lng, lat })}
          />
        </div>
      ) : (
        <EdytorObszaruPolowania
          srodekLat={srodekLat}
          srodekLng={srodekLng}
          boundaryGeojson={boundaryGeojson}
          value={polygonDoEdytora(wartosci.parcelGeojson)}
          onChange={(poly) => {
            onChange({
              ...wartosci,
              parcelGeojson: poly,
              geoportalParcelId: "",
            });
          }}
        />
      )}

      {blad ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {blad}
        </p>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-sm">
          Numer działki
          <input
            value={wartosci.parcelNumber}
            onChange={(e) => onChange({ ...wartosci, parcelNumber: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-stone-300 px-2 py-1.5"
            placeholder="np. 123/4"
          />
        </label>
        <label className="text-sm">
          Obręb ewidencyjny
          <input
            value={wartosci.cadastralDistrict}
            onChange={(e) => onChange({ ...wartosci, cadastralDistrict: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-stone-300 px-2 py-1.5"
          />
        </label>
        <label className="text-sm">
          Powierzchnia (m², opcjonalnie)
          <input
            type="number"
            min={1}
            value={wartosci.parcelAreaM2 ?? ""}
            onChange={(e) =>
              onChange({
                ...wartosci,
                parcelAreaM2: e.target.value === "" ? null : Number(e.target.value),
              })
            }
            className="mt-1 block w-full rounded-lg border border-stone-300 px-2 py-1.5"
          />
        </label>
        {wartosci.parcelAreaM2 ? (
          <p className="self-end text-sm text-emerald-900">{formatujPowierzchnieDzialki(wartosci.parcelAreaM2)}</p>
        ) : null}
      </div>

      {wartosci.parcelGeojson ? (
        <p className="text-sm font-medium text-emerald-900">✓ Granica działki zaznaczona na mapie ogłoszenia</p>
      ) : (
        <p className="text-xs text-amber-800">Bez granicy ogłoszenie będzie miało tylko punkt GPS (jeśli podasz).</p>
      )}
    </div>
  );
}

function MapaKlikGeoportal({
  srodekLat,
  srodekLng,
  boundaryGeojson,
  geometria,
  laduje,
  onKlik,
}: {
  srodekLat: number;
  srodekLng: number;
  boundaryGeojson?: unknown | null;
  geometria: GeoJsonGeometriiDzialki | null;
  laduje: boolean;
  onKlik: (lat: number, lng: number) => void;
}) {
  return (
    <MapaKlikGeoportalInner
      srodekLat={srodekLat}
      srodekLng={srodekLng}
      boundaryGeojson={boundaryGeojson}
      geometria={geometria}
      laduje={laduje}
      onKlik={onKlik}
    />
  );
}

function MapaKlikGeoportalInner({
  srodekLat,
  srodekLng,
  boundaryGeojson,
  geometria,
  laduje,
  onKlik,
}: {
  srodekLat: number;
  srodekLng: number;
  boundaryGeojson?: unknown | null;
  geometria: GeoJsonGeometriiDzialki | null;
  laduje: boolean;
  onKlik: (lat: number, lng: number) => void;
}) {
  const [ref, setRef] = useState<HTMLDivElement | null>(null);
  const refMapa = useRef<import("leaflet").Map | null>(null);
  const refWarstwa = useRef<import("leaflet").LayerGroup | null>(null);
  const refOnKlik = useRef(onKlik);
  refOnKlik.current = onKlik;

  useEffect(() => {
    if (!ref) return;
    let cancelled = false;

    void (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !ref) return;

      const map = L.map(ref, { scrollWheelZoom: true });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OSM",
        maxZoom: 19,
      }).addTo(map);

      if (boundaryGeojson) {
        try {
          L.geoJSON(boundaryGeojson as GeoJSON.GeoJsonObject, {
            interactive: false,
            style: { color: "#166534", weight: 1, fillOpacity: 0.05, dashArray: "6 4" },
          }).addTo(map);
        } catch {
          /* ignore */
        }
      }

      const warstwa = L.layerGroup().addTo(map);
      refWarstwa.current = warstwa;
      refMapa.current = map;
      map.setView([srodekLat, srodekLng], 15);

      map.on("click", (e) => {
        if (laduje) return;
        refOnKlik.current(e.latlng.lat, e.latlng.lng);
      });

      setTimeout(() => map.invalidateSize(), 100);
    })();

    return () => {
      cancelled = true;
      refMapa.current?.remove();
      refMapa.current = null;
    };
  }, [ref, srodekLat, srodekLng, boundaryGeojson]);

  useEffect(() => {
    const warstwa = refWarstwa.current;
    const map = refMapa.current;
    if (!warstwa || !map) return;
    warstwa.clearLayers();
    if (!geometria) return;
    void (async () => {
      const L = (await import("leaflet")).default;
      const layer = L.geoJSON(geometria as GeoJSON.GeoJsonObject, {
        style: { color: "#047857", weight: 3, fillColor: "#10b981", fillOpacity: 0.35 },
      });
      layer.addTo(warstwa);
      try {
        map.fitBounds(layer.getBounds(), { padding: [20, 20], maxZoom: 17 });
      } catch {
        /* ignore */
      }
    })();
  }, [geometria]);

  return (
    <div className="relative">
      <div
        ref={setRef}
        className="h-[min(45vh,360px)] w-full overflow-hidden rounded-xl border border-emerald-200 shadow-inner"
        role="application"
        aria-label="Kliknij mapę, aby pobrać działkę z Geoportalu"
      />
      {laduje ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-white/60 text-sm font-medium text-emerald-900">
          Pobieram z Geoportalu…
        </div>
      ) : null}
    </div>
  );
}
