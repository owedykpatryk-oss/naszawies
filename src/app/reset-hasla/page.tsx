import type { Metadata } from "next";
import { StronaWRozbudowie } from "@/components/strona-w-rozbudowie";

export const metadata: Metadata = {
  title: "Reset hasła",
};

export default function ResetHaslaPage() {
  return (
    <StronaWRozbudowie
      tytul="Reset hasła"
      opis="Odzyskiwanie dostępu do konta przez link e-mail (Supabase) — w przygotowaniu."
      kodDokumentacji="Cloude Docs/naszawies-package/docs/FEATURES.md"
    />
  );
}
