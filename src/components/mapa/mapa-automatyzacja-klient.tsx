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
  villageIdsBezTransportu: string[];
  statystyki: StatystykiMapy;
};

/**
 * W tle: granice PRG + POI/transport dla wsi bez przystanków (gdy admin skonfigurowany).
 */
export function MapaAutomatyzacjaKlient({
  znaczniki,
  villageIdsBezTransportu,
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
      bezObrysu >= 3 || (villageIdsBezTransportu.length >= 5 && statystyki.lacznie >= 10);
    if (!potrzeba) return;
    uruchomiono.current = true;
    setTrwa(true);
    setStatus("Uzupełniam dane mapy w tle (granice, punkty, transport)…");

    void uruchomUzupelnienieMapyZMapy({ villageIdsBezTransportu }).then((w) => {
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
        czesci.push(`POI: +${w.poi.added}`);
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
  }, [znaczniki, villageIdsBezTransportu, statystyki.lacznie, router]);

  if (!status) return null;

  return (
    <p
      className={`mx-4 mt-3 rounded-lg border px-3 py-2 text-xs md:mx-6 ${
        trwa
          ? "border-blue-200 bg-blue-50 text-blue-950"
          : "border-green-200 bg-green-50 text-green-950"
      }`}
      role="status"
    >
      {status}
    </p>
  );
}
