import type { KafelSatelitarny } from "@/lib/cmentarz/podklad-satelitarny";
import type { ElementPlanuCmentarza } from "@/lib/cmentarz/plan-cmentarza";
import { VB_PLAN_SZER, VB_PLAN_WYS } from "@/lib/planner/edytor-plan-procent";

/** Affine mapowanie obrysu WGS84 ↔ viewBox planu (100×70). */
export type GeorefCmentarza = {
  vb_x: number;
  vb_y: number;
  vb_w: number;
  vb_h: number;
  min_lat: number;
  max_lat: number;
  min_lng: number;
  max_lng: number;
  zoom_satelity: number;
};

const ROZMIAR_KAFELKA = 256;
const URL_SATELITA =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile";

function pierwszePierscienie(
  geo: GeoJSON.Polygon | GeoJSON.MultiPolygon,
): GeoJSON.Position[][] {
  if (geo.type === "Polygon") return geo.coordinates[0] ? [geo.coordinates[0]] : [];
  return geo.coordinates.map((p) => p[0]!).filter(Boolean);
}

function bboxWgs84(geo: GeoJSON.Polygon | GeoJSON.MultiPolygon): {
  min_lat: number;
  max_lat: number;
  min_lng: number;
  max_lng: number;
} | null {
  let min_lat = Infinity;
  let max_lat = -Infinity;
  let min_lng = Infinity;
  let max_lng = -Infinity;
  for (const ring of pierwszePierscienie(geo)) {
    for (const c of ring) {
      const lng = c[0];
      const lat = c[1];
      if (typeof lng !== "number" || typeof lat !== "number") continue;
      min_lat = Math.min(min_lat, lat);
      max_lat = Math.max(max_lat, lat);
      min_lng = Math.min(min_lng, lng);
      max_lng = Math.max(max_lng, lng);
    }
  }
  if (!Number.isFinite(min_lat)) return null;
  return { min_lat, max_lat, min_lng, max_lng };
}

