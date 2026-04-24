import type { Metadata } from "next";
import Link from "next/link";
import { SzukajKatalog } from "./szukaj-katalog";

export const metadata: Metadata = {
  title: "Szukaj wsi",
  description: "Wyszukiwarka miejscowości w katalogu TERYT (naszawies.pl).",
};

export default function SzukajPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-16 text-stone-800">
      <p className="mb-6 text-sm text-stone-500">
        <Link href="/" className="text-green-800 underline">
          ← Strona główna
        </Link>
      </p>
      <h1 className="font-serif text-3xl text-green-950">Szukaj wsi</h1>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">
        Katalog z bazy <code className="rounded bg-stone-100 px-1 text-xs">villages</code> (po
        imporcie SIMC/TERYT). Wpisz fragment nazwy miejscowości.
      </p>
      <SzukajKatalog />
    </main>
  );
}
