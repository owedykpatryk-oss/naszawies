"use client";

import type { GeoJsonObject } from "geojson";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { useEffect, useMemo, useRef } from "react";
import "./mapa-wsi-leaflet.css";

export type ZnacznikWsi = {
  id: string;
  name: string;
  sciezka: string;
  lat: number;
  lon: number;
  population: number | null;
  boundary_geojson: unknown | null;
  public_offers_count: number;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function granicaJakoGeoJson(raw: unknown): GeoJsonObject | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as { type?: string };
  if (o.type === "Polygon" || o.type === "MultiPolygon") return raw as GeoJsonObject;
  return null;
}

function htmlPopup(z: ZnacznikWsi, maGranice: boolean): string {
  const oferty = z.public_offers_count;
  const ofertyTxt =
    oferty === 0
      ? "Brak publicznych ofert na targu lokalnym."
      : `${oferty} publiczn${oferty === 1 ? "a oferta" : oferty < 5 ? "e oferty" : "ych ofert"} na targu lokalnym.`;
  const granicaTxt = maGranice
    ? "Granica sołectwa (GeoJSON w bazie)."
    : "Punkt lokalizacji — granicę sołectwa można dodać w danych wsi (import SHP/GeoJSON).";

  return `
    <div class="mapa-wsi-popup">
      <h3>${escapeHtml(z.name)}</h3>
      <p>${escapeHtml(granicaTxt)}</p>
      <p>${escapeHtml(ofertyTxt)} Inne ogłoszenia i aktualności — po wejściu na stronę wsi (dla mieszkańców).</p>
      <a href="${z.sciezka.replace(/"/g, "")}">Strona wsi →</a>
    </div>
  `;
}

export function MapaWsiLeaflet({ znaczniki }: { znaczniki: ZnacznikWsi[] }) {
  const refMapa = useRef<HTMLDivElement>(null);
  const instancja = useRef<{
    map: import("leaflet").Map;
    cluster: import("leaflet").Layer;
    resizeHandler: () => void;
  } | null>(null);

  const bboxPoczatkowy = useMemo((): [[number, number], [number, number]] | null => {
    if (znaczniki.length === 0) return null;
    let minLat = 90;
    let maxLat = -90;
    let minLon = 180;
    let maxLon = -180;
    for (const z of znaczniki) {
      minLat = Math.min(minLat, z.lat);
      maxLat = Math.max(maxLat, z.lat);
      minLon = Math.min(minLon, z.lon);
      maxLon = Math.max(maxLon, z.lon);
    }
    const pad = 0.12;
    return [
      [minLat - pad, minLon - pad],
      [maxLat + pad, maxLon + pad],
    ];
  }, [znaczniki]);

  useEffect(() => {
    const el = refMapa.current;
    if (!el || znaczniki.length === 0) return;

    let cancelled = false;

    void (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet.markercluster");

      if (cancelled || !refMapa.current) return;

      el.innerHTML = "";

      const map = L.map(el, {
        zoomControl: true,
        scrollWheelZoom: true,
        attributionControl: true,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);

      const ikonaHtml = `<div class="naszawies-marker-wrap" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 20V11L12 4L21 11V20H14V14H10V20H3Z" fill="#f5f1e8" stroke="#d4a017" stroke-width="1.2"/>
          <circle cx="12" cy="7" r="1.2" fill="#d4a017"/>
        </svg>
      </div>`;

      const ikona = L.divIcon({
        className: "naszawies-leaflet-divicon",
        html: ikonaHtml,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
        popupAnchor: [0, -20],
      });

      const cluster = L.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 56,
        spiderfyOnMaxZoom: true,
        disableClusteringAtZoom: 16,
      });

      const warstwyGranicy: import("leaflet").Layer[] = [];

      for (const z of znaczniki) {
        const gj = granicaJakoGeoJson(z.boundary_geojson);
        let maGranice = false;
        if (gj) {
          try {
            const warstwa = L.geoJSON(gj, {
              style: {
                color: "#2d5a2d",
                weight: 2,
                fillColor: "#5a9c3e",
                fillOpacity: 0.14,
                opacity: 0.95,
              },
            });
            warstwa.bindPopup(htmlPopup(z, true));
            warstwyGranicy.push(warstwa);
            maGranice = true;
          } catch {
            maGranice = false;
          }
        }

        const marker = L.marker([z.lat, z.lon], { icon: ikona, title: z.name });
        marker.bindPopup(htmlPopup(z, maGranice));
        cluster.addLayer(marker);
      }

      warstwyGranicy.forEach((w) => w.addTo(map));
      map.addLayer(cluster);

      if (bboxPoczatkowy) {
        map.fitBounds(bboxPoczatkowy, { padding: [28, 28], maxZoom: 12 });
      } else {
        map.setView([52.1, 19.3], 6);
      }

      const resizeHandler = () => {
        map.invalidateSize();
      };
      window.addEventListener("resize", resizeHandler);
      setTimeout(resizeHandler, 120);

      instancja.current = { map, cluster, resizeHandler };
    })();

    return () => {
      cancelled = true;
      const inst = instancja.current;
      if (inst) {
        window.removeEventListener("resize", inst.resizeHandler);
        inst.map.remove();
        instancja.current = null;
      }
      el.innerHTML = "";
    };
  }, [znaczniki, bboxPoczatkowy]);

  return (
    <div
      ref={refMapa}
      className="z-0 h-[min(72dvh,560px)] w-full min-h-[320px] rounded-xl border border-stone-200/80 bg-stone-100 shadow-inner md:h-[min(78dvh,640px)]"
      role="application"
      aria-label="Mapa interaktywna — wsie naszawies.pl"
    />
  );
}
