import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Regulamin",
  description: "Regulamin korzystania z platformy naszawies.pl.",
};

export default function RegulaminPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16 text-stone-800">
      <p className="mb-6 text-sm text-stone-500">
        <Link href="/" className="text-green-800 underline">
          ← Strona główna
        </Link>
      </p>
      <article className="space-y-8">
        <header>
          <h1 className="font-serif text-3xl text-green-950">Regulamin platformy</h1>
          <p className="mt-2 text-sm text-stone-600">
            Wersja robocza — treść pełna w pliku Word w pakiecie projektu. Przed pierwszą rejestracją użytkowników
            uzupełnij definicje i dane administratora zgodnie z{" "}
            <code className="rounded bg-stone-100 px-1 text-xs">
              Cloude Docs/naszawies-package/legal/LEGAL.md
            </code>
            .
          </p>
        </header>

        <section>
          <h2 className="font-serif text-xl text-green-900">§ 1. Postanowienia ogólne</h2>
          <p className="mt-2 leading-relaxed text-stone-700">
            Platforma <strong>naszawies.pl</strong> ma charakter społeczny i informacyjny: wspiera sołtysów i
            mieszkańców wsi w komunikacji i organizacji życia lokalnego. Usługa jest bezpłatna dla wsi w modelu
            opisanym w dokumentacji projektu. Korzystanie z serwisu oznacza akceptację niniejszego regulaminu.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-green-900">§ 2. Wymagania techniczne i wiek</h2>
          <p className="mt-2 leading-relaxed text-stone-700">
            Minimalny wiek użytkownika konta: <strong>16 lat</strong>. Użytkownik oświadcza prawdziwość podanych
            danych. Zakazane jest podszywanie się pod inne osoby lub instytucje.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-green-900">§ 3. Role i treści</h2>
          <p className="mt-2 leading-relaxed text-stone-700">
            Szczegółowy opis ról (gość, mieszkaniec, sołtys, reprezentant podmiotu, administrator) oraz zasady
            publikacji treści znajdują się w{" "}
            <code className="rounded bg-stone-100 px-1 text-xs">docs/ROLES.md</code> oraz{" "}
            <code className="rounded bg-stone-100 px-1 text-xs">docs/MODERATION.md</code>.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-green-900">§ 4. Moderacja i DSA</h2>
          <p className="mt-2 leading-relaxed text-stone-700">
            Treści można zgłaszać na{" "}
            <a href="mailto:moderacja@naszawies.pl" className="text-green-800 underline">
              moderacja@naszawies.pl
            </a>
            . Punkt kontaktowy DSA:{" "}
            <a href="mailto:dsa@naszawies.pl" className="text-green-800 underline">
              dsa@naszawies.pl
            </a>
            . Decyzje moderacyjne będą uzasadniane; przewidziany jest mechanizm odwołania (szczegóły w pełnym
            regulaminie).
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-green-900">§ 5. Odpowiedzialność</h2>
          <p className="mt-2 leading-relaxed text-stone-700">
            Administrator dąży do poprawnego działania serwisu, jednak nie gwarantuje nieprzerwanej dostępności.
            Za treści publikowane przez użytkowników odpowiadają ich autorzy; sołtys moderuje profil swojej wsi w
            zakresie przewidzianym funkcjami platformy.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-green-900">§ 6. Zmiany regulaminu</h2>
          <p className="mt-2 leading-relaxed text-stone-700">
            Regulamin może ulec zmianie. O istotnych zmianach poinformujemy z wyprzedzeniem w sposób widoczny na
            stronie i — w stosownych przypadkach — e-mailem.
          </p>
        </section>
      </article>
    </main>
  );
}
