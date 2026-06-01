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
import {
  etykietaKategoriiPoi,
  emojiKategoriiPoi,
  kolorObramowaniaPoi,
  KATEGORIA_LADNE_MIEJSCE,
  KATEGORIA_LATARNIA,
} from "@/lib/mapa/kategorie-poi";
import {
  bezpiecznyUrlDokumentu,
  etykietaStatusuInwestycji,
  formatujTerminInwestycji,
  KATEGORIA_INWESTYCJA,
  KOLOR_STATUSU_INWESTYCJI,
  normalizujStatusInwestycji,
} from "@/lib/mapa/inwestycje-poi";
import { formatujGodzinyOtwarcia } from "@/lib/mapa/formatuj-godziny-otwarcia";
import { etykietaLanduseOsm, stylLanduseOsm } from "@/lib/mapa/landuse-osm";
import { bezpiecznyHref } from "@/lib/tekst/bezpieczny-url";
import {
  CZY_KIEG_WMS_DOSTEPNY,
  KIEG_WMS_MIN_ZOOM,
  KIEG_WMS_URL,
  PANE_KIEG_WMS,
  czyKiegWidocznyNaZoomie,
  opcjeWarstwyKiegWms,
} from "@/lib/geoportal/kieg-wms";
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
  photoUrl?: string | null;
  photoCaption?: string | null;
  phone?: string | null;
  openingHours?: unknown;
  linkedEntityId?: string | null;
  /** Link do interaktywnego planu cmentarza (gdy opublikowany). */
  linkPlanuCmentarza?: string | null;
  investmentStatus?: string | null;
  plannedCompletionAt?: string | null;
  documentUrl?: string | null;
};

/** Opublikowany obrys cmentarza z planu wsi (polygon OSM). */
export type ZnacznikCmentarzObrys = {
  id: string;
  villageId: string;
  name: string;
  villageName: string;
  sciezkaWsi: string;
  hrefPlan: string;
  boundaryGeojson: unknown;
};

/** Obrys landuse z OSM (warstwa zagospodarowania — orientacyjna). */
export type ObrysLanduseMapy = {
  id: string;
  landuse: string;
  name: string | null;
  geojson: GeoJSON.Polygon;
};

/** Nazwy geograficzne (PRNG) i instytucje PRG z Geoportalu — warstwa referencyjna. */
export type ZnacznikGeoKontekst = {
  id: string;
  villageId: string;
  villageName: string;
  sciezkaWsi: string;
  dataset: string;
  name: string;
  rodzaj: string | null;
  lat: number;
  lon: number;
  layerLabel: string;
};

/** Zgłoszenie mieszkańców z GPS (dla członków wsi na mapie). */
export type ZnacznikZgloszenie = {
  id: string;
  title: string;
  status: string;
  category?: string;
  lat: number;
  lon: number;
  villageName: string;
  villageId?: string;
};

/** Aktywne ostrzeżenie polowania — obszar (GeoJSON) lub pinezka w centrum wsi. */
export type ZnacznikPolowanie = {
  id: string;
  title: string;
  areaDescription: string;
  startsAt: string;
  endsAt: string;
  lat: number;
  lon: number;
  villageName: string;
  villageSciezka: string;
  areaGeojson: unknown | null;
};

/** Punkt adresowy KIN (Geoportal) — opcjonalna warstwa na mapie. */
export type ZnacznikAdres = {
  id: string;
  villageId: string;
  villageName: string;
  streetName: string | null;
  houseNumber: string;
  lat: number;
  lon: number;
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

/** Działka / nieruchomość z granicą z Geoportalu (polygon na mapie). */
export type ZnacznikRynekDzialka = {
  id: string;
  title: string;
  href: string;
  villageName: string;
  areaLabel?: string;
  categoryLabel?: string;
  parcelGeojson: unknown;
};

export type MapaWsiLeafletRef = {
  /** Przybliża mapę i otwiera popup dla wsi o podanym `id`. */
  pokazNaMapie: (idWsi: string) => boolean;
  /** Przybliża mapę do pozycji użytkownika (jeśli przekazano). */
  przyblizDoUzytkownika: () => boolean;
  /** Przybliża mapę do współrzędnych (np. ogłoszenie rynku). */
  pokazPunkt: (lat: number, lon: number, zoom?: number) => boolean;
  /** Przybliża mapę do obszaru aktywnego polowania. */
  pokazPolowanie: (idPolowania: string) => boolean;
  pokazPoi: (idPoi: string) => boolean;
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
  if (!map.getPane(PANE_KIEG_WMS)) {
    const egib = map.createPane(PANE_KIEG_WMS);
    /** Nad podkładem (200), pod obrysami wsi z bazy (500). */
    egib.style.zIndex = "220";
  }
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
  polowania: ZnacznikPolowanie[] = [],
  rynekDzialki: ZnacznikRynekDzialka[] = [],
  cmentarze: ZnacznikCmentarzObrys[] = [],
): [[number, number], [number, number]] | null {
  if (
    znaczniki.length === 0 &&
    pois.length === 0 &&
    rynek.length === 0 &&
    polowania.length === 0 &&
    rynekDzialki.length === 0 &&
    cmentarze.length === 0
  )
    return null;
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
  for (const pol of polowania) {
    visit(pol.lat, pol.lon);
    const gj = granicaJakoGeoJson(pol.areaGeojson);
    if (gj) rozszerzBboxZOGeojson(gj, visit);
  }
  for (const d of rynekDzialki) {
    const gj = granicaJakoGeoJson(d.parcelGeojson);
    if (gj) rozszerzBboxZOGeojson(gj, visit);
  }
  for (const c of cmentarze) {
    const gj = granicaJakoGeoJson(c.boundaryGeojson);
    if (gj) rozszerzBboxZOGeojson(gj, visit);
  }
  const pad = 0.12;
  return [
    [minLat - pad, minLon - pad],
    [maxLat + pad, maxLon + pad],
  ];
}

/** Podkład mapy (nie mylić z warstwami POI / granic). */
export type RodzajPodkladuMapy = "mapa" | "satelita" | "ortofoto";

const KLUCZ_PODKLADU_STORAGE = "naszawies-mapa-podklad";

const URL_PODKLAD_MAPA = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const URL_PODKLAD_SATELITA = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const URL_PODKLAD_ETYKIETY =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";

type InstancjaLeaflet = {
  map: import("leaflet").Map;
  cluster: import("leaflet").Layer;
  boundaryGroup: import("leaflet").LayerGroup;
  userLayer: import("leaflet").LayerGroup;
  podkladMapa: import("leaflet").TileLayer;
  podkladSatelita: import("leaflet").TileLayer;
  podkladEtykietySatelita: import("leaflet").TileLayer;
  geoportalWmsLayer: import("leaflet").TileLayer.WMS | null;
  egibWmsLayer: import("leaflet").TileLayer.WMS | null;
  adresyGroup: import("leaflet").LayerGroup;
  geoKontekstGroup: import("leaflet").LayerGroup;
  landuseGroup: import("leaflet").LayerGroup;
  markersById: Map<string, import("leaflet").Marker>;
  polowaniaById: Map<string, import("leaflet").Layer>;
  rynekDzialkiById: Map<string, import("leaflet").Layer>;
  poiMarkersById: Map<string, import("leaflet").Marker>;
  resizeHandler: () => void;
  wheelHandlers: { enter: () => void; leave: () => void };
};

const GEO_WMS_URL = process.env.NEXT_PUBLIC_GEOPORTAL_WMS_URL?.trim() ?? "";
const GEO_WMS_LAYERS = process.env.NEXT_PUBLIC_GEOPORTAL_WMS_LAYERS?.trim() ?? "";
const CZY_GEO_WMS_DOSTEPNY = GEO_WMS_URL.length > 0 && GEO_WMS_LAYERS.length > 0;
const KLUCZ_EGIB_STORAGE = "naszawies-mapa-egib";

function wczytajZapisanyEgib(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const v = window.sessionStorage.getItem(KLUCZ_EGIB_STORAGE);
    if (v === "0") return false;
    if (v === "1") return true;
  } catch {
    /* ignore */
  }
  return true;
}

