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

/** Ogłoszenie rynku lokalnego z GPS (zatwierdzone). */
export type ZnacznikRynek = {
  id: string;
  title: string;
  listingType: string;
  listingTypeLabel: string;
  lat: number;
  lon: number;
  villageName: string;
  sciezkaWsi: string;
  href: string;
};

export type MapaWsiLeafletRef = {
  /** Przybliża mapę i otwiera popup dla wsi o podanym `id`. */
  pokazNaMapie: (idWsi: string) => boolean;
  /** Przybliża mapę do pozycji użytkownika (jeśli przekazano). */
  przyblizDoUzytkownika: () => boolean;
  /** Przybliża mapę do współrzędnych (np. ogłoszenie rynku). */
  pokazPunkt: (lat: number, lon: number, zoom?: number) => boolean;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Zamknięty pierścień jako LineString → Polygon (czasem eksport PRG/OSM). */
function lineStringZamknietyJakoPolygon(raw: object): GeoJsonObject | null {
  const o = raw as { type?: string; coordinates?: unknown };
  if (o.type !== "LineString" || !Array.isArray(o.coordinates)) return null;
  const ring = o.coordinates as [number, number][];
  if (ring.length < 4) return null;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (
    !first ||
    !last ||
    typeof first[0] !== "number" ||
    typeof first[1] !== "number" ||
    first[0] !== last[0] ||
    first[1] !== last[1]
  ) {
    return null;
  }
  return { type: "Polygon", coordinates: [ring] } as GeoJsonObject;
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
  const o = raw as { type?: string; features?: unknown[]; geometry?: unknown };
  if (o.type === "FeatureCollection" && Array.isArray(o.features) && o.features.length === 0) {
    return null;
  }
  const jakoLinia = lineStringZamknietyJakoPolygon(raw);
  if (jakoLinia) return jakoLinia;
  if (o.type === "Feature" && o.geometry != null && typeof o.geometry === "object") {
    const polyZLinii = lineStringZamknietyJakoPolygon(o.geometry as object);
    if (polyZLinii) return { ...o, geometry: polyZLinii } as GeoJsonObject;
  }
  if (
    o.type === "Polygon" ||
    o.type === "MultiPolygon" ||
    o.type === "GeometryCollection" ||
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
  /** Nad kafelkami (200), pod pinezkami (markerPane 600) — granice czytelne, klik zostaje na znaczniku. */
  pane.style.zIndex = "500";
}

function htmlPopup(z: ZnacznikWsi, wariant: WariantGranicyWPopup): string {
  const oferty = z.public_offers_count;
  const ofertyTxt =
    oferty === 0
      ? "Brak publicznych ofert na targu lokalnym."
      : `${oferty} publiczn${oferty === 1 ? "a oferta" : oferty < 5 ? "e oferty" : "ych ofert"} na targu lokalnym.`;
  const granicaTxt =
    wariant === "geojson"
      ? "Obrys z bazy (PRG / GeoJSON, WGS84). To zwykle obręb ewidencyjny wokół punktu wsi — może nie pokrywać się w 100% z granicą sołectwa administracyjnego."
      : wariant === "pozor"
        ? "Przerywany obrys: szacunkowe terytorium (brak wgranego wielokąta w bazie)."
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

/** Rozszerza bbox o wierzchołki GeoJSON (w tym GeometryCollection i zagnieżdżone Feature). */
function rozszerzBboxZOGeojson(gj: GeoJsonObject, visit: (lat: number, lon: number) => void) {
  const walkCoords = (node: unknown): void => {
    if (!Array.isArray(node)) return;
    if (
      node.length >= 2 &&
      typeof node[0] === "number" &&
      typeof node[1] === "number" &&
      !Array.isArray(node[0])
    ) {
      const lon = node[0] as number;
      const lat = node[1] as number;
      visit(lat, lon);
      return;
    }
    for (const x of node) walkCoords(x);
  };

  const dispatch = (geo: unknown): void => {
    if (!geo || typeof geo !== "object") return;
    const o = geo as {
      type?: string;
      coordinates?: unknown;
      geometries?: unknown[];
      geometry?: unknown;
      features?: unknown[];
    };
    if (o.type === "FeatureCollection" && Array.isArray(o.features)) {
      for (const f of o.features) dispatch(f);
      return;
    }
    if (o.type === "Feature") {
      dispatch(o.geometry);
      return;
    }
    if (o.type === "GeometryCollection" && Array.isArray(o.geometries)) {
      for (const g of o.geometries) dispatch(g);
      return;
    }
    if (o.type === "Polygon" || o.type === "MultiPolygon") {
      if (o.coordinates != null) walkCoords(o.coordinates);
      return;
    }
    if (o.type === "LineString" || o.type === "MultiLineString") {
      if (o.coordinates != null) walkCoords(o.coordinates);
    }
  };

  dispatch(gj);
}

function bboxDlaPunktowMapy(
  znaczniki: ZnacznikWsi[],
  pois: ZnacznikPoi[],
  rynek: ZnacznikRynek[] = [],
): [[number, number], [number, number]] | null {
  if (znaczniki.length === 0 && pois.length === 0 && rynek.length === 0) return null;
  let minLat = 90;
  let maxLat = -90;
  let minLon = 180;
  let maxLon = -180;
  const visit = (lat: number, lon: number) => {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
  };
  for (const z of znaczniki) {
    visit(z.lat, z.lon);
    const gj = granicaJakoGeoJson(z.boundary_geojson);
    if (gj) rozszerzBboxZOGeojson(gj, visit);
  }
  for (const p of pois) {
    visit(p.lat, p.lon);
  }
  for (const r of rynek) {
    visit(r.lat, r.lon);
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
  userLayer: import("leaflet").LayerGroup;
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

function zbudujIkoneRynek(L: LeafletNs) {
  const html = `<div class="naszawies-marker-poi-inner" style="border-color:#c2410c;font-size:16px">🛒</div>`;
  return L.divIcon({
    className: "naszawies-leaflet-divicon",
    html,
    iconSize: [34, 34],
    iconAnchor: [17, 19],
    popupAnchor: [0, -18],
  });
}

function htmlPopupRynek(z: ZnacznikRynek): string {
  return `
    <div class="mapa-wsi-popup">
      <p class="mapa-wsi-popup-meta">Rynek lokalny · ${escapeHtml(z.listingTypeLabel)} · ${escapeHtml(z.villageName)}</p>
      <h3>${escapeHtml(z.title)}</h3>
      <p><a href="${escapeHtml(z.href)}">Zobacz ogłoszenie</a></p>
    </div>
  `;
}

function htmlPopupPoi(z: ZnacznikPoi): string {
  const kat = etykietaKategoriiPoi(z.category);
  const opis = z.description?.trim();
  const osm = `https://www.openstreetmap.org/?mlat=${encodeURIComponent(String(z.lat))}&mlon=${encodeURIComponent(String(z.lon))}&zoom=17`;
  const czyStacja = z.category.trim().toLowerCase() === "stacja_kolejowa";
  const czyPrzystanek = z.category.trim().toLowerCase() === "przystanek";
  const czyOspWoda = z.category.trim().toLowerCase() === "osp_punkt_czerpania_wody";
  const stacjaLink = `/transport/rozklad?stacja=${encodeURIComponent(z.name)}`;
  const epodroznikLink = `https://www.e-podroznik.pl/public/search?from=${encodeURIComponent(`${z.name}, ${z.villageName}`)}`;
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
        ${czyStacja ? `<span aria-hidden="true"> · </span><a href="${stacjaLink}">Rozkład PKP 🚆</a>` : ""}
        ${czyPrzystanek ? `<span aria-hidden="true"> · </span><a href="${epodroznikLink}" target="_blank" rel="noopener noreferrer">PKS / bus ↗</a>` : ""}
        ${czyOspWoda ? `<span aria-hidden="true"> · </span><a href="${zglosAktualizacjeLink}">Zgłoś aktualizację punktu</a>` : ""}
      </p>
    </div>
  `;
}

export const MapaWsiLeaflet = forwardRef<
  MapaWsiLeafletRef,
  {
    znaczniki: ZnacznikWsi[];
    punktyPoi?: ZnacznikPoi[];
    punktyRynek?: ZnacznikRynek[];
    pozycjaUzytkownika?: { lat: number; lon: number } | null;
    promienKm?: number | null;
    pokazGranice?: boolean;
    pokazPoi?: boolean;
    pokazRynek?: boolean;
  }
>(function MapaWsiLeaflet(
  {
    znaczniki,
    punktyPoi = [],
    punktyRynek = [],
    pozycjaUzytkownika = null,
    promienKm = null,
    pokazGranice = true,
    pokazPoi = true,
    pokazRynek = true,
  },
  ref,
) {
    const refMapa = useRef<HTMLDivElement>(null);
    const refShell = useRef<HTMLDivElement>(null);
    const instancja = useRef<InstancjaLeaflet | null>(null);
    const leafletRef = useRef<LeafletNs | null>(null);
    const pozycjaRef = useRef(pozycjaUzytkownika);
    pozycjaRef.current = pozycjaUzytkownika;
    const [pokazWarstweReferencyjna, setPokazWarstweReferencyjna] = useState(false);
    const [pokazGraniceStan, setPokazGraniceStan] = useState(pokazGranice);
    const [pokazPoiStan, setPokazPoiStan] = useState(pokazPoi);
    const [pokazRynekStan, setPokazRynekStan] = useState(pokazRynek);
    const [pelnyEkran, setPelnyEkran] = useState(false);
    const znacznikiRef = useRef(znaczniki);
    znacznikiRef.current = znaczniki;
    const punktyPoiRef = useRef(punktyPoi);
    punktyPoiRef.current = punktyPoi;
    const punktyRynekRef = useRef(punktyRynek);
    punktyRynekRef.current = punktyRynek;
    const pokazGraniceRef = useRef(pokazGraniceStan);
    pokazGraniceRef.current = pokazGraniceStan;
    const pokazPoiRef = useRef(pokazPoiStan);
    pokazPoiRef.current = pokazPoiStan;
    const pokazRynekRef = useRef(pokazRynekStan);
    pokazRynekRef.current = pokazRynekStan;
    const promienRef = useRef(promienKm);
    promienRef.current = promienKm;

    const bboxPoczatkowy = useMemo(
      () =>
        bboxDlaPunktowMapy(
          znaczniki,
          pokazPoiStan ? punktyPoi : [],
          pokazRynekStan ? punktyRynek : [],
        ),
      [znaczniki, punktyPoi, punktyRynek, pokazPoiStan, pokazRynekStan],
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
      przyblizDoUzytkownika() {
        const inst = instancja.current;
        const pos = pozycjaRef.current;
        if (!inst || !pos) return false;
        inst.map.setView([pos.lat, pos.lon], Math.max(inst.map.getZoom(), 13));
        return true;
      },
      pokazPunkt(lat: number, lon: number, zoom = 14) {
        const inst = instancja.current;
        if (!inst || !Number.isFinite(lat) || !Number.isFinite(lon)) return false;
        inst.map.setView([lat, lon], zoom);
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
        const userLayer = L.layerGroup().addTo(map);
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
          userLayer,
          baseTileLayer,
          geoportalWmsLayer,
          markersById: new Map(),
          resizeHandler,
          wheelHandlers: { enter, leave },
        };

        const z0 = znacznikiRef.current;
        const p0 = pokazPoiRef.current ? punktyPoiRef.current : [];
        const r0 = pokazRynekRef.current ? punktyRynekRef.current : [];
        const bb0 = bboxDlaPunktowMapy(z0, p0, r0);
        syncWarstwy(L, instancja.current, z0, p0, r0, ikona, bb0, {
          pokazGranice: pokazGraniceRef.current,
        });
        syncWarstwaUzytkownika(L, instancja.current, pozycjaRef.current, promienRef.current);
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
      syncWarstwy(
        L,
        inst,
        znaczniki,
        pokazPoiStan ? punktyPoi : [],
        pokazRynekStan ? punktyRynek : [],
        ikona,
        bboxPoczatkowy,
        { pokazGranice: pokazGraniceStan },
      );
    }, [znaczniki, punktyPoi, punktyRynek, bboxPoczatkowy, pokazGraniceStan, pokazPoiStan, pokazRynekStan]);

    useEffect(() => {
      const inst = instancja.current;
      const L = leafletRef.current;
      if (!inst || !L) return;
      syncWarstwaUzytkownika(L, inst, pozycjaUzytkownika, promienKm);
    }, [pozycjaUzytkownika, promienKm]);

    useEffect(() => {
      const inst = instancja.current;
      if (!inst) return;
      if (pokazGraniceStan) {
        if (!inst.map.hasLayer(inst.boundaryGroup)) inst.boundaryGroup.addTo(inst.map);
      } else if (inst.map.hasLayer(inst.boundaryGroup)) {
        inst.map.removeLayer(inst.boundaryGroup);
      }
    }, [pokazGraniceStan]);

    useEffect(() => {
      const onChange = () => {
        setPelnyEkran(!!document.fullscreenElement);
        instancja.current?.map.invalidateSize();
      };
      document.addEventListener("fullscreenchange", onChange);
      return () => document.removeEventListener("fullscreenchange", onChange);
    }, []);

    const togglePelnyEkran = () => {
      const el = refShell.current;
      if (!el) return;
      if (!document.fullscreenElement) {
        void el.requestFullscreen?.();
      } else {
        void document.exitFullscreen?.();
      }
    };

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
      <div
        ref={refShell}
        className={`mapa-wsi-map-shell relative w-full min-h-[320px] bg-stone-100 ${
          pelnyEkran ? "h-[100dvh] max-h-[100dvh]" : "h-[min(72dvh,560px)] md:h-[min(78dvh,640px)]"
        }`}
      >
        <div
          ref={refMapa}
          className="z-0 h-full w-full rounded-xl border border-stone-200/80 bg-stone-100 shadow-inner ring-1 ring-green-950/5 transition-shadow duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700/40"
          role="application"
          aria-label="Mapa interaktywna — wsie naszawies.pl"
          tabIndex={0}
        />
        <div className="absolute right-3 top-3 z-[410] flex max-w-[min(100%,220px)] flex-col items-end gap-1.5">
          <button
            type="button"
            onClick={() => setPokazGraniceStan((v) => !v)}
            className="rounded-lg border border-stone-200/80 bg-white/90 px-3 py-1.5 text-[11px] font-medium text-stone-700 shadow-sm backdrop-blur hover:bg-white"
          >
            {pokazGraniceStan ? "Ukryj obrysy wsi" : "Pokaż obrysy wsi"}
          </button>
          <button
            type="button"
            onClick={() => setPokazPoiStan((v) => !v)}
            className="rounded-lg border border-stone-200/80 bg-white/90 px-3 py-1.5 text-[11px] font-medium text-stone-700 shadow-sm backdrop-blur hover:bg-white"
          >
            {pokazPoiStan ? "Ukryj punkty POI" : "Pokaż punkty POI"}
          </button>
          <button
            type="button"
            onClick={() => setPokazRynekStan((v) => !v)}
            className="rounded-lg border border-orange-200/80 bg-orange-50/90 px-3 py-1.5 text-[11px] font-medium text-orange-950 shadow-sm backdrop-blur hover:bg-white"
          >
            {pokazRynekStan ? "Ukryj rynek lokalny" : "Pokaż rynek lokalny"}
          </button>
          {CZY_GEO_WMS_DOSTEPNY ? (
            <button
              type="button"
              onClick={() => setPokazWarstweReferencyjna((v) => !v)}
              className="rounded-lg border border-stone-200/80 bg-white/90 px-3 py-1.5 text-[11px] font-medium text-stone-700 shadow-sm backdrop-blur hover:bg-white"
            >
              {pokazWarstweReferencyjna ? "Ukryj Geoportal WMS" : "Geoportal WMS"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={togglePelnyEkran}
            className="rounded-lg border border-green-800/30 bg-green-50/95 px-3 py-1.5 text-[11px] font-semibold text-green-900 shadow-sm backdrop-blur hover:bg-green-100"
          >
            {pelnyEkran ? "Wyjdź z pełnego ekranu" : "Pełny ekran"}
          </button>
        </div>
        <div
          className="mapa-wsi-legenda-wow pointer-events-none absolute left-3 top-3 z-[400] max-w-[min(100%,300px)] rounded-xl border border-stone-200/80 bg-white/90 px-3 py-2.5 text-[11px] leading-snug text-stone-700 shadow-lg shadow-green-950/5 backdrop-blur-md"
          aria-hidden="true"
        >
          <p className="font-semibold text-stone-800">Legenda</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-stone-600">
            <li>
              <span className="font-medium text-[#1d4d1d]">Ciągła zielona linia</span> — obrys z bazy (PRG / GeoJSON,
              zwykle obręb ewidencyjny)
            </li>
            <li>
              <span className="font-medium text-[#3d6b4a]">Przerywany obrys</span> — szacunek, gdy w bazie nie ma
              wgranego wielokąta
            </li>
            <li>
              <span className="font-medium text-[#5a9c3e]">Pinezka (chałupa)</span> — środek wsi (GPS w profilu)
            </li>
            <li>
              <span className="font-medium text-stone-800">Kolorowa pinezka (emoji)</span> — miejsca w sołectwie: kościół,
              szkoła, świetlica, OSP, punkt czerpania wody OSP, sklep, przystanek, stacja kolejowa… (dane w serwisie)
            </li>
            <li>
              <span className="font-medium text-[#2563eb]">Niebieski punkt</span> — Twoja lokalizacja (gdy włączysz GPS)
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

function syncWarstwaUzytkownika(
  L: LeafletNs,
  inst: InstancjaLeaflet,
  pozycja: { lat: number; lon: number } | null | undefined,
  promienKm: number | null | undefined,
) {
  inst.userLayer.clearLayers();
  if (!pozycja) return;
  const marker = L.circleMarker([pozycja.lat, pozycja.lon], {
    radius: 9,
    color: "#1d4ed8",
    weight: 3,
    fillColor: "#3b82f6",
    fillOpacity: 0.9,
  });
  marker.bindPopup("Twoja lokalizacja (przybliżona)");
  inst.userLayer.addLayer(marker);
  if (promienKm != null && promienKm > 0) {
    const kolo = L.circle([pozycja.lat, pozycja.lon], {
      radius: promienKm * 1000,
      color: "#2563eb",
      weight: 2,
      dashArray: "6 6",
      fillColor: "#3b82f6",
      fillOpacity: 0.07,
      interactive: false,
    });
    inst.userLayer.addLayer(kolo);
  }
}

function syncWarstwy(
  L: LeafletNs,
  inst: InstancjaLeaflet,
  znaczniki: ZnacznikWsi[],
  punktyPoi: ZnacznikPoi[],
  punktyRynek: ZnacznikRynek[],
  ikona: import("leaflet").DivIcon,
  bbox: [[number, number], [number, number]] | null,
  opts?: { pokazGranice?: boolean },
) {
  const pokazGranice = opts?.pokazGranice !== false;
  const { map, cluster, boundaryGroup, markersById } = inst;
  ustawPaneWarstwicyGranicy(map);

  (cluster as import("leaflet").LayerGroup).clearLayers();
  boundaryGroup.clearLayers();
  markersById.clear();

  for (const z of znaczniki) {
    const gj = granicaJakoGeoJson(z.boundary_geojson);
    let wariant: WariantGranicyWPopup = "pozor";
    let mamyPrawdziwaGranice = false;
    if (pokazGranice && gj) {
      try {
        const warstwa = L.geoJSON(gj, {
          pane: PANE_GRANICE,
          interactive: false,
          renderer: L.svg({ padding: 0.55 }),
          style: {
            color: "#06290a",
            weight: 5,
            fillColor: "#256620",
            fillOpacity: 0.22,
            opacity: 1,
            lineCap: "round",
            lineJoin: "round",
          },
        } as import("leaflet").GeoJSONOptions);
        warstwa.bindPopup(htmlPopup(z, "geojson"));
        boundaryGroup.addLayer(warstwa);
        mamyPrawdziwaGranice = true;
        wariant = "geojson";
      } catch {
        mamyPrawdziwaGranice = false;
      }
    }
    if (pokazGranice && !mamyPrawdziwaGranice) {
      const prom = promienPrzyblizonyMetrow(z);
      const kolo = L.circle([z.lat, z.lon], {
        radius: prom,
        pane: PANE_GRANICE,
        interactive: false,
        color: "#1a4d28",
        weight: 3,
        opacity: 1,
        dashArray: "12 8",
        fillColor: "#3d7a2e",
        fillOpacity: 0.1,
      });
      kolo.bindPopup(htmlPopup(z, "pozor"));
      boundaryGroup.addLayer(kolo);
      wariant = "pozor";
    }
    if (!pokazGranice) {
      wariant = gj ? "geojson" : "punkt";
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

  const ikonaRynek = zbudujIkoneRynek(L);
  for (const r of punktyRynek) {
    const pin = L.marker([r.lat, r.lon], { icon: ikonaRynek, zIndexOffset: 500, title: r.title });
    pin.bindPopup(htmlPopupRynek(r));
    (cluster as import("leaflet").LayerGroup).addLayer(pin);
  }

  if (bbox) {
    /** Przy jednej wsi sztywne maxZoom 12 zostawiało mapę za daleko — granica ledwo widoczna. */
    const maxZoom =
      znaczniki.length <= 1 ? 17 : znaczniki.length <= 4 ? 16 : znaczniki.length <= 12 ? 14 : znaczniki.length <= 40 ? 13 : 12;
    map.fitBounds(bbox, { padding: [32, 32], maxZoom, animate: false });
  } else {
    map.setView([52.1, 19.3], 6);
  }

  setTimeout(() => map.invalidateSize(), 80);
}
