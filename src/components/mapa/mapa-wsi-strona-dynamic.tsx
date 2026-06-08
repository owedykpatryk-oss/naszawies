"use client";

import dynamic from "next/dynamic";
import { Suspense, type ComponentProps } from "react";
import type { MapaWsiStrona } from "./mapa-wsi-strona";

export function MapaWsiStronaSkeleton() {
  return (
    <div
      className="mapa-widget-pelny relative flex min-h-[280px] flex-1 flex-col overflow-hidden bg-stone-200/50"
      role="status"
      aria-live="polite"
      aria-label="Ładowanie mapy"
    >
      <div className="absolute inset-0 animate-pulse bg-[linear-gradient(110deg,#e7e5e4_8%,#f5f5f4_18%,#e7e5e4_33%)] bg-[length:200%_100%]" />
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-3 p-6">
        <div className="h-11 w-11 rounded-full border-2 border-green-800/20 border-t-green-800/70 animate-spin" />
        <p className="text-sm font-medium text-green-950/80">Ładowanie mapy i warstw…</p>
      </div>
    </div>
  );
}

const MapaWsiStronaLazy = dynamic(
  () => import("./mapa-wsi-strona").then((m) => ({ default: m.MapaWsiStrona })),
  {
    ssr: false,
    loading: () => <MapaWsiStronaSkeleton />,
  },
);

export function MapaWsiStronaDynamic(props: ComponentProps<typeof MapaWsiStrona>) {
  return (
    <Suspense fallback={<MapaWsiStronaSkeleton />}>
      <MapaWsiStronaLazy {...props} />
    </Suspense>
  );
}
