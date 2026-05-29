"use client";

import dynamic from "next/dynamic";

const PrzewodnikModuluWewnetrzny = dynamic(
  () => import("@/components/pomoc/przewodnik-modulu").then((m) => ({ default: m.PrzewodnikModulu })),
  { ssr: false },
);

/** Automatycznie pokazuje przewodnik modułu — ładowany dopiero gdy ścieżka pasuje. */
export function PrzewodnikModuluAuto({ modul }: { modul: import("@/lib/pomoc/przewodniki-modulow").IdModuluPomocy }) {
  return <PrzewodnikModuluWewnetrzny modul={modul} />;
}
