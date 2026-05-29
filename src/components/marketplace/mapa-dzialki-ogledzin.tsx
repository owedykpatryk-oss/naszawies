"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { GeoJsonGeometriiDzialki } from "@/lib/geoportal/wkt-do-geojson";
import { formatujAreDzialki, formatujPowierzchnieDzialki } from "@/lib/marketplace/nieruchomosci";

type Props = {
  geometria: GeoJsonGeometriiDzialki | null;
  srodekLat?: number | null;
  srodekLng?: number | null;
  numerDzialki?: string | null;
  obreb?: string | null;
  powierzchniaM2?: number | null;
  wysokosc?: "kompakt" | "pelna";
};

export function MapaDzialkiOgledzin({
  geometria,
  srodekLat,
  srodekLng,
  numerDzialki,
  obreb,
  powierzchniaM2,
  wysokosc = "kompakt",
}: Props) {
  const [ref, setRef] = useState<HTMLDivElement | null>(null);
  const refMapa = useRef<import("leaflet").Map | null>(null);

  const h = wysokosc === "pelna" ? "min(70vh,560px)" : "min(42vh,380px)";

  useEffect(() => {
    if (!ref || !geometria) return;
    let cancelled = false;

    void (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled) return;

      const map = L.map(ref, { scrollWheelZoom: true, zoomControl: true });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OSM · granica ULDK",
        maxZoom: 19,
      }).addTo(map);

      const layer = L.geoJSON(geometria as GeoJSON.GeoJsonObject, {
        style: {
          color: "#047857",
          weight: 3,
          fillColor: "#34d399",
          fillOpacity: 0.4,
        },
      }).addTo(map);

      try {
        map.fitBounds(layer.getBounds(), { padding: [28, 28], maxZoom: 17 });
      } catch {
        if (srodekLat != null && srodekLng != null) {
          map.setView([srodekLat, srodekLng], 16);
        }
      }

      refMapa.current = map;
      setTimeout(() => map.invalidateSize(), 120);
    })();

    return () => {
      cancelled = true;
      refMapa.current?.remove();
      refMapa.current = null;
    };
  }, [ref, geometria, srodekLat, srodekLng]);

  if (!geometria) {
    if (srodekLat != null && srodekLng != null) {
      return (
        <p className="text-sm text-stone-600">
          Lokalizacja przybliżona:{" "}
          <a
            href={`https://www.openstreetmap.org/?mlat=${srodekLat}&mlon=${srodekLng}#map=16/${srodekLat}/${srodekLng}`}
            className="text-green-800 underline"
            target="_blank"
            rel="noreferrer"
          >
            zobacz na mapie OSM
          </a>
        </p>
      );
    }
    return null;
  }

  const pow = formatujPowierzchnieDzialki(powierzchniaM2);
  const ar = formatujAreDzialki(powierzchniaM2);

  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-200/90 bg-white shadow-sm ring-1 ring-emerald-900/5">
      {(numerDzialki || obreb || pow) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 border-b border-emerald-100 bg-emerald-50/50 px-4 py-2.5 text-sm text-emerald-950">
          {numerDzialki ? (
            <span>
              Działka <strong>{numerDzialki}</strong>
            </span>
          ) : null}
          {obreb ? <span>Obręb: {obreb}</span> : null}
          {pow ? <span>{pow}</span> : null}
          {ar && (powierzchniaM2 ?? 0) < 10_000 ? <span className="text-emerald-800/80">({ar})</span> : null}
        </div>
      )}
      <div ref={setRef} style={{ height: h }} className="w-full" role="img" aria-label="Mapa granicy działki" />
      <p className="border-t border-emerald-50 px-4 py-2 text-[11px] text-stone-500">
        Granica z usługi ULDK GUGiK — charakter informacyjny. Źródło: Geoportal.
      </p>
    </div>
  );
}
