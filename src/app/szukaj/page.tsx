import type { Metadata } from "next";
import { StronaWRozbudowie } from "@/components/strona-w-rozbudowie";

export const metadata: Metadata = {
  title: "Szukaj wsi",
};

export default function SzukajPage() {
  return (
    <StronaWRozbudowie
      tytul="Wyszukiwarka wsi"
      opis="Tu pojawi się wyszukiwarka po nazwie miejscowości i gminie (dane TERYT). Na razie zapisz się na listę oczekujących ze strony głównej."
      kodDokumentacji="Cloude Docs/naszawies-package/frontend/FRONTEND.md"
    />
  );
}
