import type { Metadata } from "next";
import Link from "next/link";
import { StronaAuthUklad } from "@/components/auth/strona-auth-uklad";
import { ResetHaslaFormularz } from "./reset-hasla-formularz";

export const metadata: Metadata = {
  title: "Reset hasła",
  description: "Odzyskiwanie dostępu do konta naszawies.pl.",
};

export default function ResetHaslaPage() {
  return (
    <StronaAuthUklad
      tytul="Reset hasła"
      naglowekHero="Odzyskaj dostęp"
      leadHero="Wyślemy link na Twój e-mail — ustawisz nowe hasło i wrócisz do panelu w kilka chwil."
      eyebrow="Bezpiecznie · link jednorazowy"
      korzysci={[
        { ikona: "🔐", tekst: "Link ważny przez ograniczony czas — tylko dla Twojego konta." },
        { ikona: "📬", tekst: "Sprawdź też folder spam, jeśli wiadomość nie dotrze od razu." },
      ]}
      opis={<p>Podaj adres e-mail konta — wyślemy instrukcję ustawienia nowego hasła.</p>}
      powrot={{ href: "/logowanie", label: "Wróć do logowania" }}
      stopka={
        <>
          <Link href="/rejestracja">Załóż nowe konto</Link>
          {" · "}
          <Link href="/pomoc">Pomoc</Link>
        </>
      }
    >
      <ResetHaslaFormularz />
    </StronaAuthUklad>
  );
}
