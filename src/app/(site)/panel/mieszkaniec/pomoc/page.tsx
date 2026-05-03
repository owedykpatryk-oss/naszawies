import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pomoc — panel mieszkańca",
};

export default function MieszkaniecPomocPage() {
  return (
    <main>
      <p className="mb-4 text-sm text-stone-500">
        <Link href="/panel/mieszkaniec" className="text-green-800 underline">
          ← Panel mieszkańca
        </Link>
      </p>
      <h1 className="tytul-sekcji-panelu">Pomoc krok po kroku (mieszkaniec)</h1>
      <p className="mt-2 max-w-3xl text-sm text-stone-600">
        Przewodnik „co i jak zrobić”, żeby szybko korzystać z ogłoszeń, świetlicy i zgłoszeń.
      </p>

      <section className="mt-6 rounded-2xl border border-sky-200/80 bg-sky-50/40 p-4">
        <h2 className="font-serif text-lg text-green-950">Pierwsze 5 minut</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-stone-700">
          <li>
            W `Przegląd` złóż wniosek o rolę mieszkańca lub (jeśli dotyczy) o rolę OSP / KGW / radę sołecką — sołtys
            rozpatrzy wnioski w panelu.
          </li>
          <li>Włącz powiadomienia w `Powiadomienia`.</li>
          <li>Dodaj jedną pozycję do `Listy zakupów`.</li>
          <li>Jeśli coś wymaga interwencji, dodaj `Zgłoszenie` ze zdjęciem.</li>
        </ol>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <h3 className="font-medium text-green-950">Kiedy użyć zgłoszeń?</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-stone-700">
            <li>Dziury, oświetlenie, odpady, infrastruktura.</li>
            <li>Dodaj miejsce i zdjęcia — przyspiesza reakcję.</li>
            <li>Użyj oznaczenia „pilne” tylko gdy naprawdę pilne.</li>
          </ul>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <h3 className="font-medium text-green-950">Kiedy użyć świetlicy?</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-stone-700">
            <li>Sprawdź dostępność terminu i złóż rezerwację.</li>
            <li>Podaj realną liczbę gości i potrzeby sprzętowe.</li>
            <li>Po wydarzeniu uzupełnij dokumentację, jeśli była szkoda.</li>
          </ul>
        </div>
      </section>

      <section className="mt-6 space-y-3">
        <details className="rounded-xl border border-stone-200 bg-white p-4">
          <summary className="cursor-pointer font-medium text-green-950">Jak najlepiej pisać zgłoszenie?</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-stone-700">
            <li>Tytuł: „co + gdzie” (np. „Uszkodzona lampa przy remizie”).</li>
            <li>Opis: od kiedy, jak często, czy problem się powtarza.</li>
            <li>Dodaj 1-3 czytelne zdjęcia i orientacyjne miejsce.</li>
          </ul>
        </details>
        <details className="rounded-xl border border-stone-200 bg-white p-4">
          <summary className="cursor-pointer font-medium text-green-950">Jak śledzić statusy bez chaosu?</summary>
          <p className="mt-2 text-sm text-stone-700">
            Najwygodniej: raz dziennie sprawdź `Powiadomienia`, a raz na tydzień przejrzyj swoje zgłoszenia i
            rezerwacje. Dzięki temu nic nie umknie.
          </p>
        </details>
      </section>

      <p className="mt-8 text-sm text-stone-600">
        Najczęściej używane:{" "}
        <Link href="/panel/mieszkaniec/ogloszenia" className="text-green-800 underline">
          Ogłoszenia
        </Link>
        ,{" "}
        <Link href="/panel/mieszkaniec/swietlica" className="text-green-800 underline">
          Świetlica
        </Link>
        ,{" "}
        <Link href="/panel/mieszkaniec/zgloszenia" className="text-green-800 underline">
          Zgłoszenia
        </Link>
        .
      </p>
    </main>
  );
}
