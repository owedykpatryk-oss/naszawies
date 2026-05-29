"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

type Props = {
  lat: number;
  lng: number;
  punktOdniesienia?: { lat: number; lng: number } | null;
  wysokosc?: number;
};

/** Kompaktowa mapa z jednym punktem (np. podgląd GPS z telefonu). */
export function MiniMapaPunktuKlient({ lat, lng, punktOdniesienia, wysokosc = 148 }: Props) {
  const [ref, setRef] = useState<HTMLDivElement | null>(null);
  const refMapa = useRef<import("leaflet").Map | null>(null);

  useEffect(() => {
    if (!ref || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
    let cancelled = false;

    void (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled) return;

      const map = L.map(ref, { zoomControl: false, scrollWheelZoom: false, attributionControl: true });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OSM",
        maxZoom: 19,
      }).addTo(map);

      L.circleMarker([lat, lng], {
        radius: 9,
        color: "#14532d",
        weight: 2,
        fillColor: "#22c55e",
        fillOpacity: 0.9,
      }).addTo(map);

      if (
        punktOdniesienia &&
        Number.isFinite(punktOdniesienia.lat) &&
        Number.isFinite(punktOdniesienia.lng)
      ) {
        L.circleMarker([punktOdniesienia.lat, punktOdniesienia.lng], {
          radius: 7,
          color: "#1d4ed8",
          weight: 2,
          fillColor: "#93c5fd",
          fillOpacity: 0.85,
        }).addTo(map);
        const bounds = L.latLngBounds([
          [lat, lng],
          [punktOdniesienia.lat, punktOdniesienia.lng],
        ]);
        map.fitBounds(bounds.pad(0.35), { maxZoom: 15 });
      } else {
        map.setView([lat, lng], 15);
      }

      refMapa.current = map;
      setTimeout(() => map.invalidateSize(), 80);
    })();

    return () => {
      cancelled = true;
      refMapa.current?.remove();
      refMapa.current = null;
    };
  }, [ref, lat, lng, punktOdniesienia?.lat, punktOdniesienia?.lng]);

  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
      <div
        ref={setRef}
        style={{ height: wysokosc }}
        className="w-full"
        role="img"
        aria-label={`Podgląd mapy: ${lat.toFixed(5)}, ${lng.toFixed(5)}`}
      />
      <p className="border-t border-stone-100 px-2 py-1.5 text-[10px] text-stone-500">
        <span className="inline-block h-2 w-2 rounded-full bg-green-600 align-middle" /> Twój punkt
        {punktOdniesienia ? (
          <>
            {" "}
            · <span className="inline-block h-2 w-2 rounded-full bg-blue-400 align-middle" /> Środek wsi
          </>
        ) : null}
      </p>
    </div>
  );
}
