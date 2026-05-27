"use client";

import { useEffect, useRef } from "react";
import { uruchomSyncGraniceZMapy } from "@/app/(site)/mapa/akcje";
import type { ZnacznikWsi } from "./mapa-wsi-leaflet";

type Props = {
  znaczniki: ZnacznikWsi[];
};

/**
 * Po wejściu na mapę — w tle uzupełnia brakujące granice PRG (jeśli jest dużo wsi bez obrysu).
 */
export function MapaSyncGraniceKlient({ znaczniki }: Props) {
  const uruchomiono = useRef(false);

  useEffect(() => {
    if (uruchomiono.current) return;
    const bezObrysu = znaczniki.filter((z) => !z.boundary_geojson).length;
    if (bezObrysu < 3) return;
    uruchomiono.current = true;

    void uruchomSyncGraniceZMapy().then((w) => {
      if (w.ok && w.summary.updatedBoundaries > 0) {
        window.setTimeout(() => window.location.reload(), 2500);
      }
    });
  }, [znaczniki]);

  return null;
}
