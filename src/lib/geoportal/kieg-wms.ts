/**
 * Krajowa Integracja Ewidencji Gruntów (KIEG) — zbiorcza usługa WMS GUGiK.
 * Te same granice obrębów i działek co na geoportal.gov.pl (warstwa EGiB).
 * @see https://www.geoportal.gov.pl/pl/dane/ewidencja-gruntow-i-budynkow-egib/
 */

export const KIEG_WMS_URL =
  process.env.NEXT_PUBLIC_GEOPORTAL_EGIB_WMS_URL?.trim() ||
  "https://integracja.gugik.gov.pl/cgi-bin/KrajowaIntegracjaEwidencjiGruntow";

export const KIEG_WMS_LAYERS =
  process.env.NEXT_PUBLIC_GEOPORTAL_EGIB_WMS_LAYERS?.trim() || "obreby,dzialki";

/** Poniżej tego zoomu kafelki EGiB są ukryte (wydajność + czytelność krajobrazu). */
export const KIEG_WMS_MIN_ZOOM = 11;

export const CZY_KIEG_WMS_DOSTEPNY = KIEG_WMS_URL.length > 0 && KIEG_WMS_LAYERS.length > 0;

export const PANE_KIEG_WMS = "naszawiesEgib";

export function opcjeWarstwyKiegWms(): {
  layers: string;
  format: string;
  transparent: boolean;
  version: string;
  opacity: number;
  minZoom: number;
  maxZoom: number;
  pane: string;
} {
  return {
    layers: KIEG_WMS_LAYERS,
    format: "image/png",
    transparent: true,
    version: "1.3.0",
    opacity: 1,
    minZoom: KIEG_WMS_MIN_ZOOM,
    maxZoom: 22,
    pane: PANE_KIEG_WMS,
  };
}

export function czyKiegWidocznyNaZoomie(zoom: number): boolean {
  return zoom >= KIEG_WMS_MIN_ZOOM;
}