function odlegloscMetry(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pikseleSwiata(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const skala = ROZMIAR_KAFELKA * 2 ** zoom;
  const x = ((lng + 180) / 360) * skala;
  const sin = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * skala;
  return { x, y };
}

function zoomDlaRozmiaruObrysu(
  min_lat: number,
  max_lat: number,
  min_lng: number,
  max_lng: number,
): number {
  const szerM = odlegloscMetry(min_lat, min_lng, min_lat, max_lng);
  const wysM = odlegloscMetry(min_lat, min_lng, max_lat, min_lng);
  const maxM = Math.max(szerM, wysM, 20);
  if (maxM < 80) return 19;
  if (maxM < 160) return 18;
  if (maxM < 320) return 17;
  if (maxM < 640) return 16;
  return 15;
}

/** Wyznacza georeferencję: bbox obrysu OSM → prostokąt w viewBox (z marginesem). */
export function georefZCmentarzaBoundary(
  boundary: GeoJSON.Polygon | GeoJSON.MultiPolygon,
  opts?: { marginesVb?: number; zoom?: number; vbW?: number; vbH?: number },
): GeorefCmentarza | null {
  const box = bboxWgs84(boundary);
  if (!box) return null;

  const vbW = opts?.vbW ?? VB_PLAN_SZER;
  const vbH = opts?.vbH ?? VB_PLAN_WYS;
  const marg = Math.max(0, Math.min(15, opts?.marginesVb ?? 4));

  const aspectGeo = (box.max_lng - box.min_lng) / Math.max(1e-9, box.max_lat - box.min_lat);
  const aspectVb = vbW / vbH;
  let vb_w = vbW - 2 * marg;
  let vb_h = vbH - 2 * marg;
  if (aspectGeo > aspectVb) {
    vb_h = vb_w / aspectGeo;
  } else {
    vb_w = vb_h * aspectGeo;
  }
  const vb_x = (vbW - vb_w) / 2;
  const vb_y = (vbH - vb_h) / 2;

  const zoom = opts?.zoom ?? zoomDlaRozmiaruObrysu(box.min_lat, box.max_lat, box.min_lng, box.max_lng);

  return {
    vb_x,
    vb_y,
    vb_w,
    vb_h,
    ...box,
    zoom_satelity: zoom,
  };
}

export function wgs84DoViewBox(lat: number, lng: number, g: GeorefCmentarza): { x: number; y: number } {
  const x = g.vb_x + ((lng - g.min_lng) / (g.max_lng - g.min_lng)) * g.vb_w;
  const y = g.vb_y + ((g.max_lat - lat) / (g.max_lat - g.min_lat)) * g.vb_h;
  return { x, y };
}

export function viewBoxDoWgs84(x: number, y: number, g: GeorefCmentarza): { lat: number; lng: number } {
  const lng = g.min_lng + ((x - g.vb_x) / g.vb_w) * (g.max_lng - g.min_lng);
  const lat = g.max_lat - ((y - g.vb_y) / g.vb_h) * (g.max_lat - g.min_lat);
  return { lat, lng };
}

export function srodekElementuWBbox(el: ElementPlanuCmentarza): { x: number; y: number } {
  return { x: el.x + el.szer / 2, y: el.y + el.wys / 2 };
}

export function wspolrzedneElementuPlanu(
  el: ElementPlanuCmentarza,
  g: GeorefCmentarza,
): { lat: number; lng: number } {
  const s = srodekElementuWBbox(el);
  return viewBoxDoWgs84(s.x, s.y, g);
}

/** ~ile metrów ma 1 jednostka viewBox (w środku obrysu). */
export function metryNaJednostkeViewBox(g: GeorefCmentarza): number {
  const cx = g.vb_x + g.vb_w / 2;
  const cy = g.vb_y + g.vb_h / 2;
  const s = viewBoxDoWgs84(cx, cy, g);
  const dx = viewBoxDoWgs84(cx + 1, cy, g);
  const dy = viewBoxDoWgs84(cx, cy + 1, g);
  const mX = odlegloscMetry(s.lat, s.lng, s.lat, dx.lng);
  const mY = odlegloscMetry(s.lat, s.lng, dy.lat, s.lng);
  return (mX + mY) / 2;
}

export function krokSiatkiMetry(g: GeorefCmentarza, coIleMetrow = 1): number {
  const m = metryNaJednostkeViewBox(g);
  if (m <= 0) return 1;
  return Math.max(0.15, coIleMetrow / m);
}

/** Ścieżka SVG obrysu cmentarza w viewBox. */
export function sciezkaObrysuWViewBox(
  boundary: GeoJSON.Polygon | GeoJSON.MultiPolygon,
  g: GeorefCmentarza,
): string {
  const czesci: string[] = [];
  for (const ring of pierwszePierscienie(boundary)) {
    const pts = ring
      .map((c) => {
        const p = wgs84DoViewBox(c[1]!, c[0]!, g);
        return `${p.x.toFixed(3)},${p.y.toFixed(3)}`;
      })
      .join(" L ");
    if (pts) czesci.push(`M ${pts} Z`);
  }
  return czesci.join(" ");
}

/** Kafelki satelitarne dopasowane do bbox georeferencji (nie tylko centroid). */
export function kafelkiSatelitarneGeoref(g: GeorefCmentarza): KafelSatelitarny[] {
  const zoom = g.zoom_satelity;
  const nw = pikseleSwiata(g.max_lat, g.min_lng, zoom);
  const se = pikseleSwiata(g.min_lat, g.max_lng, zoom);
  const lewoPx = Math.floor(Math.min(nw.x, se.x) / ROZMIAR_KAFELKA) * ROZMIAR_KAFELKA;
  const goraPx = Math.floor(Math.min(nw.y, se.y) / ROZMIAR_KAFELKA) * ROZMIAR_KAFELKA;
  const prawoPx = Math.ceil(Math.max(nw.x, se.x) / ROZMIAR_KAFELKA) * ROZMIAR_KAFELKA;
  const dolPx = Math.ceil(Math.max(nw.y, se.y) / ROZMIAR_KAFELKA) * ROZMIAR_KAFELKA;
  const siatkaPxW = prawoPx - lewoPx;
  const siatkaPxH = dolPx - goraPx;

  const vbNW = wgs84DoViewBox(g.max_lat, g.min_lng, g);
  const vbSE = wgs84DoViewBox(g.min_lat, g.max_lng, g);
  const vbLeft = vbNW.x;
  const vbTop = vbNW.y;
  const vbSzer = vbSE.x - vbNW.x;
  const vbWys = vbSE.y - vbNW.y;

  const wynik: KafelSatelitarny[] = [];
  for (let py = goraPx; py < dolPx; py += ROZMIAR_KAFELKA) {
    for (let px = lewoPx; px < prawoPx; px += ROZMIAR_KAFELKA) {
      const tx = Math.floor(px / ROZMIAR_KAFELKA);
      const ty = Math.floor(py / ROZMIAR_KAFELKA);
      wynik.push({
        url: `${URL_SATELITA}/${zoom}/${ty}/${tx}`,
        x: vbLeft + ((px - lewoPx) / siatkaPxW) * vbSzer,
        y: vbTop + ((py - goraPx) / siatkaPxH) * vbWys,
        szer: (ROZMIAR_KAFELKA / siatkaPxW) * vbSzer,
        wys: (ROZMIAR_KAFELKA / siatkaPxH) * vbWys,
      });
    }
  }
  return wynik;
}

export function uzupelnijWspolrzedneGrobow(
  elementy: ElementPlanuCmentarza[],
  g: GeorefCmentarza,
): ElementPlanuCmentarza[] {
  return elementy.map((el) => {
    if (el.typ !== "grob") return el;
    const { lat, lng } = wspolrzedneElementuPlanu(el, g);
    return {
      ...el,
      latitude: Math.round(lat * 1e6) / 1e6,
      longitude: Math.round(lng * 1e6) / 1e6,
    };
  });
}
