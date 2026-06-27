"use client";

import type { GeoJsonObject } from "geojson";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { podpisWarstwyPoi } from "@/lib/mapa/podpis-warstwy-poi";
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
import { granicaJakoGeoJson } from "@/lib/mapa/granica-geojson";
import { filtrujZnacznikiWBbox, type BboxMapy } from "@/lib/mapa/bbox-mapy";
import { tekstOdliczaniaPolowania, type FazaPolowaniaMapy } from "@/lib/mapa/formatuj-polowanie";
import {
  etykietaRodzajuOstrzezenia,
  ikonaRodzajuOstrzezenia,
} from "@/lib/lesnictwo/kategorie-ostrzezen";
import type { ZnacznikOstrzezeniaLesnego } from "@/lib/lesnictwo/pobierz-ostrzezenia-na-mape";
import { tekstPrecyzjiPoiMapy, czyKategoriaPoiLowiecka } from "@/lib/mapa/poi-lowieckie-widocznosc";
import {
  etykietaLinkuOrganizacjiDlaPoi,
  kotwicaProfiluWsiDlaKategoriiPoi,
} from "@/lib/mapa/powiazanie-poi-organizacja";
import { bezpiecznyHref } from "@/lib/tekst/bezpieczny-url";
import {
  CZY_KIEG_WMS_DOSTEPNY,
  KIEG_LAYER_DZIALKI,
  KIEG_LAYER_OBREBY,
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
  /** Ustawiane przez lekki RPC — obrys ładowany lazy przez /api/mapa/granice-wsi. */
  has_boundary?: boolean;
  public_offers_count: number;
  /** Do wyszukiwarki na mapie i opisu na liście */
  commune?: string;
  county?: string;
  voivodeship?: string;
  teryt_id?: string;
  /** Kod TERC gminy (7 cyfr) — do urzędowej granicy z PRG. */
  gmina_teryt_kod?: string;
  /** Kod TERC powiatu (4 cyfry). */
  powiat_teryt_kod?: string;
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
  /** Dokładna pinezka vs strefa orientacyjna (łowiectwo). */
  mapPrecision?: "dokladna" | "strefa";
  /** Promień kółka strefy na mapie (m). */
  strefaRadiusM?: number;
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

/** Granica nadleśnictwa LP z PRG U06. */
export type ObrysNadlesnictwaMapy = {
  id: string;
  name: string;
  geojson: GeoJsonObject;
};

/** Leśnictwo LP z BDL WFS. */
export type ObrysLesnictwaMapy = {
  id: string;
  name: string;
  nadlesnictwo: string | null;
  geojson: GeoJsonObject;
};

/** Obwód łowiecki (OpenForestData / PZŁ). */
export type ObrysObwoduLowieckiegoMapy = {
  id: string;
  name: string;
  numer: string | null;
  dzierzawca: string | null;
  typ: string | null;
  geojson: GeoJsonObject;
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

/** Ostrzeżenie polowania — obszar (GeoJSON) lub pinezka w centrum wsi. */
export type ZnacznikPolowanie = {
  id: string;
  title: string;
  areaDescription: string;
  startsAt: string;
  endsAt: string;
  lat: number;
  lon: number;
  villageId: string;
  villageName: string;
  villageSciezka: string;
  areaGeojson: unknown | null;
  faza: FazaPolowaniaMapy;
};

/** Rewir łowiecki z profilu koła (`profile_data.rewir_geojson`). */
export type ZnacznikRewirLowiecki = {
  id: string;
  groupId: string;
  name: string;
  villageId: string;
  villageName: string;
  sciezkaWsi: string;
  numerKola: string | null;
  geojson: GeoJsonObject;
};

/** Koło łowieckie z profilu wsi (pinezka przy wsi — orientacyjnie). */
export type ZnacznikKoloLowieckie = {
  id: string;
  name: string;
  villageId: string;
  villageName: string;
  sciezkaWsi: string;
  lat: number;
  lon: number;
  contactPhone: string | null;
  meetingPlace: string | null;
  numerKola: string | null;
  obszarSkrot: string | null;
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

export type { ZnacznikOstrzezeniaLesnego };

export type MapaWsiLeafletRef = {
  /** Przybliża mapę i otwiera popup dla wsi o podanym `id`. */
  pokazNaMapie: (idWsi: string) => boolean;
  /** Dopasowuje widok do wszystkich widocznych punktów na mapie. */
  przyblizDoWszystkich: () => boolean;
  /** Przybliża mapę do pozycji użytkownika (jeśli przekazano). */
  przyblizDoUzytkownika: () => boolean;
  /** Przybliża mapę do współrzędnych (np. ogłoszenie rynku). */
  pokazPunkt: (lat: number, lon: number, zoom?: number) => boolean;
  /** Przybliża mapę do obszaru aktywnego polowania. */
  pokazPolowanie: (idPolowania: string) => boolean;
  /** Przybliża mapę do ostrzeżenia leśnego. */
  pokazOstrzezenieLesne: (id: string) => boolean;
  pokazPoi: (idPoi: string) => boolean;
  ustawPodklad: (rodzaj: RodzajPodkladuMapy) => void;
  /** Po zmianie układu (hydratacja, panel) — odświeża rozmiar kafelków. */
  odswiezRozmiar: () => void;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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
/** Przezroczysty 1×1 px — Leaflet nie pokazuje „zepsutego” kafelka przy chwilowej awarii CDN. */
const KAFEL_BLEDU =
  "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

type InstancjaLeaflet = {
  map: import("leaflet").Map;
  cluster: import("leaflet").Layer;
  /** Osobna warstwa POI — nie jest czyszczona przy odświeżeniu granic wsi. */
  poiCluster: import("leaflet").Layer;
  boundaryGroup: import("leaflet").LayerGroup;
  /** Tylko obrysy wsi (PRG / szacunek) — odświeżane bez ruszania znaczników POI. */
  graniceWsiGroup: import("leaflet").LayerGroup;
  /** Strefy orientacyjne wokół POI (ambona, posterunek). */
  poiStrefyGroup: import("leaflet").LayerGroup;
  /** Rewiry, nadleśnictwa, działki, polowania — czyszczone przy sync warstw głównych. */
  inneObrysyGroup: import("leaflet").LayerGroup;
  userLayer: import("leaflet").LayerGroup;
  podkladMapa: import("leaflet").TileLayer;
  podkladSatelita: import("leaflet").TileLayer;
  podkladEtykietySatelita: import("leaflet").TileLayer;
  geoportalWmsLayer: import("leaflet").TileLayer.WMS | null;
  egibDzialkiWmsLayer: import("leaflet").TileLayer.WMS | null;
  egibObrebyWmsLayer: import("leaflet").TileLayer.WMS | null;
  adresyGroup: import("leaflet").LayerGroup;
  geoKontekstGroup: import("leaflet").LayerGroup;
  landuseGroup: import("leaflet").LayerGroup;
  markersById: Map<string, import("leaflet").Marker>;
  polowaniaById: Map<string, import("leaflet").Layer>;
  lesneById: Map<string, import("leaflet").Layer>;
  rynekDzialkiById: Map<string, import("leaflet").Layer>;
  poiMarkersById: Map<string, import("leaflet").Marker>;
  resizeHandler: () => void;
  wheelHandlers: { enter: () => void; leave: () => void };
  initInvalidateTimeoutId: ReturnType<typeof setTimeout> | null;
  /** Ostatni bbox, dla którego wykonano fitBounds — unika resetu widoku przy każdym zoomie. */
  ostatniFitBboxKlucz: string | null;
  /** Podpis listy POI — pomija pełną przebudowę klastra przy tej samej zawartości. */
  ostatniPodpisWarstwyPoi: string | null;
};

function czyMapaLeafletOperacyjna(map: import("leaflet").Map | null | undefined): map is import("leaflet").Map {
  if (!map) return false;
  const container = map.getContainer?.();
  if (!container?.isConnected) return false;
  const pane = (map as unknown as { _mapPane?: HTMLElement })._mapPane;
  return Boolean(pane?.isConnected);
}

function bezpieczneInvalidateSize(map: import("leaflet").Map): void {
  if (!czyMapaLeafletOperacyjna(map)) return;
  try {
    map.invalidateSize({ animate: false, pan: false });
  } catch {
    /* mapa w trakcie niszczenia lub przejścia zoomu */
  }
}

function czekajNaWymiaryKontenera(
  el: HTMLElement,
  signal: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    const gotowe = () => {
      const h = el.clientHeight;
      const w = el.clientWidth;
      return h >= 120 && w >= 120;
    };

    if (gotowe()) {
      resolve();
      return;
    }

    let raf = 0;
    let ro: ResizeObserver | null = null;
    const limit = window.setTimeout(() => {
      cleanup();
      resolve();
    }, 2500);

    const cleanup = () => {
      window.clearTimeout(limit);
      if (raf) window.cancelAnimationFrame(raf);
      ro?.disconnect();
      signal.removeEventListener("abort", onAbort);
    };

    const onAbort = () => {
      cleanup();
      reject(new DOMException("Aborted", "AbortError"));
    };

    const sprawdz = () => {
      if (signal.aborted) {
        onAbort();
        return;
      }
      if (gotowe()) {
        cleanup();
        resolve();
      } else {
        raf = window.requestAnimationFrame(sprawdz);
      }
    };

    signal.addEventListener("abort", onAbort);
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => sprawdz());
      ro.observe(el);
    }
    raf = window.requestAnimationFrame(sprawdz);
  });
}

