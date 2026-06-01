"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RekordGrobuPubliczny } from "@/lib/cmentarz/pobierz-cmentarz-publiczny";
import "leaflet/dist/leaflet.css";

type Props = {
  groby: RekordGrobuPubliczny[];
  podswietlId?: string | null;
  onGrobClick?: (graveId: string) => void;
  wysokosc?: number;
};

/** Mini-mapa grobów z georeferencją (publiczny plan cmentarza). */
export function CmentarzGrobyMapaKlient({ groby, podswietlId, onGrobClick, wysokosc = 220 }: Props) {
  const [ref, setRef] = useState<HTMLDivElement | null>(null);
  const refMapa = useRef<import("leaflet").Map | null>(null);
  const refWarstwa = useRef<import("leaflet").LayerGroup | null>(null);

  const grobyGps = useMemo(
    () =>
      groby.filter(
        (g) => g.latitude != null && g.longitude != null && Number.isFinite(Number(g.latitude)) && Number.isFinite(Number(g.longitude)),
      ),
    [groby],
  );

  useEffect(() => {
    if (!ref || grobyGps.length === 0) return;
    let cancelled = false;

    void (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled) return;

      if (!refMapa.current) {
        const map = L.map(ref, { zoomControl: true, scrollWheelZoom: false, attributionControl: true });
        L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
          attribution: "Esri",
          maxZoom: 19,
        }).addTo(map);
        refMapa.current = map;
        refWarstwa.current = L.layerGroup().addTo(map);
      }

      const map = refMapa.current;
      const warstwa = refWarstwa.current!;
      warstwa.clearLayers();

      const punkty: [number, number][] = [];
      for (const g of grobyGps) {
        const lat = Number(g.latitude);
        const lng = Number(g.longitude);
        punkty.push([lat, lng]);
        const aktywny = podswietlId === g.id;
        const marker = L.circleMarker([lat, lng], {
          radius: aktywny ? 10 : 6,
          color: aktywny ? "#b45309" : "#57534e",
          weight: aktywny ? 3 : 1.5,
          fillColor: aktywny ? "#fbbf24" : "#a8a29e",
          fillOpacity: 0.9,
        });
        marker.bindTooltip(`${g.nazwisko}${g.imie ? `, ${g.imie}` : ""}`, { direction: "top" });
        marker.on("click", () => onGrobClick?.(g.id));
        marker.addTo(warstwa);
      }

      if (punkty.length === 1) {
        map.setView(punkty[0]!, 18);
      } else {
        map.fitBounds(L.latLngBounds(punkty).pad(0.15), { maxZoom: 19 });
      }
      setTimeout(() => map.invalidateSize(), 80);
    })();

    return () => {
      cancelled = true;
    };
  }, [ref, grobyGps, podswietlId, onGrobClick]);

  useEffect(() => {
    return () => {
      refMapa.current?.remove();
      refMapa.current = null;
      refWarstwa.current = null;
    };
  }, []);

  if (grobyGps.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-stone-300 bg-white shadow-sm print:hidden">
      <div
        ref={setRef}
        style={{ height: wysokosc }}
        className="w-full"
        role="img"
        aria-label={`Mapa grobów z GPS (${grobyGps.length})`}
      />
      <p className="border-t border-stone-100 px-3 py-2 text-[11px] text-stone-600">
        Groby z georeferencją ({grobyGps.length}) — kliknij pinezkę, aby zobaczyć szczegóły.
      </p>
    </div>
  );
}
