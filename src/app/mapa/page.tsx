import type { Metadata } from "next";
import { StronaWRozbudowie } from "@/components/strona-w-rozbudowie";

export const metadata: Metadata = {
  title: "Mapa wsi",
};

export default function MapaPage() {
  return (
    <StronaWRozbudowie
      tytul="Mapa wsi w Polsce"
      opis="Interaktywna mapa z filtrami (województwo, aktywne wsie) — w planie po imporcie TERYT i pierwszych aktywnych profilach."
      kodDokumentacji="Cloude Docs/naszawies-package/frontend/FRONTEND.md"
    />
  );
}
