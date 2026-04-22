import type { Metadata } from "next";
import { StronaWRozbudowie } from "@/components/strona-w-rozbudowie";

export const metadata: Metadata = {
  title: "Rejestracja",
};

export default function RejestracjaPage() {
  return (
    <StronaWRozbudowie
      tytul="Rejestracja"
      opis="Formularz rejestracji mieszkańca lub sołtysa (Supabase Auth, wybór wsi z TERYT, zgody RODO). Zgodnie z roadmapą — Faza 1."
      kodDokumentacji="Cloude Docs/naszawies-package/docs/FEATURES.md"
    />
  );
}
