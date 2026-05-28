import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "O nas",
};

export default function AboutPage() {
  return (
    <main className="mx-auto min-w-0 w-full max-w-4xl px-4 py-16 text-stone-800 sm:px-6">
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
        Chcemy, żeby każda wieś miała jedno miejsce w sieci: przejrzyste ogłoszenia, kontakt z sołtysem, mapa
        miejscowości i narzędzia do codziennej organizacji — bez skomplikowanych portali i bez opłat za sam fakt
        bycia w sieci.
      </p>
    </main>
  );
}
