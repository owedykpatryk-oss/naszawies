import type { Metadata } from "next";
import Link from "next/link";
import { HeroModuluPublicznego } from "@/components/wspolne/hero-modulu-publicznego";

export const metadata: Metadata = {
  title: "O nas",
};

export default function AboutPage() {
  return (
    <main className="page-shell max-w-4xl py-8 sm:py-12">
      <p className="mb-6 text-sm text-stone-500">
        <Link href="/" className="font-medium text-green-800 underline decoration-emerald-600/40 underline-offset-2">
          ← Strona główna
        </Link>
      </p>

      <HeroModuluPublicznego
        etykieta="naszawies.pl"
        tytul="O nas"
        opis="Bezpłatna platforma cyfrowa dla polskich sołtysów i mieszkańców wsi — od ogłoszeń i kalendarza po rezerwację świetlicy."
      />

      <div className="panel-karta mt-8 space-y-4 leading-relaxed text-stone-700">
        <p>
          naszawies.pl to bezpłatna platforma cyfrowa dla polskich sołtysów i mieszkańców wsi — od ogłoszeń i kalendarza
          po rezerwację świetlicy i (w kolejnych wersjach) planer układu stołów.
        </p>
        <p>
          Chcemy, żeby każda wieś miała jedno miejsce w sieci: przejrzyste ogłoszenia, kontakt z sołtysem, mapa
          miejscowości (po zalogowaniu) i narzędzia do codziennej organizacji — bez skomplikowanych portali i bez opłat
          za sam fakt bycia w sieci.
        </p>
      </div>
    </main>
  );
}
