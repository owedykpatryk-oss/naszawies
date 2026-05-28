"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import {
  lokalnePunktyZPolygonu,
  polygonZGranicyWsi,
  polygonZLokalnychPunktow,
  prostokatZLokalnychPunktow,
  type GeoJsonPolygonPolowania,
  type PunktLokalny,
} from "@/lib/lowiectwo/geojson-obszar";

type TrybRysowania = "wielokat" | "prostokat";

type LeafletNs = typeof import("leaflet");

type Props = {
  srodekLat: number;
  srodekLng: number;
  boundaryGeojson?: unknown | null;
  value: GeoJsonPolygonPolowania | null;
  onChange: (geo: GeoJsonPolygonPolowania | null) => void;
};

export function EdytorObszaruPolowania({ srodekLat, srodekLng, boundaryGeojson, value, onChange }: Props) {
  const refEl = useRef<HTMLDivElement>(null);
  const refMapa = useRef<import("leaflet").Map | null>(null);
  const refL = useRef<LeafletNs | null>(null);
  const refWarstwa = useRef<import("leaflet").LayerGroup | null>(null);
  const refGranica = useRef<import("leaflet").LayerGroup | null>(null);
  const [punkty, ustawPunkty] = useState<PunktLokalny[]>(() => lokalnePunktyZPolygonu(value));
  const [gotowe, ustawGotowe] = useState(() => value != null);
  const [tryb, ustawTryb] = useState<TrybRysowania>("prostokat");
  const refPunkty = useRef(punkty);
  refPunkty.current = punkty;
  const refGotowe = useRef(gotowe);
  const refTryb = useRef(tryb);
  const refProstokatStart = useRef<PunktLokalny | null>(null);
  refGotowe.current = gotowe;
  refTryb.current = tryb;

  const odswiezRysunek = useCallback((lista: PunktLokalny[], zamkniete: boolean) => {
    const L = refL.current;
    const warstwa = refWarstwa.current;
    if (!L || !warstwa) return;
    warstwa.clearLayers();
    for (let i = 0; i < lista.length; i++) {
      const p = lista[i]!;
      L.circleMarker([p.lat, p.lng], {
        radius: 7,
        color: "#7f1d1d",
        weight: 2,
        fillColor: "#dc2626",
        fillOpacity: 0.9,
      }).addTo(warstwa);
      if (i > 0) {
        const prev = lista[i - 1]!;
        L.polyline(
          [
            [prev.lat, prev.lng],
            [p.lat, p.lng],
          ],
          { color: "#b91c1c", weight: 3, dashArray: zamkniete ? undefined : "6 4" },
        ).addTo(warstwa);
      }
    }
    if (zamkniete && lista.length >= 3) {
      const poly = polygonZLokalnychPunktow(lista);
      if (poly) {
        L.geoJSON(poly, {
          style: { color: "#991b1b", weight: 3, fillColor: "#dc2626", fillOpacity: 0.35 },
        }).addTo(warstwa);
      }
    } else if (lista.length >= 2) {
      const first = lista[0]!;
      const last = lista[lista.length - 1]!;
      L.polyline(
        [
          [last.lat, last.lng],
          [first.lat, first.lng],
        ],
        { color: "#b91c1c", weight: 2, dashArray: "4 8", opacity: 0.5 },
      ).addTo(warstwa);
    }
  }, []);

  const zastosujObszar = useCallback(
    (lista: PunktLokalny[]) => {
      const poly = polygonZLokalnychPunktow(lista);
      if (!poly) return;
      onChange(poly);
      ustawPunkty(lista);
      ustawGotowe(true);
      refProstokatStart.current = null;
      odswiezRysunek(lista, true);
    },
    [onChange, odswiezRysunek],
  );

  const zamknijObszar = useCallback(() => {
    zastosujObszar(refPunkty.current);
  }, [zastosujObszar]);

  const refAkcje = useRef({ zamknijObszar, zastosujObszar });
  refAkcje.current = { zamknijObszar, zastosujObszar };

  useEffect(() => {
    const el = refEl.current;
    if (!el) return;
    let cancelled = false;

    void (async () => {
      const L = (await import("leaflet")).default as unknown as LeafletNs;
      if (cancelled || !refEl.current) return;
      refL.current = L;

      const map = L.map(el, { zoomControl: true, scrollWheelZoom: true, attributionControl: true });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OSM &copy; CARTO",
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);

      const granica = L.layerGroup().addTo(map);
      refGranica.current = granica;
      if (boundaryGeojson) {
        try {
          L.geoJSON(boundaryGeojson as GeoJSON.GeoJsonObject, {
            interactive: false,
            style: {
              color: "#1a4d28",
              weight: 2,
              fillColor: "#3d7a2e",
              fillOpacity: 0.08,
              dashArray: "8 6",
            },
          }).addTo(granica);
        } catch {
          /* ignore */
        }
      }

      const warstwa = L.layerGroup().addTo(map);
      refWarstwa.current = warstwa;
      refMapa.current = map;
      map.setView([srodekLat, srodekLng], boundaryGeojson ? 13 : 14);

      map.on("click", (e: import("leaflet").LeafletMouseEvent) => {
        if (refGotowe.current) return;
        const punkt = { lat: e.latlng.lat, lng: e.latlng.lng };

        if (refTryb.current === "prostokat") {
          const start = refProstokatStart.current;
          if (!start) {
            refProstokatStart.current = punkt;
            ustawPunkty([punkt]);
            odswiezRysunek([punkt], false);
            return;
          }
          const poly = prostokatZLokalnychPunktow(start, punkt);
          if (poly) {
            const lista = lokalnePunktyZPolygonu(poly);
            refAkcje.current.zastosujObszar(lista);
          }
          return;
        }

        ustawPunkty((prev) => {
          const next = [...prev, punkt];
          odswiezRysunek(next, false);
          return next;
        });
      });

      map.on("dblclick", (e: import("leaflet").LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        if (refGotowe.current || refTryb.current !== "wielokat") return;
        refAkcje.current.zamknijObszar();
      });

      setTimeout(() => map.invalidateSize(), 120);
    })();

    return () => {
      cancelled = true;
      refMapa.current?.remove();
      refMapa.current = null;
      refL.current = null;
      refWarstwa.current = null;
      refGranica.current = null;
    };
  }, [srodekLat, srodekLng, boundaryGeojson, odswiezRysunek]);

  useEffect(() => {
    odswiezRysunek(punkty, gotowe);
  }, [punkty, gotowe, odswiezRysunek]);

  function wyczysc() {
    ustawPunkty([]);
    ustawGotowe(false);
    refProstokatStart.current = null;
    onChange(null);
    odswiezRysunek([], false);
  }

  function cofnij() {
    if (gotowe) {
      ustawGotowe(false);
      onChange(null);
    }
    refProstokatStart.current = null;
    ustawPunkty((prev) => {
      const next = prev.slice(0, -1);
      odswiezRysunek(next, false);
      return next;
    });
  }

  function uzyjGranicyWsi() {
    const poly = polygonZGranicyWsi(boundaryGeojson);
    if (!poly) return;
    const lista = lokalnePunktyZPolygonu(poly);
    zastosujObszar(lista);
    const map = refMapa.current;
    if (map && lista.length > 0) {
      const bounds = lista.reduce(
        (b, p) => b.extend([p.lat, p.lng]),
        refL.current!.latLngBounds([lista[0]!.lat, lista[0]!.lng], [lista[0]!.lat, lista[0]!.lng]),
      );
      map.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 });
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`rounded-full px-3 py-1 text-xs font-medium ${tryb === "prostokat" ? "bg-red-900 text-white" : "border border-stone-300 bg-white text-stone-700"}`}
          onClick={() => {
            ustawTryb("prostokat");
            wyczysc();
          }}
        >
          Prostokąt (2 kliknięcia)
        </button>
        <button
          type="button"
          className={`rounded-full px-3 py-1 text-xs font-medium ${tryb === "wielokat" ? "bg-red-900 text-white" : "border border-stone-300 bg-white text-stone-700"}`}
          onClick={() => {
            ustawTryb("wielokat");
            wyczysc();
          }}
        >
          Wielokąt (narożniki)
        </button>
        {boundaryGeojson ? (
          <button type="button" className="rounded-full border border-emerald-700/40 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-950" onClick={uzyjGranicyWsi}>
            Cała wieś (obrys PRG)
          </button>
        ) : null}
      </div>
      <p className="text-sm text-stone-600">
        {tryb === "prostokat"
          ? "Kliknij dwa przeciwległe narożniki prostokąta."
          : "Kliknij narożniki (min. 3) lub dwukrotnie, by zamknąć obszar."}
      </p>
      <div
        ref={refEl}
        className="h-[min(52vh,420px)] w-full overflow-hidden rounded-xl border border-stone-300/90 shadow-inner ring-1 ring-stone-900/5"
        role="application"
        aria-label="Mapa — zaznacz obszar polowania"
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-panel-secondary text-sm" onClick={cofnij} disabled={punkty.length === 0}>
          Cofnij
        </button>
        {tryb === "wielokat" ? (
          <button type="button" className="btn-panel-primary text-sm" onClick={zamknijObszar} disabled={punkty.length < 3 || gotowe}>
            Zamknij obszar
          </button>
        ) : null}
        <button type="button" className="btn-panel-secondary text-sm" onClick={wyczysc} disabled={punkty.length === 0 && !gotowe}>
          Wyczyść
        </button>
      </div>
      {gotowe ? (
        <p className="text-sm text-green-900">Obszar gotowy — pojawi się na mapie publicznej w terminie ostrzeżenia.</p>
      ) : tryb === "wielokat" && punkty.length > 0 ? (
        <p className="text-xs text-stone-500">
          Punkty: {punkty.length}. {punkty.length < 3 ? `Jeszcze ${3 - punkty.length}.` : "Dwuklik lub „Zamknij obszar”."}
        </p>
      ) : null}
    </div>
  );
}
