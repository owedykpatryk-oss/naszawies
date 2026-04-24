"use client";

import type { GeoJsonObject } from "geojson";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import "./mapa-wsi-leaflet.css";
import "./mapa-wow.css";

/** Typ modułu Leaflet (bez `default` — tak są @types). Runtime ładowany dynamicznie. */
type LeafletNs = typeof import("leaflet");

export type ZnacznikWsi = {
  id: string;
  name: string;
  sciezka: string;
  lat: number;
  lon: number;
  population: number | null;
  boundary_geojson: unknown | null;
  public_offers_count: number;
  /** Do wyszukiwarki na mapie i opisu na liście */
  commune?: string;
  county?: string;
  voivodeship?: string;
  teryt_id?: string;
};

export type MapaWsiLeafletRef = {
  /** Przybliża mapę i otwiera popup dla wsi o podanym `id`. */
  pokazNaMapie: (idWsi: string) => boolean;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function granicaJakoGeoJson(raw: unknown): GeoJsonObject | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return null;
    try {
      return granicaJakoGeoJson(JSON.parse(t) as unknown);
    } catch {
      return null;
    }
  }
  if (typeof raw !== "object") return null;
  const o = raw as { type?: string; features?: unknown[] };
  if (o.type === "FeatureCollection" && Array.isArray(o.features) && o.features.length === 0) {
    return null;
  }
  if (
    o.type === "Polygon" ||
    o.type === "MultiPolygon" ||
    o.type === "Feature" ||
    o.type === "FeatureCollection"
  ) {
    return raw as GeoJsonObject;
  }
  return null;
}

function lokalizacjaPopup(z: ZnacznikWsi): string {
  const czesci = [z.commune, z.county, z.voivodeship].filter(Boolean);
  const opis = czesci.length ? czesci.join(" · ") : "";
  const simc = z.teryt_id ? `TERYT / SIMC: ${z.teryt_id}` : "";
  if (opis && simc) return `${opis} · ${simc}`;
  if (opis) return opis;
  if (simc) return simc;
  return "";
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
  const meta = lokalizacjaPopup(z);

  return `
    <div class="mapa-wsi-popup">
      <h3>${escapeHtml(z.name)}</h3>
      ${meta ? `<p class="mapa-wsi-popup-meta">${escapeHtml(meta)}</p>` : ""}
      <p>${escapeHtml(granicaTxt)}</p>
      <p>${escapeHtml(ofertyTxt)} Inne ogłoszenia i aktualności — po wejściu na stronę wsi (dla mieszkańców).</p>
      <a href="${z.sciezka.replace(/"/g, "")}">Strona wsi →</a>
    </div>
  `;
}

function bboxDlaZnacznikow(znaczniki: ZnacznikWsi[]): [[number, number], [number, number]] | null {
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
}

type InstancjaLeaflet = {
  map: import("leaflet").Map;
  cluster: import("leaflet").Layer;
  boundaryGroup: import("leaflet").LayerGroup;
  markersById: Map<string, import("leaflet").Marker>;
  resizeHandler: () => void;
  wheelHandlers: { enter: () => void; leave: () => void };
};

function zbudujIkone(L: LeafletNs) {
  const ikonaHtml = `<div class="naszawies-marker-wrap" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 20V11L12 4L21 11V20H14V14H10V20H3Z" fill="#f5f1e8" stroke="#d4a017" stroke-width="1.2"/>
          <circle cx="12" cy="7" r="1.2" fill="#d4a017"/>
        </svg>
      </div>`;
  return L.divIcon({
    className: "naszawies-leaflet-divicon",
    html: ikonaHtml,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20],
  });
}

