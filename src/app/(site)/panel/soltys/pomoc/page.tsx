import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pomoc — panel sołtysa",
};

export default function SoltysPomocPage() {
  return (
    <main>
      <p className="mb-4 text-sm text-stone-500">
        <Link href="/panel/soltys" className="text-green-800 underline">
          ← Panel sołtysa
        </Link>
      </p>
      <h1 className="tytul-sekcji-panelu">Pomoc krok po kroku (sołtys)</h1>
      <p className="mt-2 max-w-3xl text-sm text-stone-600">
        Szybki przewodnik „co, gdzie i w jakiej kolejności”, żeby panel działał sprawnie i bez chaosu.
      </p>

      <section className="mt-6 rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4">
        <h2 className="font-serif text-lg text-green-950">Plan dnia: 10 minut</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-stone-700">
          <li>Wejdź w `Przegląd` i sprawdź „Dziś do zrobienia”.</li>
          <li>Obsłuż `Wiadomości lokalne` i `Rezerwacje sal` (najpierw decyzje).</li>
          <li>W `Społeczność i WOW` uzupełnij jedną rzecz: wpis lub wydarzenie.</li>
          <li>Na koniec uruchom `Automatyzacje`, jeśli masz stare wpisy.</li>
        </ol>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <h3 className="font-medium text-green-950">Najpierw decyzje</h3>
          <p className="mt-1 text-sm text-stone-600">
            Każdego dnia zacznij od sekcji, które blokują innych użytkowników.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-stone-700">
            <li>Wnioski mieszkańców</li>
            <li>Rezerwacje sal</li>
            <li>Moderacja treści</li>
          </ul>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <h3 className="font-medium text-green-950">Potem rozwój</h3>
          <p className="mt-1 text-sm text-stone-600">Dopiero po decyzjach rób działania „na wzrost aktywności”.</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-stone-700">
            <li>Blog i historia wsi</li>
            <li>Wydarzenia (KGW/OSP/sport)</li>
            <li>Marketplace i profil usług</li>
          </ul>
        </div>
      </section>

      <section className="mt-6 space-y-3">
        <details className="rounded-xl border border-stone-200 bg-white p-4">
          <summary className="cursor-pointer font-medium text-green-950">Jak najlepiej używać trybów KGW/OSP?</summary>
          <p className="mt-2 text-sm text-stone-700">
            W `Społeczność i WOW` przełącz tryb na `KGW` lub `OSP`. Taby i podpowiedzi pokażą tylko to, co ważne dla
            tego obszaru. Dzięki temu unikasz nadmiaru opcji i działasz szybciej.
          </p>
        </details>
        <details className="rounded-xl border border-stone-200 bg-white p-4">
          <summary className="cursor-pointer font-medium text-green-950">Jak pisać komunikaty, żeby ludzie je czytali?</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-stone-700">
            <li>Tytuł: krótki i konkretny („Przerwa w wodzie — wtorek 10:00”).</li>
            <li>Pierwsze zdanie: co się dzieje i kogo dotyczy.</li>
            <li>Na końcu: od kiedy, do kiedy, gdzie dzwonić.</li>
          </ul>
        </details>
        <details className="rounded-xl border border-stone-200 bg-white p-4">
          <summary className="cursor-pointer font-medium text-green-950">Jak utrzymać porządek danych?</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-stone-700">
            <li>Raz w tygodniu: przejrzyj wygasłe wydarzenia i oferty.</li>
            <li>Raz na 2 tygodnie: uruchom automatyzacje porządkowe.</li>
            <li>Raz w miesiącu: zaktualizuj kontakty i harmonogram organizacji.</li>
          </ul>
        </details>
      </section>

      <p className="mt-8 text-sm text-stone-600">
        Potrzebujesz szybkiego startu? Przejdź do{" "}
        <Link href="/panel/soltys/spolecznosc?tryb=ogolny" className="text-green-800 underline">
          Społeczność i WOW
        </Link>{" "}
        i wybierz tryb pracy.
      </p>
    </main>
  );
}