function ustawWarstweEgib(inst: InstancjaLeaflet, pokaz: boolean) {
  const warstwa = inst.egibWmsLayer;
  if (!warstwa) return;
  const onMap = inst.map.hasLayer(warstwa);
  if (pokaz && !onMap) warstwa.addTo(inst.map);
  else if (!pokaz && onMap) inst.map.removeLayer(warstwa);
}

function wczytajZapisanyPodklad(): RodzajPodkladuMapy {
  if (typeof window === "undefined") return "mapa";
  try {
    const v = window.sessionStorage.getItem(KLUCZ_PODKLADU_STORAGE);
    if (v === "satelita" || v === "ortofoto" || v === "mapa") {
      if (v === "ortofoto" && !CZY_GEO_WMS_DOSTEPNY) return "mapa";
      return v;
    }
  } catch {
    /* ignore */
  }
  return "mapa";
}

function ustawPodkladMapy(inst: InstancjaLeaflet, rodzaj: RodzajPodkladuMapy) {
  const warstwy = [inst.podkladMapa, inst.podkladSatelita, inst.podkladEtykietySatelita, inst.geoportalWmsLayer];
  for (const w of warstwy) {
    if (w && inst.map.hasLayer(w)) inst.map.removeLayer(w);
  }
  if (rodzaj === "satelita") {
    inst.podkladSatelita.addTo(inst.map);
    inst.podkladEtykietySatelita.addTo(inst.map);
  } else if (rodzaj === "ortofoto" && inst.geoportalWmsLayer) {
    inst.geoportalWmsLayer.setOpacity(1);
    inst.geoportalWmsLayer.addTo(inst.map);
  } else {
    inst.podkladMapa.addTo(inst.map);
  }
}

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
  const kat = z.category.trim().toLowerCase();
  const jestLatarnia = kat === KATEGORIA_LATARNIA;
  const jestInwestycja = kat === KATEGORIA_INWESTYCJA;
  const statusInv = jestInwestycja ? normalizujStatusInwestycji(z.investmentStatus) : null;
  const wow =
    kat === KATEGORIA_LADNE_MIEJSCE && z.photoUrl ? " naszawies-marker-poi-wow" : "";
  const pulseInv =
    jestInwestycja && statusInv !== "zakonczona" && statusInv !== "wstrzymana"
      ? statusInv === "w_budowie"
        ? " naszawies-marker-inwestycja-budowa"
        : " naszawies-marker-inwestycja-plan"
      : "";
  const rozmiar = jestLatarnia ? 22 : jestInwestycja ? 38 : 36;
  const anchor = jestLatarnia ? 11 : jestInwestycja ? 19 : 18;
  const fontSize = jestLatarnia ? "11px" : jestInwestycja ? "17px" : undefined;
  const kolorOstateczny =
    jestInwestycja && statusInv ? KOLOR_STATUSU_INWESTYCJI[statusInv] : kolor;
  const html = `<div class="naszawies-marker-poi-inner${wow}${pulseInv}${jestLatarnia ? " naszawies-marker-latarnia" : ""}${jestInwestycja ? " naszawies-marker-inwestycja" : ""}" style="border-color:${kolorOstateczny}${fontSize ? `;font-size:${fontSize}` : ""}">${escapeHtml(emoji)}</div>`;
  return L.divIcon({
    className: "naszawies-leaflet-divicon",
    html,
    iconSize: [rozmiar, rozmiar],
    iconAnchor: [anchor, jestLatarnia ? 11 : jestInwestycja ? 19 : 20],
    popupAnchor: [0, jestLatarnia ? -10 : jestInwestycja ? -20 : -20],
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

function htmlPopupRynekDzialka(z: ZnacznikRynekDzialka): string {
  const meta = [z.categoryLabel ? escapeHtml(z.categoryLabel) : "", z.areaLabel ? escapeHtml(z.areaLabel) : ""]
    .filter(Boolean)
    .join(" · ");
  return `
    <div class="mapa-wsi-popup">
      <p class="mapa-wsi-popup-meta">Działka · ${escapeHtml(z.villageName)}${meta ? ` · ${meta}` : ""}</p>
      <h3>${escapeHtml(z.title)}</h3>
      <p><a href="${escapeHtml(z.href)}">Zobacz ogłoszenie</a></p>
    </div>
  `;
}

const KAT_TRANSPORT = new Set(["przystanek", "stacja_kolejowa"]);
const KAT_SWIETLICA = "swietlica";
const KAT_KONTAKT = new Set([
  "swietlica",
  "kosciol",
  "szkola",
  "przedszkole",
  "sklep",
  "biblioteka",
  "urzad",
  "soltys",
  "biuro_solec",
  "cmentarz",
]);

function htmlKontaktPoi(z: ZnacznikPoi): string {
  const tel = z.phone?.trim();
  const godz = formatujGodzinyOtwarcia(z.openingHours);
  const linie: string[] = [];
  if (tel) {
    linie.push(`<p class="mapa-wsi-popup-kontakt"><strong>Tel.</strong> <a href="tel:${escapeHtml(tel.replace(/\s/g, ""))}">${escapeHtml(tel)}</a></p>`);
  }
  if (godz) {
    linie.push(`<p class="mapa-wsi-popup-kontakt"><strong>Godziny:</strong> ${escapeHtml(godz)}</p>`);
  }
  return linie.join("");
}

function podlaczInterakcjeDoPopupPoi(pin: import("leaflet").Marker, p: ZnacznikPoi): void {
  podlaczOdjazdyDoPopupPoi(pin, p);

  const kat = p.category.trim().toLowerCase();
  const potrzebaSzczegoly = kat === KAT_SWIETLICA || KAT_KONTAKT.has(kat) || Boolean(p.linkedEntityId);
  if (!potrzebaSzczegoly) return;

  pin.on("popupopen", async () => {
    const root = pin.getPopup()?.getElement()?.querySelector(`[data-poi-szczegoly="${p.id}"]`);
    if (!root || root.getAttribute("data-loaded") === "1") return;

    try {
      const res = await fetch(`/api/mapa/poi/${encodeURIComponent(p.id)}/szczegoly`, { credentials: "include" });
      if (!res.ok) {
        root.innerHTML = `<span class="text-xs text-stone-500">Brak dodatkowych danych.</span>`;
        root.setAttribute("data-loaded", "1");
        return;
      }
      const json = (await res.json()) as {
        telefon?: string | null;
        godziny?: string | null;
        podmiot?: {
          nazwa?: string;
          telefon?: string | null;
          email?: string | null;
          strona?: string | null;
          adres?: string | null;
          godziny?: string | null;
        };
        swietlica?: {
          sale?: { nazwa: string; adres: string | null; pojemnosc: number | null }[];
          kalendarz?: { sala: string; zakres: string; status: string }[];
          linkRezerwacja?: string;
          komunikat?: string;
          tylkoPodglad?: boolean;
        };
      };

      const html: string[] = [];

      if (json.podmiot) {
        const pm = json.podmiot;
        if (pm.adres) html.push(`<p class="text-xs"><strong>Adres:</strong> ${escapeHtml(pm.adres)}</p>`);
        if (pm.telefon && !p.phone?.trim()) {
          html.push(
            `<p class="text-xs"><strong>Tel.</strong> <a href="tel:${escapeHtml(pm.telefon.replace(/\s/g, ""))}">${escapeHtml(pm.telefon)}</a></p>`,
          );
        }
        if (pm.godziny && !formatujGodzinyOtwarcia(p.openingHours)) {
          html.push(`<p class="text-xs"><strong>Godziny:</strong> ${escapeHtml(pm.godziny)}</p>`);
        }
        if (pm.email) {
          html.push(`<p class="text-xs"><strong>E-mail:</strong> <a href="mailto:${escapeHtml(pm.email)}">${escapeHtml(pm.email)}</a></p>`);
        }
        if (pm.strona) {
          const hrefStrona = bezpiecznyHref(pm.strona);
          if (hrefStrona) {
            html.push(
              `<p class="text-xs"><a href="${escapeHtml(hrefStrona)}" target="_blank" rel="noopener noreferrer">Strona ↗</a></p>`,
            );
          }
        }
      }

      if (json.swietlica) {
        const sw = json.swietlica;
        if (sw.sale?.length) {
          html.push(
            `<p class="text-xs font-medium text-stone-700">Sale: ${sw.sale.map((s) => escapeHtml(s.nazwa)).join(", ")}</p>`,
          );
        }
        if (sw.kalendarz?.length) {
          const items = sw.kalendarz
            .map(
              (w) =>
                `<li><strong>${escapeHtml(w.sala)}</strong> · ${escapeHtml(w.zakres)} <em>(${escapeHtml(w.status)})</em></li>`,
            )
            .join("");
          html.push(`<p class="text-xs font-medium text-stone-700">Zajętość sal (najbliższe terminy)</p>${htmlListaOdjazdow(items)}`);
        } else if (kat === KAT_SWIETLICA) {
          html.push(`<p class="text-xs text-stone-500">Brak zajętych terminów — kalendarz uzupełnia sołtys.</p>`);
        }
        if (sw.komunikat) {
          html.push(`<p class="text-xs text-amber-800">${escapeHtml(String(sw.komunikat))}</p>`);
        }
      }

      if (html.length === 0) {
        root.innerHTML = `<span class="text-xs text-stone-500">Brak dodatkowych danych — sołtys może uzupełnić telefon i godziny w panelu.</span>`;
      } else {
        root.innerHTML = html.join("");
      }
      root.setAttribute("data-loaded", "1");
    } catch {
      root.innerHTML = `<span class="text-xs text-stone-500">Nie udało się pobrać szczegółów.</span>`;
      root.setAttribute("data-loaded", "1");
    }
  });
}

function htmlListaOdjazdow(html: string): string {
  return `<ul class="mapa-wsi-popup-odjazdy-list">${html}</ul>`;
}

function podlaczOdjazdyDoPopupPoi(
  pin: import("leaflet").Marker,
  p: ZnacznikPoi,
): void {
  const kat = p.category.trim().toLowerCase();
  if (!KAT_TRANSPORT.has(kat)) return;

  pin.on("popupopen", async () => {
    const root = pin.getPopup()?.getElement()?.querySelector(`[data-poi-odjazdy="${p.id}"]`);
    if (!root || root.getAttribute("data-loaded") === "1") return;

    try {
      const res = await fetch(`/api/mapa/poi/${encodeURIComponent(p.id)}/odjazdy`);
      if (!res.ok) {
        root.innerHTML = `<span class="text-xs text-stone-500">Brak danych rozkładu (odśwież transport w panelu sołtysa).</span>`;
        root.setAttribute("data-loaded", "1");
        return;
      }
      const json = (await res.json()) as {
        typ?: string;
        maReczny?: boolean;
        notatka?: string | null;
        linkPdf?: string | null;
        odjazdy?: {
          czas: string;
          linia: string;
          cel: string | null;
          peron?: string | null;
          anulowany?: boolean;
          zrodlo?: string;
          przyjazd?: string | null;
          przez?: string | null;
          opis?: string | null;
        }[];
      };
      const lista = json.odjazdy ?? [];
      if (lista.length === 0 && !json.notatka) {
        root.innerHTML = `<span class="text-xs text-stone-500">Brak rozkładu — sołtys może dodać godziny w panelu Moja wieś.</span>`;
      } else {
        const items = lista
          .map((o) => {
            const cel = o.cel ? ` → ${escapeHtml(o.cel)}` : "";
            const peron = o.peron ? ` · peron ${escapeHtml(o.peron)}` : "";
            const anul = o.anulowany ? " <em>(odwołany)</em>" : "";
            const przyj = o.przyjazd ? ` · przyj. ${escapeHtml(o.przyjazd)}` : "";
            const przez = o.przez ? ` · przez ${escapeHtml(o.przez)}` : "";
            const zrodlo =
              o.zrodlo === "soltys" ? ' <span class="text-sky-800">· sołtys</span>' : "";
            return `<li><strong>${escapeHtml(o.czas)}</strong>${przyj} ${escapeHtml(o.linia)}${cel}${przez}${peron}${anul}${zrodlo}</li>`;
          })
          .join("");
        const notatka = json.notatka
          ? `<p class="text-xs text-stone-600 mt-1">${escapeHtml(json.notatka)}</p>`
          : "";
        const pdf = json.linkPdf
          ? `<p class="text-xs mt-1"><a href="${escapeHtml(json.linkPdf)}" target="_blank" rel="noopener" class="text-green-800 underline">PDF rozkładu ↗</a></p>`
          : "";
        const naglowek =
          json.typ === "kolej"
            ? "Najbliższe pociągi"
            : json.maReczny
              ? "Autobusy (rozkład sołtysa + cache)"
              : "Najbliższe autobusy";
        root.innerHTML = `<p class="text-xs font-medium text-stone-700">${naglowek}</p>${notatka}${lista.length ? htmlListaOdjazdow(items) : ""}${pdf}`;
      }
      root.setAttribute("data-loaded", "1");
    } catch {
      root.innerHTML = `<span class="text-xs text-stone-500">Nie udało się pobrać odjazdów.</span>`;
      root.setAttribute("data-loaded", "1");
    }
  });
}

function htmlPopupPoi(z: ZnacznikPoi): string {
  const kat = etykietaKategoriiPoi(z.category);
  const opis = z.description?.trim();
  const osm = `https://www.openstreetmap.org/?mlat=${encodeURIComponent(String(z.lat))}&mlon=${encodeURIComponent(String(z.lon))}&zoom=17`;
  const katNorm = z.category.trim().toLowerCase();
  const slotOdjazdy =
    KAT_TRANSPORT.has(katNorm)
      ? `<div class="mapa-wsi-popup-odjazdy" data-poi-odjazdy="${escapeHtml(z.id)}"><span class="text-xs text-stone-500">Ładowanie odjazdów…</span></div>`
      : "";
  const slotSzczegoly =
    katNorm === KAT_SWIETLICA || KAT_KONTAKT.has(katNorm) || z.linkedEntityId
      ? `<div class="mapa-wsi-popup-szczegoly" data-poi-szczegoly="${escapeHtml(z.id)}"><span class="text-xs text-stone-500">Ładowanie szczegółów…</span></div>`
      : "";
  const kontaktHtml = htmlKontaktPoi(z);
  const czyOspWoda = katNorm === "osp_punkt_czerpania_wody";
  const czyCmentarz = katNorm === "cmentarz";
  const czyStacja = katNorm === "stacja_kolejowa";
  const czyPrzystanek = katNorm === "przystanek";
  const czyLatarnia = katNorm === KATEGORIA_LATARNIA;
  const czyInwestycja = katNorm === KATEGORIA_INWESTYCJA;
  const statusInv = czyInwestycja ? normalizujStatusInwestycji(z.investmentStatus) : null;
  const etykietaStatusu = statusInv ? etykietaStatusuInwestycji(statusInv) : null;
  const terminInv = formatujTerminInwestycji(z.plannedCompletionAt);
  const docUrl = bezpiecznyUrlDokumentu(z.documentUrl);
  const badgeStatus =
    czyInwestycja && etykietaStatusu
      ? `<p class="mapa-wsi-popup-inwestycja-status" style="border-color:${escapeHtml(KOLOR_STATUSU_INWESTYCJI[statusInv!])}"><strong>${escapeHtml(etykietaStatusu)}</strong>${terminInv ? ` · plan: ${escapeHtml(terminInv)}` : ""}</p>`
      : "";
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
  const czyHistoria = katNorm === "historia_wydarzenie";
  const historiaId = czyHistoria && z.id.startsWith("hist-") ? z.id.slice(5) : null;
  const linkHistorii =
    czyHistoria && historiaId
      ? `${z.sciezkaWsi.replace(/"/g, "")}/historia/${encodeURIComponent(historiaId)}`
      : null;
  const stronaMiejsca = czyHistoria ? (linkHistorii ?? z.sciezkaWsi) : `/mapa/miejsce/${encodeURIComponent(z.id)}`;
  const miniatura = z.photoUrl
    ? `<p class="mapa-wsi-popup-foto"><img src="${escapeHtml(z.photoUrl)}" alt="" width="220" height="124" style="width:100%;max-width:220px;height:auto;border-radius:8px;object-fit:cover" loading="lazy" /></p>`
    : "";
  return `
    <div class="mapa-wsi-popup">
      <p class="mapa-wsi-popup-meta">${escapeHtml(kat)}${z.villageName ? ` · ${escapeHtml(z.villageName)}` : ""}</p>
      <h3>${escapeHtml(z.name)}</h3>
      ${badgeStatus}
      ${miniatura}
      ${opis ? `<p>${escapeHtml(opis)}</p>` : ""}
      ${kontaktHtml}
      ${z.photoCaption ? `<p class="text-xs">${escapeHtml(z.photoCaption)}</p>` : ""}
      ${slotOdjazdy}
      ${slotSzczegoly}
      ${
        czyLatarnia
          ? `<p class="text-xs text-stone-600">Punkt oświetlenia drogowego. Nie świeci? <a href="/panel/mieszkaniec/zgloszenia?category=oswietlenie&villageId=${encodeURIComponent(z.villageId)}&title=${encodeURIComponent("Uszkodzona latarnia")}&location=${encodeURIComponent(`${z.villageName}: ${z.name}`)}">Zgłoś sołtysowi →</a></p>`
          : ""
      }
      ${
        czyInwestycja
          ? `<p class="text-xs text-stone-600">${statusInv === "planowana" ? "Tu planowana jest inwestycja lub budowa." : statusInv === "w_budowie" ? "Trwają prace budowlane w tym miejscu." : "Informacja o rozwoju wsi — szczegóły u sołtysa lub w dokumentacji gminy."}${docUrl ? ` <a href="${escapeHtml(docUrl)}" target="_blank" rel="noopener noreferrer">Dokument / uchwała ↗</a>` : ""}</p>`
          : ""
      }
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
        ${
          czyHistoria && linkHistorii
            ? `<a href="${linkHistorii}">Czytaj kronikę →</a><span aria-hidden="true"> · </span>`
            : `<a href="${stronaMiejsca}">Zdjęcie i komentarze →</a><span aria-hidden="true"> · </span>`
        }
        <a href="${z.sciezkaWsi.replace(/"/g, "")}">Strona wsi</a>
        ${katNorm === "szkola" || katNorm === "przedszkole" ? `<span aria-hidden="true"> · </span><a href="${z.sciezkaWsi.replace(/"/g, "")}#sekcja-szkola">Tablica szkoły</a>` : ""}
        <span aria-hidden="true"> · </span>
        <a href="/mapa?poi=${encodeURIComponent(z.id)}">Na mapie</a>
        <span aria-hidden="true"> · </span>
        <a href="${osm}" target="_blank" rel="noopener noreferrer">OSM ↗</a>
        ${czyStacja ? `<span aria-hidden="true"> · </span><a href="${stacjaLink}">Rozkład PKP 🚆</a>` : ""}
        ${czyCmentarz && z.linkPlanuCmentarza ? `<span aria-hidden="true"> · </span><a href="${z.linkPlanuCmentarza.replace(/"/g, "")}">Plan cmentarza 🗺</a>` : ""}
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
    punktyRynekDzialki?: ZnacznikRynekDzialka[];
    punktyZgloszenia?: ZnacznikZgloszenie[];
    punktyPolowania?: ZnacznikPolowanie[];
    punktyCmentarze?: ZnacznikCmentarzObrys[];
    punktyGeoKontekst?: ZnacznikGeoKontekst[];
    obrysyLanduse?: ObrysLanduseMapy[];
    pokazLanduse?: boolean;
    punktyAdresy?: ZnacznikAdres[];
    /** Obrysy wszystkich wsi w wybranej gminie (pomarańczowy kontur). */
    obrysyGminy?: ZnacznikWsi[];
    pozycjaUzytkownika?: { lat: number; lon: number } | null;
    promienKm?: number | null;
    pokazGranice?: boolean;
    /** Warstwa EGiB (obręby + działki) z Geoportalu — domyślnie włączona. */
    pokazEgib?: boolean;
    pokazPoi?: boolean;
    pokazRynek?: boolean;
    wysokoscMapy?: "pelna" | "kompakt";
  }
