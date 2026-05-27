import type { Metadata } from "next";
import Link from "next/link";
import { PrzewodnikKrokow } from "@/components/pomoc/przewodnik-krokow";
import { PRZEWODNIKI } from "@/lib/pomoc/przewodniki";

export const metadata: Metadata = {
  title: "Pomoc — panel sołtysa",
};

export default function SoltysPomocPage() {
  return (
    <main>
      <p className="mb-4 text-sm text-stone-500">
        <Link href="/panel/soltys" className="text-green-800 underline">
          ← Panel sołtysa
        </Link>
      </p>
      <h1 className="tytul-sekcji-panelu">Pomoc sołtysa</h1>
      <p className="mt-2 max-w-3xl text-sm text-stone-600">
        Przewodnik krok po kroku: decyzje, kalendarz, grupy (KGW, OSP), polowania i komunikacja z mieszkańcami.
      </p>

      <section className="mt-6 rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4">
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
    </main>
  );
}
