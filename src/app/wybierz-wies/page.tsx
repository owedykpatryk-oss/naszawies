import type { Metadata } from "next";
import { StronaWRozbudowie } from "@/components/strona-w-rozbudowie";

export const metadata: Metadata = {
  title: "Wybierz wieś",
};

export default function WybierzWiesPage() {
  return (
    <StronaWRozbudowie
      tytul="Wybór wsi"
      opis="Dla mieszkańca: wybór wsi z katalogu TERYT przed złożeniem wniosku o rolę — w przygotowaniu."
      kodDokumentacji="Cloude Docs/naszawies-package/docs/FEATURES.md"
    />
  );
}
