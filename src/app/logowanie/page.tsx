import type { Metadata } from "next";
import { StronaWRozbudowie } from "@/components/strona-w-rozbudowie";

export const metadata: Metadata = {
  title: "Logowanie",
};

export default function LogowaniePage() {
  return (
    <StronaWRozbudowie
      tytul="Logowanie"
      opis="Logowanie e-mail i hasłem przez Supabase Auth — w przygotowaniu (Faza 1)."
      kodDokumentacji="Cloude Docs/naszawies-package/CURSOR-INSTRUCTIONS.md"
    />
  );
}
