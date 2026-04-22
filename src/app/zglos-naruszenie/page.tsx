import type { Metadata } from "next";
import { StronaWRozbudowie } from "@/components/strona-w-rozbudowie";

export const metadata: Metadata = {
  title: "Zgłoś naruszenie",
  description: "Zgłaszanie nielegalnych lub szkodliwych treści (DSA).",
};

export default function ZglosNaruszeniePage() {
  return (
    <StronaWRozbudowie
      tytul="Zgłaszanie naruszeń (DSA)"
      opis="Formularz online — w przygotowaniu. Tymczasem wyślij wiadomość na moderacja@naszawies.pl lub dsa@naszawies.pl: podaj adres strony (URL), rodzaj problemu i swoje dane kontaktowe. Odpowiemy w uzasadnionym terminie."
      kodDokumentacji="Cloude Docs/naszawies-package/legal/LEGAL.md — sekcja DSA"
    />
  );
}