>(function MapaWsiLeaflet(
  {
    znaczniki,
    punktyPoi = [],
    punktyRynek = [],
    punktyRynekDzialki = [],
    punktyZgloszenia = [],
    punktyPolowania = [],
    punktyCmentarze = [],
    punktyGeoKontekst = [],
    obrysyLanduse = [],
    pokazLanduse = false,
    punktyAdresy = [],
    obrysyGminy = [],
    pozycjaUzytkownika = null,
    promienKm = null,
    pokazGranice = true,
    pokazEgib = true,
    pokazPoi = true,
    pokazRynek = true,
    wysokoscMapy = "pelna",
  },
  ref,
) {
    const refMapa = useRef<HTMLDivElement>(null);
    const refShell = useRef<HTMLDivElement>(null);
    const instancja = useRef<InstancjaLeaflet | null>(null);
    const leafletRef = useRef<LeafletNs | null>(null);
    const pozycjaRef = useRef(pozycjaUzytkownika);
    pozycjaRef.current = pozycjaUzytkownika;
    const [rodzajPodkladu, setRodzajPodkladu] = useState<RodzajPodkladuMapy>("mapa");
    const [pokazGraniceStan, setPokazGraniceStan] = useState(pokazGranice);
    const [pokazEgibStan, setPokazEgibStan] = useState(() => pokazEgib && wczytajZapisanyEgib());
    const [zoomMapy, setZoomMapy] = useState(7);
    const [pokazPoiStan, setPokazPoiStan] = useState(pokazPoi);
    const [pokazRynekStan, setPokazRynekStan] = useState(pokazRynek);
    const [pokazAdresyStan, setPokazAdresyStan] = useState(false);
    const [pokazGeoKontekstStan, setPokazGeoKontekstStan] = useState(false);
    const [pelnyEkran, setPelnyEkran] = useState(false);
    const znacznikiRef = useRef(znaczniki);
    znacznikiRef.current = znaczniki;
    const punktyPoiRef = useRef(punktyPoi);
    punktyPoiRef.current = punktyPoi;
    const punktyRynekRef = useRef(punktyRynek);
    punktyRynekRef.current = punktyRynek;
    const punktyRynekDzialkiRef = useRef(punktyRynekDzialki);
    punktyRynekDzialkiRef.current = punktyRynekDzialki;
    const punktyZgloszeniaRef = useRef(punktyZgloszenia);
    punktyZgloszeniaRef.current = punktyZgloszenia;
    const punktyPolowaniaRef = useRef(punktyPolowania);
    punktyPolowaniaRef.current = punktyPolowania;
    const punktyCmentarzeRef = useRef(punktyCmentarze);
    punktyCmentarzeRef.current = punktyCmentarze;
    const punktyGeoKontekstRef = useRef(punktyGeoKontekst);
    punktyGeoKontekstRef.current = punktyGeoKontekst;
    const obrysyLanduseRef = useRef(obrysyLanduse);
    obrysyLanduseRef.current = obrysyLanduse;
    const pokazLanduseRef = useRef(pokazLanduse);
    pokazLanduseRef.current = pokazLanduse;
    const punktyAdresyRef = useRef(punktyAdresy);
    punktyAdresyRef.current = punktyAdresy;
    const obrysyGminyRef = useRef(obrysyGminy);
    obrysyGminyRef.current = obrysyGminy;
    const pokazGraniceRef = useRef(pokazGraniceStan);
    pokazGraniceRef.current = pokazGraniceStan;
    const pokazEgibRef = useRef(pokazEgibStan);
    pokazEgibRef.current = pokazEgibStan;
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
          punktyPolowania,
          pokazRynekStan ? punktyRynekDzialki : [],
          punktyCmentarze,
        ),
      [znaczniki, punktyPoi, punktyRynek, punktyRynekDzialki, punktyPolowania, punktyCmentarze, pokazPoiStan, pokazRynekStan],
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
      pokazPolowanie(idPolowania: string) {
        const inst = instancja.current;
        if (!inst) return false;
        const warstwa = inst.polowaniaById.get(idPolowania);
        if (!warstwa) return false;
        const w = warstwa as import("leaflet").Layer & {
          getBounds?: () => import("leaflet").LatLngBounds;
          openPopup?: () => void;
        };
        const bounds = w.getBounds?.();
        if (bounds?.isValid()) {
          inst.map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15, animate: true });
        } else {
          const pol = punktyPolowaniaRef.current.find((p) => p.id === idPolowania);
          if (pol) inst.map.setView([pol.lat, pol.lon], 14);
        }
        w.openPopup?.();
        return true;
      },
      pokazPoi(idPoi: string) {
        const inst = instancja.current;
        if (!inst) return false;
        const marker = inst.poiMarkersById.get(idPoi);
        if (!marker) return false;
        const cluster = inst.cluster as import("leaflet").MarkerClusterGroup;
        if (typeof cluster.zoomToShowLayer === "function") {
          cluster.zoomToShowLayer(marker, () => marker.openPopup());
        } else {
          inst.map.setView(marker.getLatLng(), Math.max(inst.map.getZoom(), 15));
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

        const podkladMapa = L.tileLayer(URL_PODKLAD_MAPA, {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        });
        const podkladSatelita = L.tileLayer(URL_PODKLAD_SATELITA, {
          attribution:
            'Zdjęcia &copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics',
          maxZoom: 19,
        });
        const podkladEtykietySatelita = L.tileLayer(URL_PODKLAD_ETYKIETY, {
          attribution: 'Etykiety &copy; <a href="https://www.esri.com/">Esri</a>',
          maxZoom: 19,
          pane: "overlayPane",
          opacity: 0.88,
        });
        const geoportalWmsLayer = CZY_GEO_WMS_DOSTEPNY
          ? L.tileLayer.wms(GEO_WMS_URL, {
              layers: GEO_WMS_LAYERS,
              format: "image/png",
              transparent: false,
              version: "1.3.0",
              opacity: 1,
            })
          : null;
        const egibWmsLayer = CZY_KIEG_WMS_DOSTEPNY
          ? L.tileLayer.wms(KIEG_WMS_URL, {
              ...opcjeWarstwyKiegWms(),
              attribution:
                'Granice EGiB &copy; <a href="https://www.geoportal.gov.pl/">GUGiK</a>',
            })
          : null;

        const podkladStart = wczytajZapisanyPodklad();

        leafletRef.current = L;
        const ikona = zbudujIkone(L);

        const cluster = L.markerClusterGroup({
          showCoverageOnHover: false,
          maxClusterRadius: 56,
          spiderfyOnMaxZoom: true,
          disableClusteringAtZoom: 16,
        });

        const boundaryGroup = L.layerGroup().addTo(map);
        const adresyGroup = L.layerGroup();
        const geoKontekstGroup = L.layerGroup();
        const landuseGroup = L.layerGroup();
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

        const onZoom = () => {
          setZoomMapy(map.getZoom());
        };
        map.on("zoomend", onZoom);
        setZoomMapy(map.getZoom());

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
          podkladMapa,
          podkladSatelita,
          podkladEtykietySatelita,
          geoportalWmsLayer,
          egibWmsLayer,
          adresyGroup,
          geoKontekstGroup,
          landuseGroup,
          markersById: new Map(),
          polowaniaById: new Map(),
          rynekDzialkiById: new Map(),
          poiMarkersById: new Map(),
          resizeHandler,
          wheelHandlers: { enter, leave },
        };
        ustawPodkladMapy(instancja.current, podkladStart);
        ustawWarstweEgib(instancja.current, pokazEgibRef.current);
        setRodzajPodkladu(podkladStart);

        const z0 = znacznikiRef.current;
        const p0 = pokazPoiRef.current ? punktyPoiRef.current : [];
        const r0 = pokazRynekRef.current ? punktyRynekRef.current : [];
        const rd0 = pokazRynekRef.current ? punktyRynekDzialkiRef.current : [];
        const bb0 = bboxDlaPunktowMapy(z0, p0, r0, punktyPolowaniaRef.current, rd0, punktyCmentarzeRef.current);
        syncWarstwy(
          L,
          instancja.current,
          z0,
          p0,
          r0,
          rd0,
          punktyZgloszeniaRef.current,
          punktyPolowaniaRef.current,
          obrysyGminyRef.current,
          punktyCmentarzeRef.current,
          ikona,
          bb0,
          { pokazGranice: pokazGraniceRef.current, pokazEgib: pokazEgibRef.current },
        );
        syncWarstwaUzytkownika(L, instancja.current, pozycjaRef.current, promienRef.current);
      })();

      return () => {
        cancelled = true;
        const inst = instancja.current;
        if (inst) {
          inst.map.off("zoomend");
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
        pokazRynekStan ? punktyRynekDzialki : [],
        punktyZgloszenia,
        punktyPolowania,
        obrysyGminy,
        punktyCmentarze,
        ikona,
        bboxPoczatkowy,
        { pokazGranice: pokazGraniceStan, pokazEgib: pokazEgibStan },
      );
    }, [
      znaczniki,
      punktyPoi,
      punktyRynek,
      punktyRynekDzialki,
      punktyZgloszenia,
      punktyPolowania,
      punktyCmentarze,
      obrysyGminy,
      bboxPoczatkowy,
      pokazGraniceStan,
      pokazEgibStan,
      zoomMapy,
      pokazPoiStan,
      pokazRynekStan,
    ]);

    useEffect(() => {
      const inst = instancja.current;
      const L = leafletRef.current;
      if (!inst || !L) return;
      syncWarstwaAdresow(L, inst, pokazAdresyStan ? punktyAdresyRef.current : []);
    }, [pokazAdresyStan, punktyAdresy]);

    useEffect(() => {
      const inst = instancja.current;
      const L = leafletRef.current;
      if (!inst || !L) return;
      syncWarstwaGeoKontekst(L, inst, pokazGeoKontekstStan ? punktyGeoKontekstRef.current : []);
    }, [pokazGeoKontekstStan, punktyGeoKontekst]);

    useEffect(() => {
      const inst = instancja.current;
      const L = leafletRef.current;
      if (!inst || !L) return;
      syncWarstwaLanduse(L, inst, pokazLanduse ? obrysyLanduse : []);
    }, [pokazLanduse, obrysyLanduse]);

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
      const inst = instancja.current;
      if (!inst) return;
      ustawWarstweEgib(inst, pokazEgibStan);
      try {
        window.sessionStorage.setItem(KLUCZ_EGIB_STORAGE, pokazEgibStan ? "1" : "0");
      } catch {
        /* ignore */
      }
    }, [pokazEgibStan]);

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
      if (!inst) return;
      ustawPodkladMapy(inst, rodzajPodkladu);
      try {
        window.sessionStorage.setItem(KLUCZ_PODKLADU_STORAGE, rodzajPodkladu);
      } catch {
        /* ignore */
      }
    }, [rodzajPodkladu]);

    return (
      <div
        ref={refShell}
        className={`mapa-wsi-map-shell relative w-full min-h-[320px] bg-stone-100 ${
          pelnyEkran
            ? "h-[100dvh] max-h-[100dvh]"
            : wysokoscMapy === "kompakt"
              ? "h-[min(420px,55dvh)]"
              : "h-[min(72dvh,560px)] md:h-[min(78dvh,640px)]"
        }`}
      >
        <div
          ref={refMapa}
          className="z-0 h-full w-full rounded-xl border border-stone-200/80 bg-stone-100 shadow-inner ring-1 ring-green-950/5 transition-shadow duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700/40"
          role="application"
          aria-label="Mapa interaktywna — wsie naszawies.pl"
          tabIndex={0}
        />
        <div className="absolute right-3 top-3 z-[410] flex max-w-[min(100%,240px)] flex-col items-end gap-1.5">
          <div
            className="flex flex-wrap justify-end gap-0.5 rounded-lg border border-stone-200/80 bg-white/95 p-0.5 shadow-sm backdrop-blur"
            role="group"
            aria-label="Rodzaj podkładu mapy"
          >
            <button
              type="button"
              onClick={() => setRodzajPodkladu("mapa")}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                rodzajPodkladu === "mapa"
                  ? "bg-green-800 text-white shadow-sm"
                  : "text-stone-600 hover:bg-stone-100"
              }`}
              aria-pressed={rodzajPodkladu === "mapa"}
            >
              Mapa
            </button>
            <button
              type="button"
              onClick={() => setRodzajPodkladu("satelita")}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                rodzajPodkladu === "satelita"
                  ? "bg-green-800 text-white shadow-sm"
                  : "text-stone-600 hover:bg-stone-100"
              }`}
              aria-pressed={rodzajPodkladu === "satelita"}
            >
              Satelita
            </button>
            {CZY_GEO_WMS_DOSTEPNY ? (
              <button
                type="button"
                onClick={() => setRodzajPodkladu("ortofoto")}
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  rodzajPodkladu === "ortofoto"
                    ? "bg-green-800 text-white shadow-sm"
                    : "text-stone-600 hover:bg-stone-100"
                }`}
                aria-pressed={rodzajPodkladu === "ortofoto"}
                title="Ortofotomapa Geoportal (Polska)"
              >
                Ortofoto
              </button>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setPokazEgibStan((v) => !v)}
            className="rounded-lg border border-fuchsia-200/90 bg-fuchsia-50/95 px-3 py-1.5 text-[11px] font-medium text-fuchsia-950 shadow-sm backdrop-blur hover:bg-fuchsia-100"
            title="Granice obrębów i działek z EGiB (Geoportal GUGiK) — widoczne od zoomu 11"
          >
            {pokazEgibStan ? "Ukryj granice EGiB" : "Pokaż granice EGiB"}
          </button>
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
          {punktyAdresy.length > 0 ? (
            <button
              type="button"
              onClick={() => setPokazAdresyStan((v) => !v)}
              className="rounded-lg border border-sky-200/80 bg-sky-50/90 px-3 py-1.5 text-[11px] font-medium text-sky-950 shadow-sm backdrop-blur hover:bg-sky-100"
            >
              {pokazAdresyStan ? "Ukryj adresy KIN" : `Adresy KIN (${punktyAdresy.length})`}
            </button>
          ) : null}
          {punktyGeoKontekst.length > 0 ? (
            <button
              type="button"
              onClick={() => setPokazGeoKontekstStan((v) => !v)}
              className="rounded-lg border border-teal-200/80 bg-teal-50/90 px-3 py-1.5 text-[11px] font-medium text-teal-950 shadow-sm backdrop-blur hover:bg-teal-100"
            >
              {pokazGeoKontekstStan ? "Ukryj PRNG / PRG" : `PRNG / instytucje (${punktyGeoKontekst.length})`}
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
              <span className="font-medium text-fuchsia-800">Magenta + zielone linie</span> — granice
              obrębów i działek EGiB (Geoportal), włącz od zoomu 11
            </li>
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
              <span className="font-medium text-amber-600">Mała pinezka 💡</span> — latarnie / oświetlenie drogi
              (warstwa opcjonalna)
            </li>
            <li>
              <span className="font-medium text-stone-800">Kolorowa pinezka (emoji)</span> — miejsca w sołectwie: kościół,
              szkoła, świetlica, OSP…
            </li>
            <li>
              <span className="font-medium text-amber-700">✨ pulsująca pinezka</span> — ładne miejsce ze zdjęciem (komentarze
              pod stroną miejsca)
            </li>
            <li>
              <span className="font-medium text-[#2563eb]">Niebieski punkt</span> — Twoja lokalizacja (gdy włączysz GPS)
            </li>
            <li>
              <span className="font-medium text-orange-700">Pomarańczowa pinezka 🏷️</span> — ogłoszenie z rynku lokalnego
            </li>
            <li>
              <span className="font-medium text-amber-800">Obrys działki</span> — nieruchomość z Geoportalu (rynek)
            </li>
            <li>
              <span className="font-medium text-stone-800">Kółko z liczbą</span> — kilka punktów w obszarze
            </li>
            <li>
              <span className="font-medium text-teal-700">Turkusowy punkt</span> — nazwy geograficzne (PRNG) i instytucje PRG
              (OSP, policja, nadleśnictwo…)
            </li>
            <li>
              <span className="font-medium text-sky-700">Niebieski punkt (mały)</span> — adres urzędowy KIN (Geoportal)
            </li>
            <li>
              <span className="font-medium text-stone-800">Mapa / Satelita / Ortofoto</span> — przełącznik podkładu (prawy górny róg)
            </li>
          </ul>
        </div>
        <p className="mapa-wsi-podpowiedz-wow pointer-events-none absolute bottom-2 left-1/2 z-[400] w-[min(100%,340px)] -translate-x-1/2 rounded-lg border border-green-900/10 bg-gradient-to-r from-white/95 via-emerald-50/90 to-white/95 px-3 py-1.5 text-center text-[10px] font-medium text-stone-600 shadow-md backdrop-blur-sm">
          {pokazEgibStan && zoomMapy < KIEG_WMS_MIN_ZOOM
            ? `Przybliż mapę (zoom ${KIEG_WMS_MIN_ZOOM}+), aby zobaczyć granice obrębów i działek jak na Geoportalu.`
            : "Zoom kółkiem działa, gdy kursor jest nad mapą — nie przewijasz wtedy strony."}
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

function syncWarstwaAdresow(
  L: LeafletNs,
  inst: InstancjaLeaflet,
  punktyAdresy: ZnacznikAdres[],
) {
  const { map, adresyGroup } = inst;
  adresyGroup.clearLayers();
  if (punktyAdresy.length === 0) {
    if (map.hasLayer(adresyGroup)) map.removeLayer(adresyGroup);
    return;
  }
  if (!map.hasLayer(adresyGroup)) adresyGroup.addTo(map);
  for (const a of punktyAdresy) {
    const ulica = a.streetName ? `${a.streetName} ` : "";
    const pin = L.circleMarker([a.lat, a.lon], {
      radius: 4,
      color: "#0369a1",
      weight: 1,
      fillColor: "#7dd3fc",
      fillOpacity: 0.75,
    });
    pin.bindPopup(
      `<div class="mapa-wsi-popup"><p class="mapa-wsi-popup-meta">Adres urzędowy (KIN)</p><strong>${escapeHtml(ulica + a.houseNumber)}</strong><br/><span class="text-xs">${escapeHtml(a.villageName)}</span></div>`,
    );
    adresyGroup.addLayer(pin);
  }
}

function syncWarstwaGeoKontekst(L: LeafletNs, inst: InstancjaLeaflet, punkty: ZnacznikGeoKontekst[]) {
  const { map, geoKontekstGroup } = inst;
  geoKontekstGroup.clearLayers();
  if (punkty.length === 0) {
    if (map.hasLayer(geoKontekstGroup)) map.removeLayer(geoKontekstGroup);
    return;
  }
  if (!map.hasLayer(geoKontekstGroup)) geoKontekstGroup.addTo(map);
  for (const g of punkty) {
    const kolor = g.dataset === "PRNG" ? "#0d9488" : "#6366f1";
    const pin = L.circleMarker([g.lat, g.lon], {
      radius: g.dataset === "PRNG" ? 5 : 6,
      color: kolor,
      weight: 1.5,
      fillColor: g.dataset === "PRNG" ? "#99f6e4" : "#c7d2fe",
      fillOpacity: 0.85,
    });
    const profil = g.sciezkaWsi.replace(/"/g, "");
    const rodzaj = g.rodzaj ? `<p class="text-xs text-stone-600">${escapeHtml(g.rodzaj)}</p>` : "";
    pin.bindPopup(
      `<div class="mapa-wsi-popup">
        <p class="mapa-wsi-popup-meta">${escapeHtml(g.layerLabel)} · Geoportal</p>
        <h3>${escapeHtml(g.name)}</h3>
        ${rodzaj}
        <p class="text-xs text-stone-500">${escapeHtml(g.villageName)}</p>
        <p class="mapa-wsi-popup-foot"><a href="${profil}">Profil wsi →</a></p>
      </div>`,
    );
    geoKontekstGroup.addLayer(pin);
  }
}

function syncWarstwaLanduse(L: LeafletNs, inst: InstancjaLeaflet, obrysy: ObrysLanduseMapy[]) {
  const { map, landuseGroup } = inst;
  landuseGroup.clearLayers();
  if (obrysy.length === 0) {
    if (map.hasLayer(landuseGroup)) map.removeLayer(landuseGroup);
    return;
  }
  if (!map.hasLayer(landuseGroup)) landuseGroup.addTo(map);
  for (const o of obrysy) {
    const styl = stylLanduseOsm(o.landuse);
    try {
      const warstwa = L.geoJSON(o.geojson as GeoJSON.GeoJsonObject, {
        interactive: true,
        style: {
          color: styl.color,
          weight: 1.5,
          fillColor: styl.fillColor,
          fillOpacity: styl.fillOpacity,
          opacity: 0.85,
        },
      });
      const etykieta = etykietaLanduseOsm(o.landuse);
      const tytul = o.name ? escapeHtml(o.name) : etykieta;
      warstwa.bindPopup(
        `<div class="mapa-wsi-popup">
          <p class="mapa-wsi-popup-meta">Zagospodarowanie · OSM</p>
          <h3>${tytul}</h3>
          <p class="text-xs text-stone-600">${escapeHtml(etykieta)}</p>
          <p class="text-[11px] text-stone-500 mt-1">Orientacyjnie — nie zastępuje MPZP gminy.</p>
        </div>`,
      );
      landuseGroup.addLayer(warstwa);
    } catch {
      /* pomijamy uszkodzoną geometrię */
    }
  }
}

function htmlPopupCmentarzObrys(z: ZnacznikCmentarzObrys): string {
  const profil = z.sciezkaWsi.replace(/"/g, "");
  const plan = z.hrefPlan.replace(/"/g, "");
  return `<div class="mapa-wsi-popup">
    <p class="mapa-wsi-popup-meta">Cmentarz · obrys z OSM</p>
    <h3>${escapeHtml(z.name)}</h3>
    <p class="text-xs text-stone-600">${escapeHtml(z.villageName)} — kwatery, rzędy, wyszukiwarka grobów</p>
    <p class="mapa-wsi-popup-foot">
      <a href="${plan}">Plan cmentarza →</a>
      <span aria-hidden="true"> · </span>
      <a href="${profil}">Profil wsi</a>
    </p>
  </div>`;
}

function syncWarstwy(
  L: LeafletNs,
  inst: InstancjaLeaflet,
  znaczniki: ZnacznikWsi[],
  punktyPoi: ZnacznikPoi[],
  punktyRynek: ZnacznikRynek[],
  punktyRynekDzialki: ZnacznikRynekDzialka[],
  punktyZgloszenia: ZnacznikZgloszenie[],
  punktyPolowania: ZnacznikPolowanie[],
  obrysyGminy: ZnacznikWsi[],
  punktyCmentarze: ZnacznikCmentarzObrys[],
  ikona: import("leaflet").DivIcon,
  bbox: [[number, number], [number, number]] | null,
  opts?: { pokazGranice?: boolean; pokazEgib?: boolean },
) {
  const pokazGranice = opts?.pokazGranice !== false;
  const pokazEgib = opts?.pokazEgib !== false;
  const egibWidoczny = pokazEgib && czyKiegWidocznyNaZoomie(inst.map.getZoom());
  const { map, cluster, boundaryGroup, markersById, polowaniaById, rynekDzialkiById, poiMarkersById } = inst;
  ustawPaneWarstwicyGranicy(map);

  (cluster as import("leaflet").LayerGroup).clearLayers();
  boundaryGroup.clearLayers();
  markersById.clear();
  polowaniaById.clear();
  rynekDzialkiById.clear();
  poiMarkersById.clear();

  for (const z of obrysyGminy) {
    const gj = granicaJakoGeoJson(z.boundary_geojson);
    if (!gj) continue;
    try {
      const warstwa = L.geoJSON(gj, {
        pane: PANE_GRANICE,
        interactive: false,
        style: {
          color: "#b45309",
          weight: 3,
          fillColor: "#f59e0b",
          fillOpacity: 0.08,
          opacity: 0.85,
          dashArray: "6 4",
        },
      } as import("leaflet").GeoJSONOptions);
      boundaryGroup.addLayer(warstwa);
    } catch {
      /* ignore */
    }
  }

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
    if (pokazGranice && !mamyPrawdziwaGranice && !egibWidoczny) {
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
      podlaczInterakcjeDoPopupPoi(pin, p);
    (cluster as import("leaflet").LayerGroup).addLayer(pin);
    poiMarkersById.set(p.id, pin);
  }

  const ikonaRynek = zbudujIkoneRynek(L);
  const idsZDzialka = new Set(punktyRynekDzialki.map((d) => d.id));
  for (const r of punktyRynek) {
    if (idsZDzialka.has(r.id)) continue;
    const pin = L.marker([r.lat, r.lon], { icon: ikonaRynek, zIndexOffset: 500, title: r.title });
    pin.bindPopup(htmlPopupRynek(r));
    (cluster as import("leaflet").LayerGroup).addLayer(pin);
  }

  for (const d of punktyRynekDzialki) {
    const gj = granicaJakoGeoJson(d.parcelGeojson);
    if (!gj) continue;
    try {
      const warstwa = L.geoJSON(gj, {
        pane: PANE_GRANICE,
        interactive: true,
        style: {
          color: "#c2410c",
          weight: 3,
          fillColor: "#fb923c",
          fillOpacity: 0.35,
          opacity: 0.95,
        },
      } as import("leaflet").GeoJSONOptions);
      warstwa.bindPopup(htmlPopupRynekDzialka(d));
      boundaryGroup.addLayer(warstwa);
      rynekDzialkiById.set(d.id, warstwa);
    } catch {
      /* ignore */
    }
  }

  for (const cem of punktyCmentarze) {
    const gj = granicaJakoGeoJson(cem.boundaryGeojson);
    if (!gj) continue;
    try {
      const warstwa = L.geoJSON(gj, {
        pane: PANE_GRANICE,
        interactive: true,
        style: {
          color: "#44403c",
          weight: 2.5,
          fillColor: "#a8a29e",
          fillOpacity: 0.28,
          opacity: 0.9,
        },
      } as import("leaflet").GeoJSONOptions);
      warstwa.bindPopup(htmlPopupCmentarzObrys(cem));
      boundaryGroup.addLayer(warstwa);
    } catch {
      /* ignore */
    }
  }

  for (const zg of punktyZgloszenia) {
    const katZg = zg.category?.trim().toLowerCase() ?? "";
    const oswietlenie = katZg === "oswietlenie";
    const pin = L.circleMarker([zg.lat, zg.lon], {
      radius: oswietlenie ? 9 : 8,
      color: oswietlenie ? "#ca8a04" : "#b45309",
      weight: 2,
      fillColor: oswietlenie ? "#fde047" : "#f59e0b",
      fillOpacity: 0.9,
    });
    const etykietaKat = oswietlenie ? "Oświetlenie · " : "";
    const linkZgl =
      zg.villageId && zg.id
        ? `<br/><a href="/panel/mieszkaniec/zgloszenia">Szczegóły zgłoszenia →</a>`
        : "";
    pin.bindPopup(
      `<strong>${etykietaKat}Zgłoszenie</strong><br/>${escapeHtml(zg.title)}<br/><span class="text-xs">${escapeHtml(zg.villageName)} · ${escapeHtml(zg.status)}</span>${linkZgl}`,
    );
    (cluster as import("leaflet").LayerGroup).addLayer(pin);
  }

  const htmlPopupPolowanie = (pol: ZnacznikPolowanie) => {
    const fmt = new Intl.DateTimeFormat("pl-PL", { dateStyle: "short", timeStyle: "short" });
    const termin = `${fmt.format(new Date(pol.startsAt))} – ${fmt.format(new Date(pol.endsAt))}`;
    const profil = pol.villageSciezka.replace(/"/g, "");
    return `<div class="mapa-wsi-popup">
      <strong>Polowanie</strong><br/>${escapeHtml(pol.title)}<br/>${escapeHtml(pol.areaDescription)}<br/>
      <span class="text-xs">${escapeHtml(pol.villageName)} · ${escapeHtml(termin)}</span>
      <p class="mapa-wsi-popup-foot">
        <a href="${profil}">Profil wsi →</a>
        <span aria-hidden="true"> · </span>
        <a href="/mapa?polowanie=${encodeURIComponent(pol.id)}">Link do obszaru</a>
      </p>
    </div>`;
  };

  for (const pol of punktyPolowania) {
    const gj = granicaJakoGeoJson(pol.areaGeojson);
    if (gj) {
      try {
        const warstwa = L.geoJSON(gj, {
          pane: PANE_GRANICE,
          interactive: true,
          style: {
            color: "#991b1b",
            weight: 3,
            fillColor: "#dc2626",
            fillOpacity: 0.38,
            opacity: 0.95,
          },
        } as import("leaflet").GeoJSONOptions);
        warstwa.bindPopup(htmlPopupPolowanie(pol));
        boundaryGroup.addLayer(warstwa);
        polowaniaById.set(pol.id, warstwa);
        continue;
      } catch {
        /* fallback pinezka */
      }
    }
    const pin = L.circleMarker([pol.lat, pol.lon], {
      radius: 10,
      color: "#7f1d1d",
      weight: 2,
      fillColor: "#dc2626",
      fillOpacity: 0.35,
    });
    pin.bindPopup(htmlPopupPolowanie(pol));
    (cluster as import("leaflet").LayerGroup).addLayer(pin);
    polowaniaById.set(pol.id, pin);
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
