import type { Metadata } from "next";
import { StronaWRozbudowie } from "@/components/strona-w-rozbudowie";

export const metadata: Metadata = {
  title: "Potwierdzenie e-mail",
};

export default function PotwierdzEmailPage() {
  return (
    <StronaWRozbudowie
      tytul="Potwierdzenie adresu e-mail"
      opis="Strona docelowa po kliknięciu linku z wiadomości rejestracyjnej — obsłuży Supabase Auth (Faza 1)."
      kodDokumentacji="Cloude Docs/naszawies-package/frontend/FRONTEND.md"
    />
  );
}
