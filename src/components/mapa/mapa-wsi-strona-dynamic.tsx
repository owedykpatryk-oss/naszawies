"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { MapaWsiStrona } from "./mapa-wsi-strona";

export function MapaWsiStronaSkeleton() {
  return (
    <div
      className="mapa-widget-pelny flex min-h-[280px] flex-col items-center justify-center gap-3 bg-gradient-to-b from-stone-50 to-emerald-50/30"
      role="status"
      aria-live="polite"
      aria-label="Ładowanie mapy"
    >
      <div className="h-10 w-10 animate-pulse rounded-full bg-gradient-to-br from-green-200 to-emerald-100" />
      <p className="text-sm font-medium text-green-900/80">Ładowanie mapy…</p>
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
  return <MapaWsiStronaLazy {...props} />;
}
