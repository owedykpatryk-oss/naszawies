"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { MapaWsiStrona } from "./mapa-wsi-strona";

const MapaWsiStronaLazy = dynamic(
  () => import("./mapa-wsi-strona").then((m) => ({ default: m.MapaWsiStrona })),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex min-h-[min(72dvh,560px)] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-green-900/20 bg-gradient-to-b from-stone-50 to-emerald-50/40 p-8"
        role="status"
        aria-live="polite"
      >
        <div className="h-10 w-10 animate-pulse rounded-full bg-gradient-to-br from-green-200 to-emerald-100" />
        <p className="text-sm font-medium text-green-900/80">Ładowanie mapy…</p>
      </div>
    ),
  },
);

export function MapaWsiStronaDynamic(props: ComponentProps<typeof MapaWsiStrona>) {
  return <MapaWsiStronaLazy {...props} />;
}
