"use client";

import dynamic from "next/dynamic";
import type { ZnacznikPoi } from "@/components/mapa/mapa-wsi-leaflet";

const MapaWsiLeaflet = dynamic(
  () => import("@/components/mapa/mapa-wsi-leaflet").then((m) => ({ default: m.MapaWsiLeaflet })),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex h-[min(320px,45dvh)] items-center justify-center rounded-xl border border-dashed border-green-900/15 bg-stone-50"
        aria-busy="true"
      >
        <p className="text-sm text-stone-500">Ładowanie mapy…</p>
      </div>
    ),
  },
);

type Props = {
  pinezka: ZnacznikPoi;
};

export function MiejscePoiMapaLokalizacji({ pinezka }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 shadow-sm ring-1 ring-stone-900/[0.03]">
      <MapaWsiLeaflet znaczniki={[]} punktyPoi={[pinezka]} pokazRynek={false} wysokoscMapy="kompakt" />
    </div>
  );
}
