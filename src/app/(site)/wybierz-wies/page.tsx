import type { Metadata } from "next";
import Link from "next/link";
import { SzukajKatalog } from "../szukaj/szukaj-katalog";

export const metadata: Metadata = {
  title: "Wybierz wieś",
  description: "Wyszukaj miejscowość po zalogowaniu — przed złożeniem wniosku o rolę mieszkańca.",
  robots: { index: false, follow: false },
};

export default async function WybierzWiesPage() {
  return (
    <main className="mx-auto min-w-0 w-full max-w-7xl px-4 py-16 text-stone-800 sm:px-6">
      <p className="mb-6 text-sm text-stone-500">
        <Link href="/" className="text-green-800 underline">
          ← Strona główna
        </Link>
      </p>
      <h1 className="font-serif text-3xl text-green-950">Wybierz miejscowość</h1>
      <p className="mt-3 text-sm leading-relaxed text-stone-600">
        Wpisz fragment nazwy lub miejsca — pokażemy miejscowości z serwisu. Gdy wybierzesz wieś, wejdź na jej stronę
        publiczną (link w wynikach). <strong>Wniosek o rolę mieszkańca</strong> złóż w panelu:{" "}
        <Link href="/panel/mieszkaniec" className="text-green-800 underline">
          panel mieszkańca
        </Link>
        .
      </p>
      <div className="mt-8 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <SzukajKatalog />
      </div>
      <p className="mt-8 text-sm text-stone-500">
        Tę samą wyszukiwarkę znajdziesz też na stronie{" "}
        <Link href="/szukaj" className="text-green-800 underline">
          Szukaj wsi
        </Link>
        .
      </p>
    </main>
  );
}
