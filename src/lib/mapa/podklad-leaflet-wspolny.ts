/** Wspólne podkłady Leaflet (mapa publiczna + edytor sołtysa). */
export const URL_PODKLAD_MAPA =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
export const URL_PODKLAD_SATELITA =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
export const URL_PODKLAD_ETYKIETY_SATELITA =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";

export type RodzajPodkladuMapyEdytor = "mapa" | "satelita";

export type LeafletModul = typeof import("leaflet");

export function ustawPodkladEdytoraMapy(
  L: LeafletModul,
  map: import("leaflet").Map,
  warstwy: {
    mapa: import("leaflet").TileLayer;
    satelita: import("leaflet").TileLayer;
    etykiety: import("leaflet").TileLayer;
  },
  rodzaj: RodzajPodkladuMapyEdytor,
) {
  for (const w of [warstwy.mapa, warstwy.satelita, warstwy.etykiety]) {
    if (map.hasLayer(w)) map.removeLayer(w);
  }
  if (rodzaj === "satelita") {
    warstwy.satelita.addTo(map);
    warstwy.etykiety.addTo(map);
  } else {
    warstwy.mapa.addTo(map);
  }
}

export function utworzWarstwyPodkladu(L: LeafletModul) {
  const mapa = L.tileLayer(URL_PODKLAD_MAPA, {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 19,
  });
  const satelita = L.tileLayer(URL_PODKLAD_SATELITA, {
    attribution:
      'Zdjęcia &copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics',
    maxZoom: 19,
  });
  const etykiety = L.tileLayer(URL_PODKLAD_ETYKIETY_SATELITA, {
    attribution: 'Etykiety &copy; <a href="https://www.esri.com/">Esri</a>',
    maxZoom: 19,
    opacity: 0.88,
  });
  return { mapa, satelita, etykiety };
}
