"use client";

import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { modulPomocyZeSciezki } from "@/lib/pomoc/przewodniki-modulow";

const PrzewodnikModuluAuto = dynamic(
  () => import("@/components/pomoc/przewodnik-modulu-auto").then((m) => ({ default: m.PrzewodnikModuluAuto })),
  { ssr: false },
);

/** Opakowanie — samo sprawdza ścieżkę, ciężki przewodnik ładuje się dopiero gdy trzeba. */
export function PrzewodnikModuluLeniwy() {
  const pathname = usePathname() ?? "";
  const modul = modulPomocyZeSciezki(pathname);
  if (!modul) return null;
  return <PrzewodnikModuluAuto modul={modul} />;
}
