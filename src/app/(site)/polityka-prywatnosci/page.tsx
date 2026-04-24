import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Polityka prywatności",
  description:
    "Zasady przetwarzania danych osobowych na naszawies.pl — RODO, procesorzy, prawa użytkownika.",
};

export default function PolitykaPrywatnosciPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16 text-stone-800">
      <p className="mb-6 text-sm text-stone-500">
        <Link href="/" className="text-green-800 underline">
          ← Strona główna
        </Link>
      </p>
      <article className="prose-custom space-y-8">
        <header>
          <h1 className="font-serif text-3xl text-green-950">Polityka prywatności</h1>
          <p className="mt-2 text-sm text-stone-600">
            Wersja robocza opublikowana na stronie — uzupełnij dane administratora i skonsultuj pełny
            dokument Word z prawnikiem (patrz{" "}
            <code className="rounded bg-stone-100 px-1 text-xs">
              Cloude Docs/naszawies-package/legal/LEGAL.md
            </code>
            ).
          </p>
        </header>

        <section>
          <h2 className="font-serif text-xl text-green-900">1. Administrator danych</h2>
          <p className="mt-2 leading-relaxed text-stone-700">
            Administratorem danych osobowych jest{" "}
            <strong>[uzupełnij: imię i nazwisko lub nazwa firmy]</strong>, adres:{" "}
            <strong>[uzupełnij adres]</strong>. Kontakt w sprawach RODO:{" "}
            <a href="mailto:rodo@naszawies.pl" className="text-green-800 underline">
              rodo@naszawies.pl
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-green-900">2. Cele i podstawy przetwarzania</h2>
          <ul className="mt-2 list-inside list-disc space-y-2 text-stone-700">
            <li>
              <strong>Lista oczekujących</strong> — zapis e-maila i danych z formularza: podstawa art. 6 ust. 1
              lit. a RODO (zgoda) oraz przygotowanie do zawarcia umowy o świadczenie usług (art. 6 ust. 1 lit. b).
            </li>
            <li>
              <strong>Kontakt przez formularz</strong> — odpowiedź na zapytanie: art. 6 ust. 1 lit. b lub f
              (uzasadniony interes w komunikacji).
            </li>
            <li>
              <strong>Logowanie i konto użytkownika</strong> (po uruchomieniu funkcji): wykonanie umowy (art. 6
              ust. 1 lit. b).
            </li>
            <li>
              <strong>Analityka</strong> (Plausible, bez cookies): uzasadniony interes — poprawa serwisu (art. 6
              ust. 1 lit. f), możliwa zmiana po ocenie skutków.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl text-green-900">3. Odbiorcy i procesorzy</h2>
          <p className="mt-2 leading-relaxed text-stone-700">
            Dane mogą być powierzane podmiotom przetwarzającym w naszym imieniu:{" "}
            <strong>Supabase</strong> (baza danych, hosting w UE), <strong>Vercel</strong> (hosting aplikacji),{" "}
            <strong>Resend</strong> (e-mail transakcyjny) — na podstawie umów powierzenia (DPA). Nie sprzedajemy
            danych i nie wykorzystujemy ich do reklam behawioralnych.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-green-900">4. Okres przechowywania</h2>
          <p className="mt-2 leading-relaxed text-stone-700">
            Dane z listy oczekujących przechowujemy do momentu wysłania informacji o starcie usługi lub do czasu
            wycofania zgody / żądania usunięcia. Logi techniczne — przez okres wynikający z przepisów lub
            uzasadnionego interesu bezpieczeństwa.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-green-900">5. Prawa osoby, której dane dotyczą</h2>
          <p className="mt-2 leading-relaxed text-stone-700">
            Przysługuje Pani/Panu m.in.: dostęp do danych, sprostowanie, usunięcie, ograniczenie przetwarzania,
            sprzeciw, przenoszenie danych (w zakresie przewidzianym prawem), cofnięcie zgody w dowolnym momencie
            (bez wpływu na zgodność z prawem przetwarzania przed cofnięciem). Skargę można złożyć do Prezesa UODO.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-green-900">6. Pliki cookie</h2>
          <p className="mt-2 leading-relaxed text-stone-700">
            Stosujemy wyłącznie cookies niezbędne do działania serwisu (np. sesja po zalogowaniu). Nie używamy
            plików cookies do profilowania reklamowego. Szczegóły:{" "}
            <code className="rounded bg-stone-100 px-1 text-xs">LEGAL.md</code> w pakiecie projektu.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-green-900">7. Źródło danych TERYT</h2>
          <p className="mt-2 leading-relaxed text-stone-700">
            Wyszukiwarka i katalog wsi (po imporcie) korzystają z publicznych danych GUS:{" "}
            <em>Krajowy Rejestr Urzędowy Podziału Terytorialnego Kraju (TERYT)</em>.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-green-900">8. Zmiany polityki</h2>
          <p className="mt-2 leading-relaxed text-stone-700">
            O istotnych zmianach poinformujemy na stronie oraz — gdy mamy adres e-mail — drogą elektroniczną.
            Archiwum wersji należy przechowywać wewnętrznie zgodnie z praktyką RODO.
          </p>
        </section>
      </article>
    </main>
  );
}
