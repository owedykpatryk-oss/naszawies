import type { Metadata } from "next";
import Link from "next/link";
import { PrzewodnikKrokow } from "@/components/pomoc/przewodnik-krokow";
import { PRZEWODNIKI } from "@/lib/pomoc/przewodniki";
import { PanelStronaSoltysa } from "@/components/panel/panel-strona-soltysa";

export const metadata: Metadata = {
  title: "Pomoc — panel sołtysa",
};

export default function SoltysPomocPage() {
  return (
    <PanelStronaSoltysa
      tytul="Pomoc sołtysa"
      opis="Przewodnik krok po kroku: decyzje, kalendarz, grupy (KGW, OSP), polowania i komunikacja z mieszkańcami."
      dzieci={
        <>
          <section className="baner-wskazowka">
            <h2 className="font-serif text-lg text-green-950">Plan dnia: 10 minut</h2>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-stone-700">
              <li>Wejdź w Przegląd i sprawdź „Dziś do zrobienia”.</li>
              <li>Obsłuż wiadomości lokalne i rezerwacje sal (najpierw decyzje).</li>
              <li>W Społeczność i WOW uzupełnij jeden wpis lub wydarzenie.</li>
              <li>Sprawdź kalendarz i ewentualne ostrzeżenia o polowaniach.</li>
            </ol>
          </section>

          <div className="mt-8">
            <PrzewodnikKrokow sekcje={PRZEWODNIKI.soltys} />
          </div>

          <p className="mt-8 text-sm text-stone-600">
            Pełne centrum pomocy (KGW, OSP, myśliwi):{" "}
            <Link href="/pomoc?rola=soltys" className="text-green-800 underline">
              /pomoc
            </Link>
            . Problem techniczny strony:{" "}
            <Link href="/zglos-problem-strony" className="text-green-800 underline">
              zgłoś tutaj
            </Link>
            .
          </p>
        </>
      }
    />
  );
}
