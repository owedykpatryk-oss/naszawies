import type { Metadata } from "next";
import Link from "next/link";
import { SzukajKatalog } from "./szukaj-katalog";

export const metadata: Metadata = {
  title: "Szukaj wsi",
  description: "Wyszukaj miejscowość po nazwie lub lokalizacji w serwisie naszawies.pl.",
};

export default function SzukajPage() {
  return (
    <main className="mx-auto min-w-0 max-w-2xl py-16 text-stone-800">
      <p className="mb-6 text-sm text-stone-500">
        <Link href="/" className="text-green-800 underline">
          ← Strona główna
        </Link>
      </p>
      <h1 className="font-serif text-3xl text-green-950">Szukaj wsi</h1>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">
        Wpisz <strong>nazwę wsi</strong> albo fragment <strong>gminy, powiatu czy województwa</strong> — pokażemy
        miejscowości dostępne w serwisie. Możesz też wpisać <strong>fragment adresu strony wsi</strong> z
        paska przeglądarki.
      </p>
      <SzukajKatalog />
    </main>
  );
}
