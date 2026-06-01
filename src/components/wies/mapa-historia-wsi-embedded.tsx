"use client";

import dynamic from "next/dynamic";
import type { ZnacznikPoi } from "@/components/mapa/mapa-wsi-leaflet";

const MapaWsiLeaflet = dynamic(
  () => import("@/components/mapa/mapa-wsi-leaflet").then((m) => ({ default: m.MapaWsiLeaflet })),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex h-[min(320px,45dvh)] items-center justify-center rounded-xl border border-dashed border-amber-900/15 bg-amber-50/40"
        aria-busy="true"
      >
        <p className="text-sm text-stone-500">Ładowanie mapy miejsc…</p>
      </div>
    ),
  },
);

type Props = {
  pinezki: ZnacznikPoi[];
};

export function MapaHistoriaWsiEmbedded({ pinezki }: Props) {
  if (pinezki.length === 0) return null;

  return (
    <div className="mt-5 overflow-hidden rounded-xl border border-amber-200/80 shadow-sm ring-1 ring-amber-900/[0.04]">
      <MapaWsiLeaflet znaczniki={[]} punktyPoi={pinezki} pokazRynek={false} wysokoscMapy="kompakt" />
      <p className="border-t border-amber-100/80 bg-amber-50/50 px-3 py-2 text-xs text-stone-600">
        Pinezki oznaczają miejsca powiązane z wpisami kroniki — kliknij, aby przejść do opisu.
      </p>
    </div>
  );
}