export const MapaWsiLeaflet = forwardRef<MapaWsiLeafletRef, { znaczniki: ZnacznikWsi[] }>(
  function MapaWsiLeaflet({ znaczniki }, ref) {
    const refMapa = useRef<HTMLDivElement>(null);
    const instancja = useRef<InstancjaLeaflet | null>(null);
    const leafletRef = useRef<LeafletNs | null>(null);
    const znacznikiRef = useRef(znaczniki);
    znacznikiRef.current = znaczniki;

    const bboxPoczatkowy = useMemo(() => bboxDlaZnacznikow(znaczniki), [znaczniki]);

    useImperativeHandle(ref, () => ({
      pokazNaMapie(idWsi: string) {
        const inst = instancja.current;
        if (!inst) return false;
        const marker = inst.markersById.get(idWsi);
        if (!marker) return false;
        const cluster = inst.cluster as import("leaflet").MarkerClusterGroup;
        if (typeof cluster.zoomToShowLayer === "function") {
          cluster.zoomToShowLayer(marker, () => {
            marker.openPopup();
          });
        } else {
          inst.map.setView(marker.getLatLng(), Math.max(inst.map.getZoom(), 14));
          marker.openPopup();
        }
        return true;
      },
    }));

    // Jednorazowa inicjalizacja mapy
    useEffect(() => {
      const el = refMapa.current;
      if (!el) return;

      let cancelled = false;

      void (async () => {
        const L = (await import("leaflet")).default as unknown as LeafletNs;
        await import("leaflet.markercluster");

        if (cancelled || !refMapa.current) return;

        const map = L.map(el, {
          zoomControl: true,
          scrollWheelZoom: false,
          attributionControl: true,
        });

        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }).addTo(map);

        leafletRef.current = L;
        const ikona = zbudujIkone(L);

        const cluster = L.markerClusterGroup({
          showCoverageOnHover: false,
          maxClusterRadius: 56,
          spiderfyOnMaxZoom: true,
          disableClusteringAtZoom: 16,
        });

        const boundaryGroup = L.layerGroup().addTo(map);
        map.addLayer(cluster);

        const container = map.getContainer();
        const enter = () => {
          map.scrollWheelZoom.enable();
        };
        const leave = () => {
          map.scrollWheelZoom.disable();
        };
        container.addEventListener("mouseenter", enter);
        container.addEventListener("mouseleave", leave);

        const resizeHandler = () => {
          map.invalidateSize();
        };
        window.addEventListener("resize", resizeHandler);
        setTimeout(resizeHandler, 120);

        instancja.current = {
          map,
          cluster,
          boundaryGroup,
          markersById: new Map(),
          resizeHandler,
          wheelHandlers: { enter, leave },
        };

        const z0 = znacznikiRef.current;
        const bb0 = bboxDlaZnacznikow(z0);
        syncWarstwy(L, instancja.current, z0, ikona, bb0);
      })();

      return () => {
        cancelled = true;
        const inst = instancja.current;
        if (inst) {
          window.removeEventListener("resize", inst.resizeHandler);
          const c = inst.map.getContainer();
          c.removeEventListener("mouseenter", inst.wheelHandlers.enter);
          c.removeEventListener("mouseleave", inst.wheelHandlers.leave);
          inst.map.remove();
          instancja.current = null;
        }
        leafletRef.current = null;
        el.innerHTML = "";
      };
    }, []);

    // Aktualizacja znaczników bez niszczenia mapy
    useEffect(() => {
      const inst = instancja.current;
      const L = leafletRef.current;
      if (!inst || !L || znaczniki.length === 0) return;
      const ikona = zbudujIkone(L);
      syncWarstwy(L, inst, znaczniki, ikona, bboxPoczatkowy);
    }, [znaczniki, bboxPoczatkowy]);

    return (
      <div className="mapa-wsi-map-shell relative h-[min(72dvh,560px)] w-full min-h-[320px] md:h-[min(78dvh,640px)]">
        <div
          ref={refMapa}
          className="z-0 h-full w-full rounded-xl border border-stone-200/80 bg-stone-100 shadow-inner ring-1 ring-green-950/5 transition-shadow duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700/40"
          role="application"
          aria-label="Mapa interaktywna — wsie naszawies.pl"
          tabIndex={0}
        />
        <div
          className="mapa-wsi-legenda-wow pointer-events-none absolute left-3 top-3 z-[400] max-w-[min(100%,240px)] rounded-xl border border-stone-200/80 bg-white/90 px-3 py-2.5 text-[11px] leading-snug text-stone-700 shadow-lg shadow-green-950/5 backdrop-blur-md"
          aria-hidden="true"
        >
          <p className="font-semibold text-stone-800">Legenda</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-stone-600">
            <li>
              <span className="font-medium text-[#2d5a2d]">Zielony obrys</span> — granica sołectwa
            </li>
            <li>
              <span className="font-medium text-[#5a9c3e]">Pinezka</span> — punkt GPS wsi
            </li>
            <li>
              <span className="font-medium text-stone-800">Kółko z liczbą</span> — kilka wsi w obszarze
            </li>
          </ul>
        </div>
        <p className="mapa-wsi-podpowiedz-wow pointer-events-none absolute bottom-2 left-1/2 z-[400] w-[min(100%,340px)] -translate-x-1/2 rounded-lg border border-green-900/10 bg-gradient-to-r from-white/95 via-emerald-50/90 to-white/95 px-3 py-1.5 text-center text-[10px] font-medium text-stone-600 shadow-md backdrop-blur-sm">
          Zoom kółkiem działa, gdy kursor jest nad mapą — nie przewijasz wtedy strony.
        </p>
      </div>
    );
  },
);

function syncWarstwy(
  L: LeafletNs,
  inst: InstancjaLeaflet,
  znaczniki: ZnacznikWsi[],
  ikona: import("leaflet").DivIcon,
  bbox: [[number, number], [number, number]] | null,
) {
  const { map, cluster, boundaryGroup, markersById } = inst;

  (cluster as import("leaflet").LayerGroup).clearLayers();
  boundaryGroup.clearLayers();
  markersById.clear();

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
        boundaryGroup.addLayer(warstwa);
        maGranice = true;
      } catch {
        maGranice = false;
      }
    }

    const marker = L.marker([z.lat, z.lon], { icon: ikona, title: z.name });
    marker.bindPopup(htmlPopup(z, maGranice));
    (cluster as import("leaflet").LayerGroup).addLayer(marker);
    markersById.set(z.id, marker);
  }

  if (bbox) {
    map.fitBounds(bbox, { padding: [28, 28], maxZoom: 12, animate: false });
  } else {
    map.setView([52.1, 19.3], 6);
  }

  setTimeout(() => map.invalidateSize(), 80);
}
