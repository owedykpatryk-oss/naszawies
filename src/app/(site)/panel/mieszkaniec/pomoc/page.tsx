import type { Metadata } from "next";
import Link from "next/link";
import { PrzewodnikKrokow } from "@/components/pomoc/przewodnik-krokow";
import { PRZEWODNIKI } from "@/lib/pomoc/przewodniki";
import { PanelStronaMieszkaneca } from "@/components/panel/panel-strona-mieszkaneca";

export const metadata: Metadata = {
  title: "Pomoc — panel mieszkańca",
};

export default function MieszkaniecPomocPage() {
  return (
    <PanelStronaMieszkaneca
      tytul="Pomoc mieszkańca"
      opis="Jak korzystać z ogłoszeń, świetlicy, zgłoszeń i fotokroniki — krok po kroku."
      dzieci={
        <>
          <section className="baner-wskazowka border-sky-200/80 bg-sky-50/40">
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
        </>
      }
    />
  );
}
