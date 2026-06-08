import type { Metadata } from "next";
import Link from "next/link";
import {
  AKTUALNY_BUNDLE_WERSJI_PRAWNYCH,
  WERSJA_BANERU_COOKIES,
} from "@/lib/rodo/wersje-dokumentow";

export const metadata: Metadata = {
  title: "Polityka prywatności",
  description:
    "Zasady przetwarzania danych osobowych na naszawies.pl — RODO, cookies, prawa użytkownika, usuwanie konta.",
};

const ADMIN_NAZWA = process.env.NEXT_PUBLIC_LEGAL_ADMIN_NAME?.trim() || "[uzupełnij: imię i nazwisko lub firma]";
const ADMIN_ADRES = process.env.NEXT_PUBLIC_LEGAL_ADMIN_ADDRESS?.trim() || "[uzupełnij adres korespondencyjny]";

export default function PolitykaPrywatnosciPage() {
  return (
    <main className="mx-auto min-w-0 max-w-3xl px-4 py-16 text-stone-800 sm:px-6">
      <p className="mb-6 text-sm text-stone-500">
        <Link href="/" className="text-green-800 underline">
          ← Strona główna
        </Link>
      </p>
      <article className="prose-custom space-y-8">
        <header>
          <h1 className="font-serif text-3xl text-green-950">Polityka prywatności</h1>
          <p className="mt-2 text-sm text-stone-600">
            Wersja dokumentów: <strong>{AKTUALNY_BUNDLE_WERSJI_PRAWNYCH}</strong> · baner cookies:{" "}
            <strong>{WERSJA_BANERU_COOKIES}</strong>. Przed pełnym uruchomieniem uzupełnij dane administratora (zmienne
            środowiskowe lub poniższe pola) i skonsultuj treść z prawnikiem.
          </p>
        </header>

        <section>
          <h2 className="font-serif text-xl text-green-900">1. Administrator danych</h2>
          <p className="mt-2 leading-relaxed text-stone-700">
            Administratorem danych osobowych jest <strong>{ADMIN_NAZWA}</strong>, adres: <strong>{ADMIN_ADRES}</strong>.
            Kontakt w sprawach RODO:{" "}
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
              <strong>Lista oczekujących</strong> — kontakt przed startem usługi: zgoda (art. 6 ust. 1 lit. a RODO) oraz
              przygotowanie do umowy (lit. b).
            </li>
            <li>
              <strong>Formularz kontaktowy</strong> — odpowiedź na zapytanie: lit. b lub f (uzasadniony interes w
              komunikacji).
            </li>
            <li>
              <strong>Konto użytkownika</strong> — logowanie, panel, treści publikowane we wsi: wykonanie umowy /
              świadczenie usługi (lit. b); akceptacja{" "}
              <Link href="/regulamin" className="font-medium text-green-800 underline">
                regulaminu
              </Link>{" "}
              przy rejestracji (lit. a w zakresie oświadczeń dobrowolnych).
            </li>
            <li>
              <strong>Powiadomienia push / e-mail</strong> — tylko po wyrażeniu zgody w ustawieniach lub przy obserwacji
              wsi z włączonymi alertami.
            </li>
            <li>
              <strong>Statystyka odwiedzin</strong> (Plausible Analytics, bez plików cookie profilujących): uzasadniony
              interes — poprawa serwisu (lit. f), przy braku cookies marketingowych.
            </li>
            <li>
              <strong>Bezpieczeństwo</strong> — logi techniczne, ochrona przed nadużyciami: lit. f.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-xl text-green-900">3. Odbiorcy i procesorzy</h2>
          <p className="mt-2 leading-relaxed text-stone-700">
            Dane mogą być powierzane podmiotom przetwarzającym w naszim imieniu na podstawie umów powierzenia (DPA), m.in.:
            hosting aplikacji (Vercel), baza danych i uwierzytelnianie (Supabase — region zgodny z konfiguracją projektu,
            zwykle UE), poczta transakcyjna, opcjonalnie Cloudflare (ochrona formularzy), storage plików (np. Cloudflare
            R2). Nie sprzedajemy danych i nie prowadzimy reklam behawioralnych opartych na profilowaniu użytkowników
            serwisu.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-green-900">4. Okres przechowywania</h2>
          <ul className="mt-2 list-inside list-disc space-y-2 text-stone-700">
            <li>Lista oczekujących — do wycofania zgody, usunięcia wpisu lub startu usługi.</li>
            <li>Konto — do usunięcia konta przez użytkownika lub żądania na rodo@naszawies.pl.</li>
            <li>
              Treści opublikowane we wsi (np. ogłoszenia) — mogą pozostać przy zanonimizowanym autorze po usunięciu konta,
              jeśli są częścią życia społeczności lokalnej; dane osobowe w treści można zgłosić do korekty lub usunięcia.
            </li>
            <li>Logi techniczne — przez okres wynikający z przepisów lub uzasadnionego interesu bezpieczeństwa.</li>
            <li>
              Rejestr zgód (<code className="text-xs">user_consents</code>) — dowód akceptacji dokumentów; przechowywany
              do czasu przedawnienia roszczeń lub wymogu prawa.
            </li>
          </ul>
        </section>

        <section id="usun-dane">
          <h2 className="font-serif text-xl text-green-900">5. Prawa osoby, której dane dotyczą</h2>
          <p className="mt-2 leading-relaxed text-stone-700">
            Przysługuje Pani/Panu: dostęp, sprostowanie, usunięcie, ograniczenie, sprzeciw, przenoszenie danych (w
            zakresie przepisów), cofnięcie zgody bez wpływu na zgodność wcześniejszego przetwarzania. Skargę można złożyć
            do Prezesa UODO.
          </p>
          <p className="mt-3 leading-relaxed text-stone-700">
            <strong>Samobsługa po zalogowaniu:</strong>{" "}
            <Link href="/panel/profil" className="font-medium text-green-800 underline">
              Mój profil → sekcja „Twoje dane (RODO)”
            </Link>{" "}
            — pobranie pakietu JSON oraz trwałe usunięcie konta (wpisz <code className="text-xs">USUN KONTO</code>).
            Możesz też napisać na{" "}
            <a href="mailto:rodo@naszawies.pl" className="font-medium text-green-800 underline">
              rodo@naszawies.pl
            </a>
            .
          </p>
        </section>

        <section id="cookies">
          <h2 className="font-serif text-xl text-green-900">6. Pliki cookie i podobne technologie</h2>
          <p className="mt-2 leading-relaxed text-stone-700">
            <strong>Niezbędne</strong> — utrzymanie sesji po zalogowaniu (Supabase Auth), bezpieczeństwo; bez nich panel
            nie działa. Nie wymagają osobnej zgody marketingowej, informujemy w banerze na stronie.
          </p>
          <p className="mt-2 leading-relaxed text-stone-700">
            <strong>Analityka</strong> — jeśli włączona, korzystamy z Plausible w trybie bez cookies profilujących
            (agregowane statystyki). Brak cookies reklamowych stron trzecich.
          </p>
          <p className="mt-2 leading-relaxed text-stone-700">
            <strong>PWA</strong> — Service Worker cache’uje zasoby aplikacji na urządzeniu (nie jest to profilowanie).
            Zgodę na baner zapisujemy w przeglądarce (localStorage) oraz — po zalogowaniu — w rejestrze zgód.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-green-900">7. Rejestracja i wersje dokumentów</h2>
          <p className="mt-2 leading-relaxed text-stone-700">
            Przy rejestracji e-mailem wymagana jest akceptacja regulaminu, polityki prywatności i oświadczenie o ukończeniu
            16 lat. Przy logowaniu przez Google — ta sama akceptacja przed pierwszym użyciem panelu. Zmiana istotna
            dokumentów może wymagać ponownej akceptacji (wersja pakietu: {AKTUALNY_BUNDLE_WERSJI_PRAWNYCH}).
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-green-900">8. Źródło danych TERYT</h2>
          <p className="mt-2 leading-relaxed text-stone-700">
            Katalog wsi korzysta z publicznych danych GUS:{" "}
            <em>Krajowy Rejestr Urzędowy Podziału Terytorialnego Kraju (TERYT)</em>.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-green-900">9. Zmiany polityki</h2>
          <p className="mt-2 leading-relaxed text-stone-700">
            O istotnych zmianach poinformujemy na stronie oraz — gdy mamy adres e-mail — drogą elektroniczną. Przy
            zmianie wersji pakietu prawnego zalogowani użytkownicy mogą zostać poproszeni o ponowną akceptację w panelu.
          </p>
        </section>
      </article>
    </main>
  );
}
