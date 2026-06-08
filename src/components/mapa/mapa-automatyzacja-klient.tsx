"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { uruchomUzupelnienieMapyZMapy } from "@/app/(site)/mapa/akcje";
import type { StatystykiMapy } from "./mapa-statystyki-banner";

type ZnacznikDoSync = {
  id: string;
  boundary_geojson: unknown | null;
};

type Props = {
  znaczniki: ZnacznikDoSync[];
  villageIdsDoUzupelnienia: string[];
  statystyki: StatystykiMapy;
};

/**
 * W tle: granice PRG + POI/transport dla wsi z małą liczbą punktów lub bez transportu.
 */
export function MapaAutomatyzacjaKlient({
  znaczniki,
  villageIdsDoUzupelnienia,
  statystyki,
}: Props) {
  const router = useRouter();
  const uruchomiono = useRef(false);
  const [status, setStatus] = useState<string | null>(null);
  const [trwa, setTrwa] = useState(false);

  useEffect(() => {
    if (uruchomiono.current) return;
    const bezObrysu = znaczniki.filter((z) => !z.boundary_geojson).length;
    const potrzeba =
      bezObrysu >= 3 ||
      (villageIdsDoUzupelnienia.length >= 4 && statystyki.lacznie >= 8) ||
      (statystyki.zMalymPoi >= 15 && statystyki.lacznie >= 20);
    if (!potrzeba) return;
    uruchomiono.current = true;
    setTrwa(true);
    setStatus("Uzupełniam dane mapy w tle (granice, OSM, Geoportal, transport)…");

    void uruchomUzupelnienieMapyZMapy({ villageIdsDoUzupelnienia }).then((w) => {
      setTrwa(false);
      if (!w.ok) {
        setStatus(null);
        return;
      }
      const czesci: string[] = [];
      if (w.granice.updatedBoundaries > 0) {
        czesci.push(`obrysy: ${w.granice.updatedBoundaries}`);
      }
      if (w.poi.added > 0) {
        czesci.push(`POI OSM: +${w.poi.added}`);
      }
      if (w.geoKontekst.upsertedPrng + w.geoKontekst.upsertedInstitutional > 0) {
        czesci.push(
          `Geoportal: +${w.geoKontekst.upsertedPrng + w.geoKontekst.upsertedInstitutional}`,
        );
      }
      if (w.poiGeoportal.added > 0) {
        czesci.push(`POI PRNG: +${w.poiGeoportal.added}`);
      }
      if (w.transport.departuresUpserted > 0) {
        czesci.push(`PKP: ${w.transport.departuresUpserted} odjazdów`);
      }
      if (w.autobus.departuresUpserted > 0) {
        czesci.push(`autobusy: ${w.autobus.departuresUpserted}`);
      }
      if (w.autobus.przystankiPoiUtworzono > 0) {
        czesci.push(`przystanki: +${w.autobus.przystankiPoiUtworzono}`);
      }
      if (czesci.length === 0) {
        setStatus(null);
        return;
      }
      setStatus(`Zaktualizowano mapę (${czesci.join(", ")}). Odświeżam…`);
      window.setTimeout(() => router.refresh(), 2200);
    });
  }, [znaczniki, villageIdsDoUzupelnienia, statystyki.lacznie, statystyki.zMalymPoi, router]);

  if (!status) return null;

  return (
    <p
      className={`mapa-toast-sync pointer-events-none fixed z-[430] mx-3 max-w-sm rounded-xl border px-3 py-2 text-xs shadow-lg backdrop-blur-md ${
        trwa
          ? "border-blue-200/90 bg-blue-50/95 text-blue-950"
          : "border-green-200/90 bg-green-50/95 text-green-950"
      }`}
      role="status"
    >
      {status}
    </p>
  );
}
