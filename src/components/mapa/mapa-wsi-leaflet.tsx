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
  useState,
} from "react";
import { etykietaKategoriiPoi, emojiKategoriiPoi, kolorObramowaniaPoi } from "@/lib/mapa/kategorie-poi";
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

/** Punkt z tabeli `pois` (kościół, szkoła, świetlica, sołtys…) — publiczne na mapie. */
export type ZnacznikPoi = {
  id: string;
  villageId: string;
  villageName: string;
  sciezkaWsi: string;
  category: string;
  name: string;
  description: string | null;
  lat: number;
  lon: number;
  ospWaterSourceType?: string | null;
  ospWaterCapacityLpm?: number | null;
  ospWinterAccess?: boolean | null;
  ospHeavyTruckAccess?: boolean | null;
  ospNote?: string | null;
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
  return czesci.length ? czesci.join(" · ") : "";
}

type WariantGranicyWPopup = "geojson" | "pozor" | "punkt";

const PANE_GRANICE = "naszawiesGranice";

/** Kiedy w bazie nie ma `boundary_geojson` — okrąg ~zasięg, żeby było widać coś więcej niż samą pinezkę (nie jest to urzędowa granica). */
function promienPrzyblizonyMetrow(z: ZnacznikWsi): number {
  const p = z.population;
  if (p != null && p > 0) {
    return Math.min(4500, Math.max(700, 350 + Math.sqrt(p) * 45));
  }
  return 1400;
}

function ustawPaneWarstwicyGranicy(map: import("leaflet").Map) {
  if (map.getPane(PANE_GRANICE)) return;
  const pane = map.createPane(PANE_GRANICE);
  pane.style.zIndex = "450";
}

function htmlPopup(z: ZnacznikWsi, wariant: WariantGranicyWPopup): string {
  const oferty = z.public_offers_count;
  const ofertyTxt =
    oferty === 0
      ? "Brak publicznych ofert na targu lokalnym."
      : `${oferty} publiczn${oferty === 1 ? "a oferta" : oferty < 5 ? "e oferty" : "ych ofert"} na targu lokalnym.`;
  const granicaTxt =
    wariant === "geojson"
      ? "Granica sołectwa (dane w bazie jako rysunek wielokątny, WGS84)."
      : wariant === "pozor"
        ? "Przerywany obrys: przybliżenie terytorium (brak oficjalnej polilinii w bazie). Prawdziwą granicę można wgrać w GeoJSON m.in. z PRG / otwartych danych."
        : "Lokalizacja: punkt GPS; brak wgranego obrysu wsi.";
  const meta = lokalizacjaPopup(z);

  const osm = `https://www.openstreetmap.org/?mlat=${encodeURIComponent(String(z.lat))}&mlon=${encodeURIComponent(String(z.lon))}&zoom=15`;
  return `
    <div class="mapa-wsi-popup">
      <h3>${escapeHtml(z.name)}</h3>
      ${meta ? `<p class="mapa-wsi-popup-meta">${escapeHtml(meta)}</p>` : ""}
      <p>${escapeHtml(granicaTxt)}</p>
      <p>${escapeHtml(ofertyTxt)} Inne ogłoszenia i aktualności — po wejściu na stronę wsi (dla mieszkańców).</p>
      <p class="mapa-wsi-popup-foot">
        <a href="${z.sciezka.replace(/"/g, "")}">Strona wsi →</a>
        <span aria-hidden="true"> · </span>
        <a href="${osm}" target="_blank" rel="noopener noreferrer">Okolica w OSM ↗</a>
      </p>
    </div>
  `;
}