function kluczBboxMapy(bbox: [[number, number], [number, number]] | null): string | null {
  if (!bbox) return null;
  const fmt = (n: number) => n.toFixed(5);
  return `${fmt(bbox[0][0])},${fmt(bbox[0][1])},${fmt(bbox[1][0])},${fmt(bbox[1][1])}`;
}

const GEO_WMS_URL = process.env.NEXT_PUBLIC_GEOPORTAL_WMS_URL?.trim() ?? "";
const GEO_WMS_LAYERS = process.env.NEXT_PUBLIC_GEOPORTAL_WMS_LAYERS?.trim() ?? "";
const CZY_GEO_WMS_DOSTEPNY = GEO_WMS_URL.length > 0 && GEO_WMS_LAYERS.length > 0;
const KLUCZ_EGIB_STORAGE = "naszawies-mapa-egib";
const KLUCZ_DZIALKI_STORAGE = "naszawies-mapa-dzialki";
const KLUCZ_OBREBY_STORAGE = "naszawies-mapa-obreby";
const KLUCZ_WARSTWY_STORAGE = "naszawies-mapa-warstwy";

type ZapisaneWarstwyMapy = {
  poi?: boolean;
  rynek?: boolean;
  adresy?: boolean;
  geo?: boolean;
};

function wczytajZapisaneWarstwy(): ZapisaneWarstwyMapy {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(KLUCZ_WARSTWY_STORAGE);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ZapisaneWarstwyMapy;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function zapiszWarstwyMapy(warstwy: ZapisaneWarstwyMapy): void {
  try {
    window.sessionStorage.setItem(KLUCZ_WARSTWY_STORAGE, JSON.stringify(warstwy));
  } catch {
    /* ignore */
  }
}

function wczytajZapisaneDzialki(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const v = window.sessionStorage.getItem(KLUCZ_DZIALKI_STORAGE);
    if (v === "0") return false;
    if (v === "1") return true;
    const legacy = window.sessionStorage.getItem(KLUCZ_EGIB_STORAGE);
    if (legacy === "0") return false;
    if (legacy === "1") return true;
  } catch {
    /* ignore */
  }
  return true;
}

function wczytajZapisaneObreby(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const v = window.sessionStorage.getItem(KLUCZ_OBREBY_STORAGE);
    if (v === "1") return true;
    if (v === "0") return false;
  } catch {
    /* ignore */
  }
  return false;
}

