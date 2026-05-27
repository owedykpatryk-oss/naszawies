import type { Metadata } from "next";
import Link from "next/link";
import { PrzewodnikKrokow } from "@/components/pomoc/przewodnik-krokow";
import { PRZEWODNIKI } from "@/lib/pomoc/przewodniki";

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
      <h1 className="tytul-sekcji-panelu">Pomoc mieszkańca</h1>
      <p className="mt-2 max-w-3xl text-sm text-stone-600">
        Jak korzystać z ogłoszeń, świetlicy, zgłoszeń i fotokroniki — krok po kroku.
      </p>

      <section className="mt-6 rounded-2xl border border-sky-200/80 bg-sky-50/40 p-4">
        <h2 className="font-serif text-lg text-green-950">Pierwsze 5 minut</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-stone-700">
          <li>Złóż wniosek o rolę we wsi — sołtys rozpatrzy w panelu.</li>
          <li>Włącz powiadomienia w panelu.</li>
          <li>Dodaj pozycję do listy zakupów lub zgłoszenia ze zdjęciem.</li>
        </ol>
      </section>

      <div className="mt-8">
        <PrzewodnikKrokow sekcje={PRZEWODNIKI.mieszkaniec} />
      </div>

      <p className="mt-8 text-sm text-stone-600">
        Więcej porad:{" "}
        <Link href="/pomoc?rola=mieszkaniec" className="text-green-800 underline">
          centrum pomocy
        </Link>
        . Błąd strony (nie sprawa gminna):{" "}
        <Link href="/zglos-problem-strony" className="text-green-800 underline">
          zgłoś problem ze stroną
        </Link>
        .
      </p>
    </main>
  );
}