function bboxDlaPunktowMapy(
  znaczniki: ZnacznikWsi[],
  pois: ZnacznikPoi[],
): [[number, number], [number, number]] | null {
  if (znaczniki.length === 0 && pois.length === 0) return null;
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
  for (const p of pois) {
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
    minLon = Math.min(minLon, p.lon);
    maxLon = Math.max(maxLon, p.lon);
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
  baseTileLayer: import("leaflet").TileLayer;
  geoportalWmsLayer: import("leaflet").TileLayer.WMS | null;
  markersById: Map<string, import("leaflet").Marker>;
  resizeHandler: () => void;
  wheelHandlers: { enter: () => void; leave: () => void };
};

const GEO_WMS_URL = process.env.NEXT_PUBLIC_GEOPORTAL_WMS_URL?.trim() ?? "";
const GEO_WMS_LAYERS = process.env.NEXT_PUBLIC_GEOPORTAL_WMS_LAYERS?.trim() ?? "";
const CZY_GEO_WMS_DOSTEPNY = GEO_WMS_URL.length > 0 && GEO_WMS_LAYERS.length > 0;

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

function zbudujIkonePoi(L: LeafletNs, z: ZnacznikPoi) {
  const emoji = emojiKategoriiPoi(z.category);
  const kolor = kolorObramowaniaPoi(z.category);
  const html = `<div class="naszawies-marker-poi-inner" style="border-color:${kolor}">${escapeHtml(emoji)}</div>`;
  return L.divIcon({
    className: "naszawies-leaflet-divicon",
    html,
    iconSize: [36, 36],
    iconAnchor: [18, 20],
    popupAnchor: [0, -20],
  });
}

function htmlPopupPoi(z: ZnacznikPoi): string {
  const kat = etykietaKategoriiPoi(z.category);
  const opis = z.description?.trim();
  const osm = `https://www.openstreetmap.org/?mlat=${encodeURIComponent(String(z.lat))}&mlon=${encodeURIComponent(String(z.lon))}&zoom=17`;
  const czyStacja = z.category.trim().toLowerCase() === "stacja_kolejowa";
  const czyOspWoda = z.category.trim().toLowerCase() === "osp_punkt_czerpania_wody";
  const stacjaLink = `/transport/rozklad?stacja=${encodeURIComponent(z.name)}`;
  const typZrodlaMap: Record<string, string> = {
    hydrant: "Hydrant",
    staw: "Staw",
    zbiornik: "Zbiornik",
    rzeka: "Rzeka / ciek",
    inne: "Inne",
  };
  const typZrodla = z.ospWaterSourceType ? (typZrodlaMap[z.ospWaterSourceType] ?? z.ospWaterSourceType) : null;
  const zglosAktualizacjeLink = `/panel/mieszkaniec/zgloszenia?category=woda&villageId=${encodeURIComponent(z.villageId)}&title=${encodeURIComponent(`Aktualizacja punktu OSP: ${z.name}`)}&location=${encodeURIComponent(`${z.villageName}: ${z.name}`)}`;
  return `
    <div class="mapa-wsi-popup">
      <p class="mapa-wsi-popup-meta">${escapeHtml(kat)}${z.villageName ? ` · ${escapeHtml(z.villageName)}` : ""}</p>
      <h3>${escapeHtml(z.name)}</h3>
      ${opis ? `<p>${escapeHtml(opis)}</p>` : ""}
      ${
        czyOspWoda
          ? `<p>${
              [
                typZrodla ? `Typ: ${escapeHtml(typZrodla)}` : null,
                z.ospWaterCapacityLpm != null ? `Wydajność: ${escapeHtml(String(z.ospWaterCapacityLpm))} l/min` : null,
                z.ospWinterAccess != null ? `Dostęp zimą: ${z.ospWinterAccess ? "tak" : "nie/ograniczony"}` : null,
                z.ospHeavyTruckAccess != null
                  ? `Dojazd ciężkim wozem: ${z.ospHeavyTruckAccess ? "tak" : "nie/utrudniony"}`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")
            }</p>${z.ospNote ? `<p>${escapeHtml(z.ospNote)}</p>` : ""}`
          : ""
      }
      <p class="mapa-wsi-popup-foot">
        <a href="${z.sciezkaWsi.replace(/"/g, "")}">Strona wsi →</a>
        <span aria-hidden="true"> · </span>
        <a href="${osm}" target="_blank" rel="noopener noreferrer">Punkt w OSM ↗</a>
        ${czyStacja ? `<span aria-hidden="true"> · </span><a href="${stacjaLink}">Rozkład stacji 🚆</a>` : ""}
        ${czyOspWoda ? `<span aria-hidden="true"> · </span><a href="${zglosAktualizacjeLink}">Zgłoś aktualizację punktu</a>` : ""}
      </p>
    </div>
  `;
}

export const MapaWsiLeaflet = forwardRef<
  MapaWsiLeafletRef,
  { znaczniki: ZnacznikWsi[]; punktyPoi?: ZnacznikPoi[] }
>(function MapaWsiLeaflet({ znaczniki, punktyPoi = [] }, ref) {
    const refMapa = useRef<HTMLDivElement>(null);
    const instancja = useRef<InstancjaLeaflet | null>(null);
    const leafletRef = useRef<LeafletNs | null>(null);
    const [pokazWarstweReferencyjna, setPokazWarstweReferencyjna] = useState(false);
    const znacznikiRef = useRef(znaczniki);
    znacznikiRef.current = znaczniki;
    const punktyPoiRef = useRef(punktyPoi);
    punktyPoiRef.current = punktyPoi;

    const bboxPoczatkowy = useMemo(
      () => bboxDlaPunktowMapy(znaczniki, punktyPoi),
      [znaczniki, punktyPoi],
    );

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
        ustawPaneWarstwicyGranicy(map);

        const baseTileLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }).addTo(map);
        const geoportalWmsLayer = CZY_GEO_WMS_DOSTEPNY
          ? L.tileLayer.wms(GEO_WMS_URL, {
              layers: GEO_WMS_LAYERS,
              format: "image/png",
              transparent: true,
              version: "1.3.0",
              opacity: 0.72,
            })
          : null;

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
          baseTileLayer,
          geoportalWmsLayer,
          markersById: new Map(),
          resizeHandler,
          wheelHandlers: { enter, leave },
        };

        const z0 = znacznikiRef.current;
        const p0 = punktyPoiRef.current;
        const bb0 = bboxDlaPunktowMapy(z0, p0);
        syncWarstwy(L, instancja.current, z0, p0, ikona, bb0);
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
      syncWarstwy(L, inst, znaczniki, punktyPoi, ikona, bboxPoczatkowy);
    }, [znaczniki, punktyPoi, bboxPoczatkowy]);

    useEffect(() => {
      const inst = instancja.current;
      if (!inst || !inst.geoportalWmsLayer) return;
      if (pokazWarstweReferencyjna) {
        if (!inst.map.hasLayer(inst.geoportalWmsLayer)) {
          inst.geoportalWmsLayer.addTo(inst.map);
        }
      } else if (inst.map.hasLayer(inst.geoportalWmsLayer)) {
        inst.map.removeLayer(inst.geoportalWmsLayer);
      }
    }, [pokazWarstweReferencyjna]);

    return (
      <div className="mapa-wsi-map-shell relative h-[min(72dvh,560px)] w-full min-h-[320px] md:h-[min(78dvh,640px)]">
        <div
          ref={refMapa}
          className="z-0 h-full w-full rounded-xl border border-stone-200/80 bg-stone-100 shadow-inner ring-1 ring-green-950/5 transition-shadow duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700/40"
          role="application"
          aria-label="Mapa interaktywna — wsie naszawies.pl"
          tabIndex={0}
        />
        {CZY_GEO_WMS_DOSTEPNY ? (
          <div className="absolute right-3 top-3 z-[410]">
            <button
              type="button"
              onClick={() => setPokazWarstweReferencyjna((v) => !v)}
              className="rounded-lg border border-stone-200/80 bg-white/90 px-3 py-1.5 text-[11px] font-medium text-stone-700 shadow-sm backdrop-blur hover:bg-white"
            >
              {pokazWarstweReferencyjna ? "Ukryj warstwę Geoportal WMS" : "Pokaż warstwę Geoportal WMS"}
            </button>
          </div>
        ) : null}
        <div
          className="mapa-wsi-legenda-wow pointer-events-none absolute left-3 top-3 z-[400] max-w-[min(100%,300px)] rounded-xl border border-stone-200/80 bg-white/90 px-3 py-2.5 text-[11px] leading-snug text-stone-700 shadow-lg shadow-green-950/5 backdrop-blur-md"
          aria-hidden="true"
        >
          <p className="font-semibold text-stone-800">Legenda</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-stone-600">
            <li>
              <span className="font-medium text-[#1d4d1d]">Ciągła zielona linia</span> — granica z bazy (GeoJSON)
            </li>
            <li>
              <span className="font-medium text-[#3d6b4a]">Przerywany obrys</span> — tylko przybliżenie, gdy w bazie nie
              ma jeszcze wielokąta
            </li>
            <li>
              <span className="font-medium text-[#5a9c3e]">Pinezka (chałupa)</span> — środek wsi (GPS w profilu)
            </li>
            <li>
              <span className="font-medium text-stone-800">Kolorowa pinezka (emoji)</span> — miejsca w sołectwie: kościół,
              szkoła, świetlica, OSP, punkt czerpania wody OSP, sklep, przystanek, stacja kolejowa… (dane w serwisie)
            </li>
            <li>
              <span className="font-medium text-stone-800">Kółko z liczbą</span> — kilka punktów w obszarze
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
  punktyPoi: ZnacznikPoi[],
  ikona: import("leaflet").DivIcon,
  bbox: [[number, number], [number, number]] | null,
) {
  const { map, cluster, boundaryGroup, markersById } = inst;
  ustawPaneWarstwicyGranicy(map);

  (cluster as import("leaflet").LayerGroup).clearLayers();
  boundaryGroup.clearLayers();
  markersById.clear();

  for (const z of znaczniki) {
    const gj = granicaJakoGeoJson(z.boundary_geojson);
    let wariant: WariantGranicyWPopup = "pozor";
    let mamyPrawdziwaGranice = false;
    if (gj) {
      try {
        const warstwa = L.geoJSON(gj, {
          pane: PANE_GRANICE,
          style: {
            color: "#1d4d1d",
            weight: 3,
            fillColor: "#3d7a2e",
            fillOpacity: 0.13,
            opacity: 1,
            lineCap: "round",
            lineJoin: "round",
          },
        });
        warstwa.bindPopup(htmlPopup(z, "geojson"));
        boundaryGroup.addLayer(warstwa);
        mamyPrawdziwaGranice = true;
        wariant = "geojson";
      } catch {
        mamyPrawdziwaGranice = false;
      }
    }
    if (!mamyPrawdziwaGranice) {
      const prom = promienPrzyblizonyMetrow(z);
      const kolo = L.circle([z.lat, z.lon], {
        radius: prom,
        pane: PANE_GRANICE,
        color: "#3d6b4a",
        weight: 2,
        opacity: 0.92,
        dashArray: "10 7",
        fillColor: "#5a9c3e",
        fillOpacity: 0.07,
      });
      kolo.bindPopup(htmlPopup(z, "pozor"));
      boundaryGroup.addLayer(kolo);
      wariant = "pozor";
    }

    const marker = L.marker([z.lat, z.lon], { icon: ikona, title: z.name });
    marker.bindPopup(htmlPopup(z, wariant));
    (cluster as import("leaflet").LayerGroup).addLayer(marker);
    markersById.set(z.id, marker);
  }

  for (const p of punktyPoi) {
    const pin = L.marker([p.lat, p.lon], { icon: zbudujIkonePoi(L, p), zIndexOffset: 450, title: p.name });
    pin.bindPopup(htmlPopupPoi(p));
    (cluster as import("leaflet").LayerGroup).addLayer(pin);
  }

  if (bbox) {
    map.fitBounds(bbox, { padding: [28, 28], maxZoom: 12, animate: false });
  } else {
    map.setView([52.1, 19.3], 6);
  }

  setTimeout(() => map.invalidateSize(), 80);
}