function ustawWarstwyKieg(inst: InstancjaLeaflet, opts: { dzialki: boolean; obreby: boolean }) {
  const pary: [import("leaflet").TileLayer.WMS | null, boolean][] = [
    [inst.egibDzialkiWmsLayer, opts.dzialki],
    [inst.egibObrebyWmsLayer, opts.obreby],
  ];
  for (const [warstwa, pokaz] of pary) {
    if (!warstwa) continue;
    const onMap = inst.map.hasLayer(warstwa);
    if (pokaz && !onMap) warstwa.addTo(inst.map);
    else if (!pokaz && onMap) inst.map.removeLayer(warstwa);
  }
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
  const jestLowiecki = czyKategoriaPoiLowiecka(kat);
  const rozmiar = jestLatarnia ? 22 : jestInwestycja ? 38 : jestLowiecki ? 32 : 36;
  const anchor = jestLatarnia ? 11 : jestInwestycja ? 19 : jestLowiecki ? 16 : 18;
  const fontSize = jestLatarnia ? "11px" : jestInwestycja ? "17px" : jestLowiecki ? "14px" : undefined;
  const kolorOstateczny =
    jestInwestycja && statusInv ? KOLOR_STATUSU_INWESTYCJI[statusInv] : kolor;
  const klasaLow = jestLowiecki ? " naszawies-marker-poi-lowiecki" : "";
  const html = `<div class="naszawies-marker-poi-inner${wow}${pulseInv}${klasaLow}${jestLatarnia ? " naszawies-marker-latarnia" : ""}${jestInwestycja ? " naszawies-marker-inwestycja" : ""}" style="border-color:${kolorOstateczny}${fontSize ? `;font-size:${fontSize}` : ""}">${escapeHtml(emoji)}</div>`;
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

function zbudujIkoneKolo(L: LeafletNs) {
  const html = `<div class="naszawies-marker-poi-inner naszawies-marker-kolo-lowieckie" style="border-color:#7c2d12;font-size:15px">🦌</div>`;
  return L.divIcon({
    className: "naszawies-leaflet-divicon",
    html,
    iconSize: [34, 34],
    iconAnchor: [17, 19],
    popupAnchor: [0, -18],
  });
}

function htmlPopupRewir(r: ZnacznikRewirLowiecki): string {
  const profil = r.sciezkaWsi.replace(/"/g, "");
  return `<div class="mapa-wsi-popup">
    <p class="mapa-wsi-popup-meta">Rewir łowiecki · ${escapeHtml(r.villageName)}</p>
    <h3>${escapeHtml(r.name)}</h3>
    ${r.numerKola ? `<p class="text-xs text-stone-600">Nr koła: ${escapeHtml(r.numerKola)}</p>` : ""}
    <p class="text-xs text-emerald-800">Obszar z profilu koła — orientacyjnie na mapie katalogu.</p>
    <p class="mapa-wsi-popup-foot"><a href="${profil}#sekcja-organizacje">Profil wsi →</a></p>
  </div>`;
}

function htmlPopupKolo(k: ZnacznikKoloLowieckie): string {
  const profil = k.sciezkaWsi.replace(/"/g, "");
  const meta = [k.numerKola ? `nr ${escapeHtml(k.numerKola)}` : "", k.meetingPlace ? escapeHtml(k.meetingPlace) : ""]
    .filter(Boolean)
    .join(" · ");
  return `<div class="mapa-wsi-popup">
    <p class="mapa-wsi-popup-meta">Koło łowieckie · ${escapeHtml(k.villageName)}</p>
    <h3>${escapeHtml(k.name)}</h3>
    ${meta ? `<p class="text-xs text-stone-600">${meta}</p>` : ""}
    ${k.obszarSkrot ? `<p class="text-xs text-stone-600">${escapeHtml(k.obszarSkrot)}${k.obszarSkrot.length >= 120 ? "…" : ""}</p>` : ""}
    ${k.contactPhone ? `<p class="text-xs">Tel. ${escapeHtml(k.contactPhone)}</p>` : ""}
    <p class="mapa-wsi-popup-foot"><a href="${profil}#sekcja-organizacje">Profil wsi →</a></p>
  </div>`;
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
        linkPkp?: string | null;
        utrudnienie?: string | null;
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
        const pkp =
          json.linkPkp
            ? `<p class="text-xs mt-1"><a href="${escapeHtml(json.linkPkp)}" target="_blank" rel="noopener" class="text-green-800 underline">Planuj na rozklad.pkp.pl ↗</a></p>`
            : "";
        const utrud =
          json.utrudnienie
            ? `<p class="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-1">${escapeHtml(json.utrudnienie)}</p>`
            : "";
        const naglowek =
          json.typ === "kolej"
            ? "Najbliższe pociągi (PKP live)"
            : json.maReczny
              ? "Autobusy (rozkład sołtysa + cache)"
              : "Najbliższe autobusy";
        root.innerHTML = `<p class="text-xs font-medium text-stone-700">${naglowek}</p>${utrud}${notatka}${lista.length ? htmlListaOdjazdow(items) : ""}${pdf}${pkp}`;
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
  const kotwicaOrganizacji = kotwicaProfiluWsiDlaKategoriiPoi(katNorm);
  const etykietaOrganizacji = etykietaLinkuOrganizacjiDlaPoi(katNorm);
  const linkOrganizacji =
    kotwicaOrganizacji && etykietaOrganizacji
      ? `${z.sciezkaWsi.replace(/"/g, "")}${kotwicaOrganizacji}`
      : null;
  const miniatura = z.photoUrl
    ? `<p class="mapa-wsi-popup-foto"><img src="${escapeHtml(z.photoUrl)}" alt="" width="220" height="124" style="width:100%;max-width:220px;height:auto;border-radius:8px;object-fit:cover" loading="lazy" /></p>`
    : "";
  const precyzja = tekstPrecyzjiPoiMapy(z);
  const badgePrecyzji = precyzja
    ? `<p class="mapa-poi-precyzja-hint">${escapeHtml(precyzja)}</p>`
    : z.mapPrecision === "dokladna" && (katNorm === "ambona" || katNorm === "posterunek_lowiecki")
      ? `<p class="mapa-poi-precyzja-hint mapa-poi-precyzja-hint--dokladna">Widok dla członka wsi — lokalizacja dokładna.</p>`
      : "";
  return `
    <div class="mapa-wsi-popup">
      <p class="mapa-wsi-popup-meta">${escapeHtml(kat)}${z.villageName ? ` · ${escapeHtml(z.villageName)}` : ""}</p>
      <h3>${escapeHtml(z.name)}</h3>
      ${badgeStatus}
      ${badgePrecyzji}
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
            : `<a href="${stronaMiejsca}">Profil miejsca →</a><span aria-hidden="true"> · </span>`
        }
        <a href="${z.sciezkaWsi.replace(/"/g, "")}">Strona wsi</a>
        ${linkOrganizacji ? `<span aria-hidden="true"> · </span><a href="${linkOrganizacji}">${escapeHtml(etykietaOrganizacji!)} →</a>` : ""}
        <span aria-hidden="true"> · </span>
        <a href="${stronaMiejsca}#lokalizacja">Na mapie</a>
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

const MapaWsiLeafletInner = forwardRef<
  MapaWsiLeafletRef,
  {
    znaczniki: ZnacznikWsi[];
    punktyPoi?: ZnacznikPoi[];
    punktyRynek?: ZnacznikRynek[];
    punktyRynekDzialki?: ZnacznikRynekDzialka[];
    punktyZgloszenia?: ZnacznikZgloszenie[];
    punktyPolowania?: ZnacznikPolowanie[];
    ostrzezeniaLesne?: ZnacznikOstrzezeniaLesnego[];
    punktyCmentarze?: ZnacznikCmentarzObrys[];
    punktyGeoKontekst?: ZnacznikGeoKontekst[];
    obrysyLanduse?: ObrysLanduseMapy[];
    pokazLanduse?: boolean;
    punktyAdresy?: ZnacznikAdres[];
    /** Obrysy wsi w gminie (fallback gdy brak urzędowej granicy PRG). */
    obrysyGminy?: ZnacznikWsi[];
    /** Urzędowa granica gminy z PRG A04 (TERC). */
    obrysGminyUrzedowy?: GeoJsonObject | null;
    /** Otulina powiatu (fallback) lub urzędowa granica PRG A03. */
    obrysPowiatu?: GeoJsonObject | null;
    /** Urzędowa granica województwa z PRG A02. */
    obrysWojewodztwa?: GeoJsonObject | null;
    /** Obrysy wsi po id (lazy load) — aktualizacja bez przebudowy znaczników POI. */
    graniceWsi?: Record<string, unknown>;
    /** Granice nadleśnictw LP (PRG U06). */
    nadlesnictwaObrysy?: ObrysNadlesnictwaMapy[];
    /** Leśnictwa LP (BDL WFS). */
    lesnictwaObrysy?: ObrysLesnictwaMapy[];
    /** Obwody łowieckie (OpenForestData). */
    obwodyLowieckieObrysy?: ObrysObwoduLowieckiegoMapy[];
    punktyKola?: ZnacznikKoloLowieckie[];
    rewiryLowieckie?: ZnacznikRewirLowiecki[];
    trybLowiectwo?: boolean;
    pozycjaUzytkownika?: { lat: number; lon: number } | null;
    promienKm?: number | null;
    pokazGranice?: boolean;
    onPokazGraniceChange?: (v: boolean) => void;
    /** Granice działek EGiB (WMS KIEG) — domyślnie włączone od zoomu 11. */
    pokazGraniceDzialek?: boolean;
    onPokazGraniceDzialekChange?: (v: boolean) => void;
    /** Obręby ewidencyjne EGiB — opcjonalnie obok działek. */
    pokazGraniceObrebow?: boolean;
    onPokazGraniceObrebowChange?: (v: boolean) => void;
    /** Skrót: włącza działki (kompatybilność osadzonych map). */
    pokazEgib?: boolean;
    pokazPoi?: boolean;
    pokazRynek?: boolean;
    wysokoscMapy?: "pelna" | "kompakt";
    /** Sterowane z panelu bocznego — punkty adresowe KIN. */
    pokazAdresyKin?: boolean;
    onPokazAdresyKinChange?: (v: boolean) => void;
    /** Sterowane z panelu bocznego — kontekst PRNG / instytucje. */
    pokazGeoKontekst?: boolean;
    onPokazGeoKontekstChange?: (v: boolean) => void;
    /** Ukrywa panel „Warstwy” na mapie — sterowanie z sidebara. */
    sterowanieWarstwZewnetrzne?: boolean;
    onZoomChange?: (zoom: number) => void;
    bboxWidoku?: BboxMapy | null;
    onBoundsChange?: (bbox: BboxMapy) => void;
  }
>(function MapaWsiLeaflet(
  {
    znaczniki,
    punktyPoi = [],
    punktyRynek = [],
    punktyRynekDzialki = [],
    punktyZgloszenia = [],
    punktyPolowania = [],
    ostrzezeniaLesne = [],
    punktyCmentarze = [],
    punktyGeoKontekst = [],
    obrysyLanduse = [],
    pokazLanduse = false,
    punktyAdresy = [],
    obrysyGminy = [],
    obrysGminyUrzedowy = null,
    obrysPowiatu = null,
    obrysWojewodztwa = null,
    graniceWsi = {},
    nadlesnictwaObrysy = [],
    lesnictwaObrysy = [],
    obwodyLowieckieObrysy = [],
    punktyKola = [],
    rewiryLowieckie = [],
    trybLowiectwo = false,
    pozycjaUzytkownika = null,
    promienKm = null,
    pokazGranice = true,
    onPokazGraniceChange,
    pokazGraniceDzialek: pokazGraniceDzialekProp,
    onPokazGraniceDzialekChange,
    pokazGraniceObrebow: pokazGraniceObrebowProp,
    onPokazGraniceObrebowChange,
    pokazEgib = true,
    pokazPoi = true,
    pokazRynek = true,
    wysokoscMapy = "pelna",
    pokazAdresyKin: pokazAdresyKinProp,
    onPokazAdresyKinChange,
    pokazGeoKontekst: pokazGeoKontekstProp,
    onPokazGeoKontekstChange,
    sterowanieWarstwZewnetrzne = false,
    onZoomChange,
    bboxWidoku = null,
    onBoundsChange,
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
    useEffect(() => {
      setPokazGraniceStan(pokazGranice);
    }, [pokazGranice]);
    const sterowaneDzialki = pokazGraniceDzialekProp !== undefined;
    const sterowaneObreby = pokazGraniceObrebowProp !== undefined;
    const [pokazDzialkiWew, setPokazDzialkiWew] = useState(
      () => (pokazGraniceDzialekProp ?? pokazEgib) && wczytajZapisaneDzialki(),
    );
    const [pokazObrebyWew, setPokazObrebyWew] = useState(
      () => (pokazGraniceObrebowProp ?? false) && wczytajZapisaneObreby(),
    );
    const pokazDzialkiStan = sterowaneDzialki
      ? (pokazGraniceDzialekProp ?? pokazEgib)
      : pokazDzialkiWew;
    const pokazObrebyStan = sterowaneObreby ? (pokazGraniceObrebowProp ?? false) : pokazObrebyWew;
    const pokazKiegStan = pokazDzialkiStan || pokazObrebyStan;
    useEffect(() => {
      if (!sterowaneDzialki) {
        setPokazDzialkiWew((pokazGraniceDzialekProp ?? pokazEgib) && wczytajZapisaneDzialki());
      }
    }, [pokazEgib, pokazGraniceDzialekProp, sterowaneDzialki]);
    useEffect(() => {
      if (!sterowaneObreby) {
        setPokazObrebyWew((pokazGraniceObrebowProp ?? false) && wczytajZapisaneObreby());
      }
    }, [pokazGraniceObrebowProp, sterowaneObreby]);
    const [zoomMapy, setZoomMapy] = useState(7);
    const zapisaneWarstwy = useMemo(() => wczytajZapisaneWarstwy(), []);
    const [pokazPoiStan, setPokazPoiStan] = useState(zapisaneWarstwy.poi ?? pokazPoi);
    const [pokazRynekStan, setPokazRynekStan] = useState(zapisaneWarstwy.rynek ?? pokazRynek);
    useEffect(() => {
      if (!sterowanieWarstwZewnetrzne) return;
      setPokazPoiStan(pokazPoi);
      setPokazRynekStan(pokazRynek);
    }, [sterowanieWarstwZewnetrzne, pokazPoi, pokazRynek]);
    const [pokazAdresyWew, ustawPokazAdresyWew] = useState(zapisaneWarstwy.adresy ?? false);
    const [pokazGeoKontekstWew, ustawPokazGeoKontekstWew] = useState(zapisaneWarstwy.geo ?? false);
    const pokazAdresyStan = pokazAdresyKinProp ?? pokazAdresyWew;
    const pokazGeoKontekstStan = pokazGeoKontekstProp ?? pokazGeoKontekstWew;
    const setPokazAdresyStan = useCallback(
      (v: boolean | ((prev: boolean) => boolean)) => {
        const next = typeof v === "function" ? v(pokazAdresyStan) : v;
        if (onPokazAdresyKinChange) onPokazAdresyKinChange(next);
        else ustawPokazAdresyWew(next);
      },
      [onPokazAdresyKinChange, pokazAdresyStan],
    );
    const setPokazGeoKontekstStan = useCallback(
      (v: boolean | ((prev: boolean) => boolean)) => {
        const next = typeof v === "function" ? v(pokazGeoKontekstStan) : v;
        if (onPokazGeoKontekstChange) onPokazGeoKontekstChange(next);
        else ustawPokazGeoKontekstWew(next);
      },
      [onPokazGeoKontekstChange, pokazGeoKontekstStan],
    );
    const [pelnyEkran, setPelnyEkran] = useState(false);
    const [legendaOtwarta, setLegendaOtwarta] = useState(false);
    const [warstwyOtwarte, setWarstwyOtwarte] = useState(false);
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
    const ostrzezeniaLesneRef = useRef(ostrzezeniaLesne);
    ostrzezeniaLesneRef.current = ostrzezeniaLesne;
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
    const obrysGminyUrzedowyRef = useRef(obrysGminyUrzedowy);
    obrysGminyUrzedowyRef.current = obrysGminyUrzedowy;
    const obrysPowiatuRef = useRef(obrysPowiatu);
    obrysPowiatuRef.current = obrysPowiatu;
    const obrysWojewodztwaRef = useRef(obrysWojewodztwa);
    obrysWojewodztwaRef.current = obrysWojewodztwa;
    const nadlesnictwaRef = useRef(nadlesnictwaObrysy);
    nadlesnictwaRef.current = nadlesnictwaObrysy;
    const lesnictwaRef = useRef(lesnictwaObrysy);
    lesnictwaRef.current = lesnictwaObrysy;
    const obwodyLowieckieRef = useRef(obwodyLowieckieObrysy);
    obwodyLowieckieRef.current = obwodyLowieckieObrysy;
    const punktyKolaRef = useRef(punktyKola);
    punktyKolaRef.current = punktyKola;
    const rewiryRef = useRef(rewiryLowieckie);
    rewiryRef.current = rewiryLowieckie;
    const pokazGraniceRef = useRef(pokazGraniceStan);
    pokazGraniceRef.current = pokazGraniceStan;
    const pokazKiegRef = useRef(pokazKiegStan);
    pokazKiegRef.current = pokazKiegStan;
    const pokazDzialkiRef = useRef(pokazDzialkiStan);
    pokazDzialkiRef.current = pokazDzialkiStan;
    const pokazObrebyRef = useRef(pokazObrebyStan);
    pokazObrebyRef.current = pokazObrebyStan;
    const trybLowiectwoRef = useRef(trybLowiectwo);
    trybLowiectwoRef.current = trybLowiectwo;
    const pokazPoiRef = useRef(pokazPoiStan);
    pokazPoiRef.current = pokazPoiStan;
    const pokazRynekRef = useRef(pokazRynekStan);
    pokazRynekRef.current = pokazRynekStan;
    const promienRef = useRef(promienKm);
    promienRef.current = promienKm;
    const graniceWsiRef = useRef(graniceWsi);
    graniceWsiRef.current = graniceWsi;
    const bboxMapyRef = useRef(bboxWidoku);
    bboxMapyRef.current = bboxWidoku;
    const onBoundsChangeRef = useRef(onBoundsChange);
    onBoundsChangeRef.current = onBoundsChange;
    const [mapaGotowa, setMapaGotowa] = useState(false);

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

    const bboxFitRef = useRef(bboxPoczatkowy);
    bboxFitRef.current = bboxPoczatkowy;

    useEffect(() => {
      if (sterowanieWarstwZewnetrzne) return;
      zapiszWarstwyMapy({
        poi: pokazPoiStan,
        rynek: pokazRynekStan,
        adresy: pokazAdresyStan,
        geo: pokazGeoKontekstStan,
      });
    }, [
      sterowanieWarstwZewnetrzne,
      pokazPoiStan,
      pokazRynekStan,
      pokazAdresyStan,
      pokazGeoKontekstStan,
    ]);

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
      przyblizDoWszystkich() {
        const inst = instancja.current;
        const L = leafletRef.current;
        const bb = bboxFitRef.current;
        if (!inst || !L || !bb) return false;
        const bounds = L.latLngBounds(bb);
        if (!bounds.isValid()) return false;
        inst.map.fitBounds(bounds, { padding: [44, 44], maxZoom: 14, animate: true });
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
      pokazOstrzezenieLesne(id: string) {
        const inst = instancja.current;
        if (!inst) return false;
        const warstwa = inst.lesneById.get(id);
        if (!warstwa) return false;
        const w = warstwa as import("leaflet").Layer & {
          getBounds?: () => import("leaflet").LatLngBounds;
          openPopup?: () => void;
        };
        const bounds = w.getBounds?.();
        if (bounds?.isValid()) {
          inst.map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15, animate: true });
        } else {
          const o = ostrzezeniaLesneRef.current.find((x) => x.id === id);
          if (o) inst.map.setView([o.lat, o.lon], 14);
        }
        w.openPopup?.();
        return true;
      },
      pokazPoi(idPoi: string) {
        const inst = instancja.current;
        if (!inst) return false;
        const marker = inst.poiMarkersById.get(idPoi);
        if (!marker) return false;
        const poiCluster = inst.poiCluster as import("leaflet").MarkerClusterGroup;
        if (typeof poiCluster.zoomToShowLayer === "function") {
          poiCluster.zoomToShowLayer(marker, () => marker.openPopup());
        } else {
          inst.map.setView(marker.getLatLng(), Math.max(inst.map.getZoom(), 15));
          marker.openPopup();
        }
        return true;
      },
      ustawPodklad(rodzaj: RodzajPodkladuMapy) {
        setRodzajPodkladu(rodzaj);
        const inst = instancja.current;
        if (inst) ustawPodkladMapy(inst, rodzaj);
      },
      odswiezRozmiar() {
        const map = instancja.current?.map;
        if (map) bezpieczneInvalidateSize(map);
      },
    }));

    // Jednorazowa inicjalizacja mapy
    useEffect(() => {
      const el = refMapa.current;
      const shell = refShell.current;
      if (!el || !shell) return;

      const ctrl = new AbortController();

      void (async () => {
        try {
          await czekajNaWymiaryKontenera(shell, ctrl.signal);
        } catch {
          return;
        }

        const L = (await import("leaflet")).default as unknown as LeafletNs;
        await import("leaflet.markercluster");

        if (ctrl.signal.aborted || !refMapa.current) return;

        const map = L.map(el, {
          zoomControl: true,
          scrollWheelZoom: false,
          attributionControl: true,
          touchZoom: true,
          dragging: true,
        });
        map.zoomControl.setPosition("bottomright");
        map.attributionControl.setPosition("bottomleft");
        ustawPaneWarstwicyGranicy(map);

        const podkladMapa = L.tileLayer(URL_PODKLAD_MAPA, {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
          errorTileUrl: KAFEL_BLEDU,
        });
        const podkladSatelita = L.tileLayer(URL_PODKLAD_SATELITA, {
          attribution:
            'Zdjęcia &copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics',
          maxZoom: 19,
          errorTileUrl: KAFEL_BLEDU,
        });
        const podkladEtykietySatelita = L.tileLayer(URL_PODKLAD_ETYKIETY, {
          attribution: 'Etykiety &copy; <a href="https://www.esri.com/">Esri</a>',
          maxZoom: 19,
          pane: "overlayPane",
          opacity: 0.88,
          errorTileUrl: KAFEL_BLEDU,
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
        const atrybucjaEgib =
          'Granice EGiB &copy; <a href="https://www.geoportal.gov.pl/">GUGiK</a>';
        const egibDzialkiWmsLayer = CZY_KIEG_WMS_DOSTEPNY
          ? L.tileLayer.wms(KIEG_WMS_URL, {
              ...opcjeWarstwyKiegWms(KIEG_LAYER_DZIALKI),
              attribution: atrybucjaEgib,
            })
          : null;
        const egibObrebyWmsLayer = CZY_KIEG_WMS_DOSTEPNY
          ? L.tileLayer.wms(KIEG_WMS_URL, {
              ...opcjeWarstwyKiegWms(KIEG_LAYER_OBREBY),
              attribution: atrybucjaEgib,
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
        const poiCluster = L.markerClusterGroup({
          showCoverageOnHover: false,
          maxClusterRadius: 48,
          spiderfyOnMaxZoom: true,
          disableClusteringAtZoom: 17,
        });

        const boundaryGroup = L.layerGroup().addTo(map);
        const graniceWsiGroup = L.layerGroup().addTo(boundaryGroup);
        const poiStrefyGroup = L.layerGroup().addTo(boundaryGroup);
        const inneObrysyGroup = L.layerGroup().addTo(boundaryGroup);
        const adresyGroup = L.layerGroup();
        const geoKontekstGroup = L.layerGroup();
        const landuseGroup = L.layerGroup();
        const userLayer = L.layerGroup().addTo(map);
        map.addLayer(cluster);
        map.addLayer(poiCluster);

        const container = map.getContainer();
        const enter = () => {
          if (!czyMapaLeafletOperacyjna(map)) return;
          map.scrollWheelZoom.enable();
        };
        const leave = () => {
          if (!czyMapaLeafletOperacyjna(map)) return;
          map.scrollWheelZoom.disable();
        };
        container.addEventListener("mouseenter", enter);
        container.addEventListener("mouseleave", leave);

        const onZoom = () => {
          const z = map.getZoom();
          setZoomMapy(z);
          onZoomChange?.(z);
        };
        map.on("zoomend", onZoom);
        const raportujBbox = () => {
          const b = map.getBounds();
          onBoundsChangeRef.current?.({
            south: b.getSouth(),
            west: b.getWest(),
            north: b.getNorth(),
            east: b.getEast(),
          });
        };
        map.on("moveend", raportujBbox);
        raportujBbox();
        const zoomStart = map.getZoom();
        setZoomMapy(zoomStart);
        onZoomChange?.(zoomStart);

        const resizeHandler = () => {
          bezpieczneInvalidateSize(map);
        };
        window.addEventListener("resize", resizeHandler);
        const initInvalidateTimeoutId = setTimeout(resizeHandler, 120);

        instancja.current = {
          map,
          cluster,
          poiCluster,
          boundaryGroup,
          graniceWsiGroup,
          poiStrefyGroup,
          inneObrysyGroup,
          userLayer,
          podkladMapa,
          podkladSatelita,
          podkladEtykietySatelita,
          geoportalWmsLayer,
          egibDzialkiWmsLayer,
          egibObrebyWmsLayer,
          adresyGroup,
          geoKontekstGroup,
          landuseGroup,
          markersById: new Map(),
          polowaniaById: new Map(),
          lesneById: new Map(),
          rynekDzialkiById: new Map(),
          poiMarkersById: new Map(),
          resizeHandler,
          wheelHandlers: { enter, leave },
          initInvalidateTimeoutId,
          ostatniFitBboxKlucz: null,
          ostatniPodpisWarstwyPoi: null,
        };
        ustawPodkladMapy(instancja.current, podkladStart);
        ustawWarstwyKieg(instancja.current, {
          dzialki: pokazDzialkiRef.current,
          obreby: pokazObrebyRef.current,
        });
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
          r0,
          rd0,
          punktyZgloszeniaRef.current,
          punktyPolowaniaRef.current,
          ostrzezeniaLesneRef.current,
          obrysyGminyRef.current,
          obrysGminyUrzedowyRef.current,
          obrysPowiatuRef.current,
          obrysWojewodztwaRef.current,
          nadlesnictwaRef.current,
          lesnictwaRef.current,
          obwodyLowieckieRef.current,
          punktyKolaRef.current,
          rewiryRef.current,
          punktyCmentarzeRef.current,
          ikona,
          bb0,
          {},
          {
            pokazGranice: pokazGraniceRef.current,
            pokazEgib: pokazKiegRef.current,
            trybLowiectwo: trybLowiectwoRef.current,
          },
        );
        syncWarstwaPoi(L, instancja.current, p0);
        const egibWidocznyInit =
          pokazKiegRef.current && czyKiegWidocznyNaZoomie(map.getZoom());
        syncGraniceWsiNaMapie(L, instancja.current, z0, graniceWsiRef.current, {
          pokazGranice: pokazGraniceRef.current,
          egibWidoczny: egibWidocznyInit,
          bbox: bboxMapyRef.current,
        });
        syncWarstwaUzytkownika(L, instancja.current, pozycjaRef.current, promienRef.current);
        setMapaGotowa(true);
        requestAnimationFrame(() => {
          bezpieczneInvalidateSize(map);
          requestAnimationFrame(() => bezpieczneInvalidateSize(map));
        });
      })();

      return () => {
        ctrl.abort();
        setMapaGotowa(false);
        const inst = instancja.current;
        if (inst) {
          if (inst.initInvalidateTimeoutId != null) {
            clearTimeout(inst.initInvalidateTimeoutId);
          }
          inst.map.off("zoomend");
          window.removeEventListener("resize", inst.resizeHandler);
          const c = inst.map.getContainer();
          c.removeEventListener("mouseenter", inst.wheelHandlers.enter);
          c.removeEventListener("mouseleave", inst.wheelHandlers.leave);
          try {
            inst.map.scrollWheelZoom.disable();
            inst.map.stop();
          } catch {
            /* ignore */
          }
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
        pokazRynekStan ? punktyRynek : [],
        pokazRynekStan ? punktyRynekDzialki : [],
        punktyZgloszenia,
        punktyPolowania,
        ostrzezeniaLesne,
        obrysyGminy,
        obrysGminyUrzedowy,
        obrysPowiatu,
        obrysWojewodztwa,
        nadlesnictwaObrysy,
        lesnictwaObrysy,
        obwodyLowieckieObrysy,
        punktyKola,
        rewiryLowieckie,
        punktyCmentarze,
        ikona,
        bboxPoczatkowy,
        graniceWsi,
        { pokazGranice: pokazGraniceStan, pokazEgib: pokazKiegStan, trybLowiectwo },
      );
    }, [
      znaczniki,
      punktyRynek,
      punktyRynekDzialki,
      punktyZgloszenia,
      punktyPolowania,
      ostrzezeniaLesne,
      punktyCmentarze,
      obrysyGminy,
      obrysGminyUrzedowy,
      obrysPowiatu,
      obrysWojewodztwa,
      nadlesnictwaObrysy,
      lesnictwaObrysy,
      obwodyLowieckieObrysy,
      punktyKola,
      rewiryLowieckie,
      bboxPoczatkowy,
      pokazGraniceStan,
      pokazKiegStan,
      trybLowiectwo,
      pokazRynekStan,
    ]);

    useEffect(() => {
      const inst = instancja.current;
      const L = leafletRef.current;
      if (!inst || !L || !mapaGotowa || znaczniki.length === 0) return;
      const egibWidoczny = pokazKiegStan && czyKiegWidocznyNaZoomie(inst.map.getZoom());
      syncGraniceWsiNaMapie(L, inst, znaczniki, graniceWsi, {
        pokazGranice: pokazGraniceStan,
        egibWidoczny,
        bbox: bboxWidoku,
      });
    }, [graniceWsi, znaczniki, pokazGraniceStan, pokazKiegStan, zoomMapy, mapaGotowa, bboxWidoku]);

    useEffect(() => {
      const inst = instancja.current;
      const L = leafletRef.current;
      if (!inst || !L) return;
      syncWarstwaPoi(L, inst, pokazPoiStan ? punktyPoi : []);
    }, [punktyPoi, pokazPoiStan]);

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
      ustawWarstwyKieg(inst, { dzialki: pokazDzialkiStan, obreby: pokazObrebyStan });
      try {
        window.sessionStorage.setItem(KLUCZ_DZIALKI_STORAGE, pokazDzialkiStan ? "1" : "0");
        window.sessionStorage.setItem(KLUCZ_OBREBY_STORAGE, pokazObrebyStan ? "1" : "0");
        window.sessionStorage.setItem(KLUCZ_EGIB_STORAGE, pokazKiegStan ? "1" : "0");
      } catch {
        /* ignore */
      }
    }, [pokazDzialkiStan, pokazObrebyStan, pokazKiegStan]);

    useEffect(() => {
      const onChange = () => {
        setPelnyEkran(!!document.fullscreenElement);
        const map = instancja.current?.map;
        if (map) {
          requestAnimationFrame(() => bezpieczneInvalidateSize(map));
        }
      };
      document.addEventListener("fullscreenchange", onChange);
      return () => document.removeEventListener("fullscreenchange", onChange);
    }, []);

    /** Mobile: dolna nawigacja i pasek adresu zmieniają wysokość — Leaflet bez tego zostaje z pustym/szarym podkładem. */
    useEffect(() => {
      if (!mapaGotowa) return;
      const shell = refShell.current;
      const map = instancja.current?.map;
      if (!shell || !map) return;

      const odswiez = () => {
        requestAnimationFrame(() => bezpieczneInvalidateSize(map));
      };

      const ro =
        typeof ResizeObserver !== "undefined" ? new ResizeObserver(odswiez) : null;
      ro?.observe(shell);

      const vv = window.visualViewport;
      vv?.addEventListener("resize", odswiez);
      vv?.addEventListener("scroll", odswiez);

      const opoznienia = [0, 200, 600].map((ms) => window.setTimeout(odswiez, ms));

      return () => {
        ro?.disconnect();
        vv?.removeEventListener("resize", odswiez);
        vv?.removeEventListener("scroll", odswiez);
        opoznienia.forEach((id) => window.clearTimeout(id));
      };
    }, [mapaGotowa]);

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
        className={`mapa-wsi-map-shell relative w-full min-h-[280px] bg-gradient-to-br from-emerald-50/40 via-stone-100 to-stone-200/50 ${
          trybLowiectwo ? "mapa-wsi-map-shell--lowiectwo" : ""
        } ${
          pelnyEkran
            ? "mapa-wsi-map-shell--pelny-ekran h-[100dvh] max-h-[100dvh]"
            : wysokoscMapy === "kompakt"
              ? "h-[min(420px,55dvh)]"
              : "mapa-wsi-map-shell--pelna h-full min-h-0 flex-1"
        }`}
      >
        <div
          ref={refMapa}
          className="mapa-wsi-canvas absolute inset-0 z-0 bg-stone-200/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700/35 focus-visible:ring-offset-2"
          role="application"
          aria-label="Mapa interaktywna — wsie naszawies.pl"
          tabIndex={0}
        />
        <div className="mapa-kontrolki-pasek absolute right-2 top-2 z-[410] flex max-w-[min(calc(100%-5rem),280px)] flex-col items-end gap-2 sm:right-3 sm:top-3">
          <div className="mapa-kontrolki-segment" role="group" aria-label="Rodzaj podkładu mapy">
            <button
              type="button"
              onClick={() => setRodzajPodkladu("mapa")}
              className={`mapa-kontrolki-segment__btn ${rodzajPodkladu === "mapa" ? "mapa-kontrolki-segment__btn--aktywny" : ""}`}
              aria-pressed={rodzajPodkladu === "mapa"}
            >
              Mapa
            </button>
            <button
              type="button"
              onClick={() => setRodzajPodkladu("satelita")}
              className={`mapa-kontrolki-segment__btn ${rodzajPodkladu === "satelita" ? "mapa-kontrolki-segment__btn--aktywny" : ""}`}
              aria-pressed={rodzajPodkladu === "satelita"}
            >
              Satelita
            </button>
            {CZY_GEO_WMS_DOSTEPNY ? (
              <button
                type="button"
                onClick={() => setRodzajPodkladu("ortofoto")}
                className={`mapa-kontrolki-segment__btn ${rodzajPodkladu === "ortofoto" ? "mapa-kontrolki-segment__btn--aktywny" : ""}`}
                aria-pressed={rodzajPodkladu === "ortofoto"}
                title="Ortofotomapa Geoportal (Polska)"
              >
                Ortofoto
              </button>
            ) : null}
          </div>
          {!sterowanieWarstwZewnetrzne ? (
            <div className="mapa-kontrolki-panel">
              <button
                type="button"
                className="mapa-kontrolki-panel__naglowek"
                aria-expanded={warstwyOtwarte}
                onClick={() => setWarstwyOtwarte((v) => !v)}
              >
                Warstwy
                <span aria-hidden className="text-stone-400">
                  {warstwyOtwarte ? "▴" : "▾"}
                </span>
              </button>
              {warstwyOtwarte ? (
                <div className="mapa-kontrolki-panel__tresc" role="group" aria-label="Warstwy na mapie">
                  <button
                    type="button"
                    onClick={() => {
                      const next = !pokazDzialkiStan;
                      if (sterowaneDzialki) onPokazGraniceDzialekChange?.(next);
                      else setPokazDzialkiWew(next);
                    }}
                    className={`mapa-warstwa-chip ${pokazDzialkiStan ? "mapa-warstwa-chip--on mapa-warstwa-chip--fuchsia" : ""}`}
                    title="Granice działek EGiB — widoczne od zoomu 11"
                  >
                    Działki
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !pokazObrebyStan;
                      if (sterowaneObreby) onPokazGraniceObrebowChange?.(next);
                      else setPokazObrebyWew(next);
                    }}
                    className={`mapa-warstwa-chip ${pokazObrebyStan ? "mapa-warstwa-chip--on mapa-warstwa-chip--fuchsia" : ""}`}
                    title="Obręby ewidencyjne EGiB — widoczne od zoomu 11"
                  >
                    Obręby
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPokazGraniceStan((v) => {
                        const next = !v;
                        onPokazGraniceChange?.(next);
                        return next;
                      });
                    }}
                    className={`mapa-warstwa-chip ${pokazGraniceStan ? "mapa-warstwa-chip--on mapa-warstwa-chip--green" : ""}`}
                  >
                    Obrysy wsi
                  </button>
                  <button
                    type="button"
                    onClick={() => setPokazPoiStan((v) => !v)}
                    className={`mapa-warstwa-chip ${pokazPoiStan ? "mapa-warstwa-chip--on mapa-warstwa-chip--green" : ""}`}
                  >
                    POI
                  </button>
                  <button
                    type="button"
                    onClick={() => setPokazRynekStan((v) => !v)}
                    className={`mapa-warstwa-chip ${pokazRynekStan ? "mapa-warstwa-chip--on mapa-warstwa-chip--orange" : ""}`}
                  >
                    Rynek
                  </button>
                  {punktyAdresy.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setPokazAdresyStan((v) => !v)}
                      className={`mapa-warstwa-chip ${pokazAdresyStan ? "mapa-warstwa-chip--on mapa-warstwa-chip--sky" : ""}`}
                    >
                      KIN ({punktyAdresy.length})
                    </button>
                  ) : null}
                  {punktyGeoKontekst.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setPokazGeoKontekstStan((v) => !v)}
                      className={`mapa-warstwa-chip ${pokazGeoKontekstStan ? "mapa-warstwa-chip--on mapa-warstwa-chip--teal" : ""}`}
                    >
                      PRNG ({punktyGeoKontekst.length})
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
          <button type="button" onClick={togglePelnyEkran} className="mapa-kontrolki-btn">
            {pelnyEkran ? "Zmniejsz" : "Pełny ekran"}
          </button>
        </div>
        <div className="mapa-legenda-karta absolute left-2 top-2 z-[400] sm:left-3 sm:top-3">
          <button
            type="button"
            className="mapa-legenda-karta__naglowek"
            aria-expanded={legendaOtwarta}
            onClick={() => setLegendaOtwarta((v) => !v)}
          >
            Legenda
            <span aria-hidden className="text-[10px] text-stone-400">
              {legendaOtwarta ? "▴" : "▾"}
            </span>
          </button>
          {legendaOtwarta ? (
            <ul className="mapa-legenda-karta__lista">
              <li>
                <span className="mapa-legenda-swatch mapa-legenda-swatch--wies" /> Wieś (chałupa)
              </li>
              <li>
                <span className="mapa-legenda-swatch mapa-legenda-swatch--poi" /> Miejsca POI (emoji)
              </li>
              <li>
                <span className="mapa-legenda-swatch mapa-legenda-swatch--granica" /> Obrys PRG wsi
              </li>
              <li>
                <span className="mapa-legenda-swatch mapa-legenda-swatch--egib" /> Działki / obręby EGiB (zoom 11+)
              </li>
              <li>
                <span className="mapa-legenda-swatch mapa-legenda-swatch--gps" /> Twoja lokalizacja
              </li>
              <li>
                <span className="mapa-legenda-swatch mapa-legenda-swatch--klaster" /> Kółko z liczbą — grupa punktów
              </li>
              {trybLowiectwo || obwodyLowieckieObrysy.length > 0 ? (
                <li>
                  <span className="mapa-legenda-swatch mapa-legenda-swatch--obwod-lowiecki" /> Obwód łowiecki (PZŁ)
                </li>
              ) : null}
              {lesnictwaObrysy.length > 0 ? (
                <li>
                  <span className="mapa-legenda-swatch mapa-legenda-swatch--lesnictwo" /> Leśnictwo (BDL)
                </li>
              ) : null}
              {nadlesnictwaObrysy.length > 0 ? (
                <li>
                  <span className="mapa-legenda-swatch mapa-legenda-swatch--nadlesnictwo" /> Nadleśnictwo (PRG)
                </li>
              ) : null}
              {trybLowiectwo ? (
                <>
                  <li>
                    <span className="mapa-legenda-swatch mapa-legenda-swatch--polowanie" /> Polowanie (czerwony = trwa)
                  </li>
                  <li>
                    <span className="mapa-legenda-swatch mapa-legenda-swatch--lowiectwo" /> Koło / rewir z profilu
                  </li>
                </>
              ) : null}
            </ul>
          ) : null}
        </div>
        <div className="mapa-zoom-badge pointer-events-none absolute bottom-3 left-3 z-[390] rounded-lg border border-stone-200/90 bg-white/90 px-2 py-1 text-[10px] font-semibold tabular-nums text-stone-600 shadow-sm backdrop-blur-sm">
          Zoom {zoomMapy}
        </div>
        <p className="mapa-wsi-podpowiedz-wow pointer-events-none absolute bottom-3 left-1/2 z-[390] hidden max-w-[min(100%,22rem)] -translate-x-1/2 rounded-full border border-green-900/10 bg-white/90 px-3 py-1 text-center text-[10px] font-medium text-stone-600 shadow-sm backdrop-blur-sm sm:block">
          {pokazKiegStan && zoomMapy < KIEG_WMS_MIN_ZOOM
            ? `Przybliż do zoom ${KIEG_WMS_MIN_ZOOM}+, aby zobaczyć działki EGiB.`
            : "Kółko myszy zoomuje mapę, gdy kursor jest nad nią."}
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

function syncGraniceWsiNaMapie(
  L: LeafletNs,
  inst: InstancjaLeaflet,
  znaczniki: ZnacznikWsi[],
  granicePoId: Record<string, unknown>,
  opts: { pokazGranice: boolean; egibWidoczny: boolean; bbox?: BboxMapy | null },
) {
  const { graniceWsiGroup } = inst;
  graniceWsiGroup.clearLayers();
  if (!opts.pokazGranice) return;

  const widoczne = filtrujZnacznikiWBbox(znaczniki, opts.bbox ?? null, 100);

  for (const z of widoczne) {
    const gj = granicaJakoGeoJson(granicePoId[z.id] ?? z.boundary_geojson);
    let wariant: WariantGranicyWPopup = "pozor";
    if (gj) {
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
        graniceWsiGroup.addLayer(warstwa);
        wariant = "geojson";
        continue;
      } catch {
        /* fallback okrąg */
      }
    }
    if (!opts.egibWidoczny) {
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
      graniceWsiGroup.addLayer(kolo);
      wariant = "pozor";
    }
    void wariant;
  }
}

function syncWarstwaPoi(L: LeafletNs, inst: InstancjaLeaflet, punktyPoi: ZnacznikPoi[]) {
  const { map, poiCluster, poiStrefyGroup, poiMarkersById } = inst;
  if (!czyMapaLeafletOperacyjna(map)) return;

  const podpis = podpisWarstwyPoi(punktyPoi);
  if (inst.ostatniPodpisWarstwyPoi === podpis) return;
  inst.ostatniPodpisWarstwyPoi = podpis;

  let otwartyId: string | null = null;
  poiMarkersById.forEach((marker, id) => {
    if (!otwartyId && marker.isPopupOpen()) otwartyId = id;
  });

  (poiCluster as import("leaflet").LayerGroup).clearLayers();
  poiStrefyGroup.clearLayers();
  poiMarkersById.clear();

  if (!map.hasLayer(poiCluster)) {
    map.addLayer(poiCluster);
  }

  for (const p of punktyPoi) {
    const pin = L.marker([p.lat, p.lon], { icon: zbudujIkonePoi(L, p), zIndexOffset: 450, title: p.name });
    pin.bindPopup(htmlPopupPoi(p), {
      maxWidth: 340,
      minWidth: 200,
      autoPan: true,
      autoClose: true,
      closeOnClick: false,
    });
    podlaczInterakcjeDoPopupPoi(pin, p);
    (poiCluster as import("leaflet").LayerGroup).addLayer(pin);
    poiMarkersById.set(p.id, pin);

    if (p.strefaRadiusM && p.strefaRadiusM > 0) {
      const strefaKat = p.category.trim().toLowerCase();
      const wrazliwa = strefaKat === "ambona" || strefaKat === "posterunek_lowiecki";
      const kolo = L.circle([p.lat, p.lon], {
        radius: p.strefaRadiusM,
        pane: PANE_GRANICE,
        interactive: false,
        color: wrazliwa ? "#c2410c" : "#166534",
        weight: 2,
        opacity: p.mapPrecision === "dokladna" ? 0.5 : 0.75,
        dashArray: p.mapPrecision === "dokladna" ? undefined : "6 5",
        fillColor: wrazliwa ? "#fb923c" : "#4ade80",
        fillOpacity: p.mapPrecision === "dokladna" ? 0.12 : 0.18,
      });
      poiStrefyGroup.addLayer(kolo);
    }
  }

  if (otwartyId) {
    const marker = poiMarkersById.get(otwartyId);
    if (marker) {
      requestAnimationFrame(() => {
        try {
          marker.openPopup();
        } catch {
          /* ignore */
        }
      });
    }
  }
}

function syncWarstwy(
  L: LeafletNs,
  inst: InstancjaLeaflet,
  znaczniki: ZnacznikWsi[],
  punktyRynek: ZnacznikRynek[],
  punktyRynekDzialki: ZnacznikRynekDzialka[],
  punktyZgloszenia: ZnacznikZgloszenie[],
  punktyPolowania: ZnacznikPolowanie[],
  ostrzezeniaLesne: ZnacznikOstrzezeniaLesnego[],
  obrysyGminy: ZnacznikWsi[],
  obrysGminyUrzedowy: GeoJsonObject | null,
  obrysPowiatu: GeoJsonObject | null,
  obrysWojewodztwa: GeoJsonObject | null,
  nadlesnictwaObrysy: ObrysNadlesnictwaMapy[],
  lesnictwaObrysy: ObrysLesnictwaMapy[],
  obwodyLowieckieObrysy: ObrysObwoduLowieckiegoMapy[],
  punktyKola: ZnacznikKoloLowieckie[],
  rewiryLowieckie: ZnacznikRewirLowiecki[],
  punktyCmentarze: ZnacznikCmentarzObrys[],
  ikona: import("leaflet").DivIcon,
  bbox: [[number, number], [number, number]] | null,
  granicePoId: Record<string, unknown>,
  opts?: { pokazGranice?: boolean; pokazEgib?: boolean; trybLowiectwo?: boolean },
) {
  const pokazGranice = opts?.pokazGranice !== false;
  const pokazEgib = opts?.pokazEgib !== false;
  const trybLowiectwo = opts?.trybLowiectwo === true;
  const egibWidoczny = pokazEgib && czyKiegWidocznyNaZoomie(inst.map.getZoom());
  const { map, cluster, inneObrysyGroup, markersById, polowaniaById, lesneById, rynekDzialkiById } = inst;
  if (!czyMapaLeafletOperacyjna(map)) return;
  ustawPaneWarstwicyGranicy(map);

  (cluster as import("leaflet").LayerGroup).clearLayers();
  inneObrysyGroup.clearLayers();
  markersById.clear();
  polowaniaById.clear();
  lesneById.clear();
  rynekDzialkiById.clear();

  if (obrysWojewodztwa) {
    try {
      const warstwaWoj = L.geoJSON(obrysWojewodztwa, {
        pane: PANE_GRANICE,
        interactive: false,
        style: {
          color: "#0369a1",
          weight: 3,
          fillColor: "#38bdf8",
          fillOpacity: 0.04,
          opacity: 0.75,
          dashArray: "14 8",
        },
      } as import("leaflet").GeoJSONOptions);
      inneObrysyGroup.addLayer(warstwaWoj);
    } catch {
      /* ignore */
    }
  }

  if (obrysPowiatu) {
    try {
      const warstwaPow = L.geoJSON(obrysPowiatu, {
        pane: PANE_GRANICE,
        interactive: false,
        style: {
          color: "#6d28d9",
          weight: 4,
          fillColor: "#a78bfa",
          fillOpacity: 0.06,
          opacity: 0.9,
          dashArray: "10 6",
        },
      } as import("leaflet").GeoJSONOptions);
      inneObrysyGroup.addLayer(warstwaPow);
    } catch {
      /* ignore */
    }
  }

  if (obrysGminyUrzedowy) {
    try {
      const warstwaGmina = L.geoJSON(obrysGminyUrzedowy, {
        pane: PANE_GRANICE,
        interactive: false,
        style: {
          color: "#b45309",
          weight: 4,
          fillColor: "#f59e0b",
          fillOpacity: 0.05,
          opacity: 0.95,
        },
      } as import("leaflet").GeoJSONOptions);
      inneObrysyGroup.addLayer(warstwaGmina);
    } catch {
      /* ignore */
    }
  } else {
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
        inneObrysyGroup.addLayer(warstwa);
      } catch {
        /* ignore */
      }
    }
  }

  for (const obw of obwodyLowieckieObrysy) {
    try {
      const warstwa = L.geoJSON(obw.geojson, {
        pane: PANE_GRANICE,
        interactive: true,
        style: {
          color: "#92400e",
          weight: 2,
          fillColor: "#fbbf24",
          fillOpacity: trybLowiectwo ? 0.14 : 0.08,
          opacity: 0.82,
          dashArray: "12 6",
          className: trybLowiectwo ? "mapa-obwod-lowiecki" : "mapa-obwod-lowiecki mapa-obwod-lowiecki--spokojny",
        },
      } as import("leaflet").GeoJSONOptions);
      const linie = [
        `<h3>${escapeHtml(obw.name)}</h3>`,
        obw.dzierzawca ? `<p><strong>Dzierżawa:</strong> ${escapeHtml(obw.dzierzawca)}</p>` : "",
        obw.typ ? `<p class="text-xs text-stone-600">Typ: ${escapeHtml(obw.typ)}</p>` : "",
        `<p class="text-xs text-stone-500">Obwód łowiecki · OpenForestData (orientacyjnie)</p>`,
      ].join("");
      warstwa.bindPopup(`<div class="mapa-wsi-popup">${linie}</div>`);
      inneObrysyGroup.addLayer(warstwa);
    } catch {
      /* ignore */
    }
  }

  for (const les of lesnictwaObrysy) {
    try {
      const warstwa = L.geoJSON(les.geojson, {
        pane: PANE_GRANICE,
        interactive: true,
        style: {
          color: "#166534",
          weight: 2,
          fillColor: "#4ade80",
          fillOpacity: 0.1,
          opacity: 0.85,
          dashArray: "6 4",
        },
      } as import("leaflet").GeoJSONOptions);
      const podtytul = les.nadlesnictwo
        ? `<p class="text-xs text-stone-600">Kod LP: ${escapeHtml(les.nadlesnictwo)}</p>`
        : "";
      warstwa.bindPopup(
        `<div class="mapa-wsi-popup"><h3>${escapeHtml(les.name)}</h3>${podtytul}<p class="text-xs text-stone-500">Leśnictwo · BDL (orientacyjnie)</p></div>`,
      );
      inneObrysyGroup.addLayer(warstwa);
    } catch {
      /* ignore */
    }
  }

  for (const rew of rewiryLowieckie) {
    try {
      const warstwa = L.geoJSON(rew.geojson, {
        pane: PANE_GRANICE,
        interactive: true,
        style: {
          color: "#14532d",
          weight: 2.5,
          fillColor: "#22c55e",
          fillOpacity: 0.14,
          opacity: 0.88,
          dashArray: "10 6",
          className: trybLowiectwo ? "mapa-rewir-lowiecki" : "mapa-rewir-lowiecki mapa-rewir-lowiecki--spokojny",
        },
        onEachFeature(_feature, layer) {
          if (typeof (layer as import("leaflet").Path).bringToFront === "function") {
            (layer as import("leaflet").Path).bringToFront();
          }
        },
      } as import("leaflet").GeoJSONOptions);
      warstwa.bindPopup(htmlPopupRewir(rew));
      inneObrysyGroup.addLayer(warstwa);
    } catch {
      /* ignore */
    }
  }

  for (const nadl of nadlesnictwaObrysy) {
    try {
      const warstwa = L.geoJSON(nadl.geojson, {
        pane: PANE_GRANICE,
        interactive: true,
        style: {
          color: "#3f6212",
          weight: 2,
          fillColor: "#84cc16",
          fillOpacity: 0.1,
          opacity: 0.8,
          dashArray: "8 5",
        },
      } as import("leaflet").GeoJSONOptions);
      warstwa.bindPopup(
        `<div class="mapa-wsi-popup"><h3>${escapeHtml(nadl.name)}</h3><p class="text-xs text-stone-600">Nadleśnictwo LP · PRG U06 (orientacyjnie)</p></div>`,
      );
      inneObrysyGroup.addLayer(warstwa);
    } catch {
      /* ignore */
    }
  }

  for (const z of znaczniki) {
    const gj = granicaJakoGeoJson(granicePoId[z.id] ?? z.boundary_geojson);
    const wariant: WariantGranicyWPopup =
      !pokazGranice ? (gj ? "geojson" : "punkt") : gj ? "geojson" : egibWidoczny ? "punkt" : "pozor";

    const marker = L.marker([z.lat, z.lon], { icon: ikona, title: z.name });
    marker.bindPopup(htmlPopup(z, wariant), { closeOnClick: false });
    (cluster as import("leaflet").LayerGroup).addLayer(marker);
    markersById.set(z.id, marker);
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
      inneObrysyGroup.addLayer(warstwa);
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
      inneObrysyGroup.addLayer(warstwa);
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
    const odlicz = tekstOdliczaniaPolowania(pol.startsAt, pol.endsAt);
    const etykietaFazy =
      pol.faza === "aktywne"
        ? '<span class="mapa-polowanie-badge mapa-polowanie-badge--aktywne">Trwa teraz</span>'
        : '<span class="mapa-polowanie-badge mapa-polowanie-badge--nadchodzace">Zaplanowane</span>';
    return `<div class="mapa-wsi-popup">
      ${etykietaFazy}
      <strong>Polowanie</strong><br/>${escapeHtml(pol.title)}<br/>${escapeHtml(pol.areaDescription)}<br/>
      <span class="text-xs">${escapeHtml(pol.villageName)} · ${escapeHtml(termin)}</span>
      ${odlicz ? `<p class="mapa-polowanie-odliczanie">${escapeHtml(odlicz)}</p>` : ""}
      <p class="mapa-wsi-popup-foot">
        <a href="${profil}">Profil wsi →</a>
        <span aria-hidden="true"> · </span>
        <a href="/mapa?polowanie=${encodeURIComponent(pol.id)}">Link do obszaru</a>
      </p>
    </div>`;
  };

  const stylPolowania = (pol: ZnacznikPolowanie) =>
    pol.faza === "aktywne"
      ? {
          color: "#991b1b",
          weight: 3,
          fillColor: "#dc2626",
          fillOpacity: 0.42,
          opacity: 0.95,
        }
      : {
          color: "#c2410c",
          weight: 3,
          fillColor: "#fb923c",
          fillOpacity: 0.22,
          opacity: 0.9,
          dashArray: "8 5",
        };

  for (const pol of punktyPolowania) {
    const gj = granicaJakoGeoJson(pol.areaGeojson);
    if (gj) {
      try {
        const s = stylPolowania(pol);
        const warstwa = L.geoJSON(gj, {
          pane: PANE_GRANICE,
          interactive: true,
          style: {
            color: s.color,
            weight: s.weight,
            fillColor: s.fillColor,
            fillOpacity: s.fillOpacity,
            opacity: s.opacity,
            dashArray: s.dashArray,
          },
        } as import("leaflet").GeoJSONOptions);
        if (pol.faza === "aktywne") {
          try {
            const halo = L.geoJSON(gj, {
              pane: PANE_GRANICE,
              interactive: false,
              style: { color: "#fecaca", weight: 10, fill: false, opacity: 0.45 },
            } as import("leaflet").GeoJSONOptions);
            inneObrysyGroup.addLayer(halo);
          } catch {
            /* ignore */
          }
          warstwa.on("add", () => {
            warstwa.getLayers().forEach((l) => {
              const el = (l as import("leaflet").Path).getElement?.();
              if (el) el.classList.add("mapa-polowanie-obszar--aktywne");
            });
          });
        }
        warstwa.bindPopup(htmlPopupPolowanie(pol));
        inneObrysyGroup.addLayer(warstwa);
        polowaniaById.set(pol.id, warstwa);
        continue;
      } catch {
        /* fallback pinezka */
      }
    }
    const aktywne = pol.faza === "aktywne";
    const pin = L.circleMarker([pol.lat, pol.lon], {
      radius: aktywne ? 11 : 9,
      color: aktywne ? "#7f1d1d" : "#c2410c",
      weight: 2,
      fillColor: aktywne ? "#dc2626" : "#fb923c",
      fillOpacity: aktywne ? 0.45 : 0.3,
      className: aktywne ? "mapa-polowanie-pinezka--aktywne" : "",
    });
    pin.bindPopup(htmlPopupPolowanie(pol));
    (cluster as import("leaflet").LayerGroup).addLayer(pin);
    polowaniaById.set(pol.id, pin);
  }

  const htmlPopupLesne = (o: ZnacznikOstrzezeniaLesnego) => {
    const fmt = new Intl.DateTimeFormat("pl-PL", { dateStyle: "short", timeStyle: "short" });
    const termin = `${fmt.format(new Date(o.startsAt))} – ${fmt.format(new Date(o.endsAt))}`;
    const rodzaj = `${ikonaRodzajuOstrzezenia(o.noticeKind)} ${etykietaRodzajuOstrzezenia(o.noticeKind)}`;
    const faza =
      o.faza === "aktywne"
        ? '<span class="mapa-polowanie-badge mapa-polowanie-badge--aktywne">Obowiązuje</span>'
        : '<span class="mapa-polowanie-badge mapa-polowanie-badge--nadchodzace">Zaplanowane</span>';
    return `<div class="mapa-wsi-popup">
      ${faza}
      <strong>${escapeHtml(rodzaj)}</strong><br/>${escapeHtml(o.title)}<br/>${escapeHtml(o.areaDescription)}<br/>
      <span class="text-xs">${escapeHtml(o.villageName)} · ${escapeHtml(termin)}</span>
      <p class="mapa-wsi-popup-foot">
        <a href="${o.villageSciezka.replace(/"/g, "")}/lesnictwo">Profil leśny →</a>
      </p>
    </div>`;
  };

  const stylLesne = (o: ZnacznikOstrzezeniaLesnego) =>
    o.faza === "aktywne"
      ? {
          color: "#14532d",
          weight: 3,
          fillColor: "#22c55e",
          fillOpacity: 0.35,
          opacity: 0.92,
        }
      : {
          color: "#166534",
          weight: 2,
          fillColor: "#86efac",
          fillOpacity: 0.18,
          opacity: 0.85,
          dashArray: "10 6",
        };

  for (const o of ostrzezeniaLesne) {
    const gj = granicaJakoGeoJson(o.areaGeojson);
    if (gj) {
      try {
        const s = stylLesne(o);
        const warstwa = L.geoJSON(gj, {
          pane: PANE_GRANICE,
          interactive: true,
          style: s,
        } as import("leaflet").GeoJSONOptions);
        warstwa.bindPopup(htmlPopupLesne(o));
        inneObrysyGroup.addLayer(warstwa);
        lesneById.set(o.id, warstwa);
        continue;
      } catch {
        /* fallback */
      }
    }
    const aktywne = o.faza === "aktywne";
    const pin = L.circleMarker([o.lat, o.lon], {
      radius: aktywne ? 10 : 8,
      color: "#14532d",
      weight: 2,
      fillColor: aktywne ? "#22c55e" : "#86efac",
      fillOpacity: aktywne ? 0.5 : 0.35,
    });
    pin.bindPopup(htmlPopupLesne(o));
    (cluster as import("leaflet").LayerGroup).addLayer(pin);
    lesneById.set(o.id, pin);
  }

  const ikonaKolo = zbudujIkoneKolo(L);
  for (const k of punktyKola) {
    const pin = L.marker([k.lat, k.lon], { icon: ikonaKolo, zIndexOffset: 440, title: k.name });
    pin.bindPopup(htmlPopupKolo(k));
    (cluster as import("leaflet").LayerGroup).addLayer(pin);
  }

  if (bbox) {
    const kluczBbox = kluczBboxMapy(bbox);
    if (kluczBbox && kluczBbox !== inst.ostatniFitBboxKlucz) {
      /** Przy jednej wsi sztywne maxZoom 12 zostawiało mapę za daleko — granica ledwo widoczna. */
      const maxZoom =
        znaczniki.length <= 1 ? 17 : znaczniki.length <= 4 ? 16 : znaczniki.length <= 12 ? 14 : znaczniki.length <= 40 ? 13 : 12;
      try {
        map.stop();
        map.fitBounds(bbox, { padding: [32, 32], maxZoom, animate: false });
        inst.ostatniFitBboxKlucz = kluczBbox;
        requestAnimationFrame(() => bezpieczneInvalidateSize(map));
      } catch {
        /* ignore — np. mapa w trakcie zoomu kółkiem myszy */
      }
    }
  } else if (inst.ostatniFitBboxKlucz == null) {
    try {
      map.stop();
      map.setView([52.1, 19.3], 6);
      inst.ostatniFitBboxKlucz = "domyslny";
    } catch {
      /* ignore */
    }
  }
}

export const MapaWsiLeaflet = MapaWsiLeafletInner;
