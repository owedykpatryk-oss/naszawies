import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "O nas",
};

export default function AboutPage() {
  return (
    <main className="mx-auto min-w-0 max-w-2xl py-16 text-stone-800">
      <p className="mb-6 text-sm text-stone-500">
        <Link href="/" className="text-green-800 underline">
          ← Strona główna
        </Link>
      </p>
      <h1 className="mb-6 font-serif text-3xl text-green-950">O nas</h1>
      <p className="mb-4 leading-relaxed">
        naszawies.pl to bezpłatna platforma cyfrowa dla polskich sołtysów i
        mieszkańców wsi — od ogłoszeń i kalendarza po rezerwację świetlicy i
        (w kolejnych wersjach) planer układu stołów.
      </p>
      <p className="leading-relaxed">
        Misja, wartości i plan rozwoju opisane są w dokumentacji projektu (
        <code className="rounded bg-stone-100 px-1">PROJECT.md</code> w folderze
        Cloude Docs).
      </p>
    </main>
  );
}
