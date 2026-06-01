"use client";

import dynamic from "next/dynamic";
import { znacznikiHistoriiNaMapie } from "@/lib/historia/znaczniki-historii-na-mapie";
import type { WpisHistoriiPubliczny } from "@/lib/historia/typy-historii";

const MapaHistoriaWsiEmbedded = dynamic(
  () =>
    import("@/components/wies/mapa-historia-wsi-embedded").then((m) => ({
      default: m.MapaHistoriaWsiEmbedded,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-amber-200 bg-amber-50/30 text-sm text-stone-500">
        Ładowanie mapy…
      </div>
    ),
  },
);

type Props = {
  wpis: WpisHistoriiPubliczny;
  villageId: string;
  villageName: string;
  sciezkaProfilu: string;
};

export function MapaJednegoWydarzeniaHistoria({ wpis, villageId, villageName, sciezkaProfilu }: Props) {
  if (wpis.latitude == null || wpis.longitude == null) return null;
  const pinezki = znacznikiHistoriiNaMapie([wpis], villageId, villageName, sciezkaProfilu);
  return (
    <div className="mt-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-amber-900/80">Miejsce na mapie</h2>
      <MapaHistoriaWsiEmbedded pinezki={pinezki} />
    </div>
  );
}
