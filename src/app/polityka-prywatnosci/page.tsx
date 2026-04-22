import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Polityka prywatności",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-16 text-stone-800">
      <p className="mb-6 text-sm text-stone-500">
        <Link href="/" className="text-green-800 underline">
          ← Strona główna
        </Link>
      </p>
      <h1 className="mb-6 font-serif text-3xl text-green-950">
        Polityka prywatności
      </h1>
      <p className="mb-4 leading-relaxed">
        Pełna polityka prywatności w wersji prawnej znajduje się w pakiecie
        projektu (plik Word) — przed publikacją uzupełnij pola oznaczone
        nawiasami kwadratowymi i skonsultuj dokument z prawnikiem, zgodnie z{" "}
        <code className="rounded bg-stone-100 px-1">Cloude Docs/README-dokumenty-prawne.md</code>.
      </p>
      <p className="leading-relaxed">
        Na tej stronie wkrótce pojawi się wersja HTML do odczytu w przeglądarce.
        Adres kontaktowy RODO:{" "}
        <a className="text-green-800 underline" href="mailto:rodo@naszawies.pl">
          rodo@naszawies.pl
        </a>
        .
      </p>
    </main>
  );
}
