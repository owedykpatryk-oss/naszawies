"use client";

import { CZY_KIEG_WMS_DOSTEPNY, KIEG_WMS_MIN_ZOOM } from "@/lib/geoportal/kieg-wms";

type MapaEgibToastProps = {
  widoczny: boolean;
  zoomMapy: number;
  onPrzybliz?: () => void;
};

export function MapaEgibToast({ widoczny, zoomMapy, onPrzybliz }: MapaEgibToastProps) {
  if (!CZY_KIEG_WMS_DOSTEPNY || !widoczny) return null;

  return (
    <div className="mapa-egib-toast" role="status" aria-live="polite">
      <span className="mapa-egib-toast__ikona" aria-hidden>
        📐
      </span>
      <p className="mapa-egib-toast__tekst">
        Granice EGiB widoczne od zoomu <strong>{KIEG_WMS_MIN_ZOOM}</strong>
        <span className="mapa-egib-toast__zoom"> (teraz {zoomMapy})</span>
      </p>
      {onPrzybliz ? (
        <button type="button" className="mapa-egib-toast__btn" onClick={onPrzybliz}>
          Przybliż
        </button>
      ) : null}
    </div>
  );
}
