import type { Metadata } from "next";
import Link from "next/link";
import { RozkladSzukajFormularz } from "@/components/transport/rozklad-szukaj-formularz";

export const metadata: Metadata = {
  title: "Transport — kolej i autobusy",
  description: "Rozkłady PKP, PKS i busy — linki do wyszukiwarek oraz rozkład stacji kolejowej.",
};

export default function TransportHubPage() {
  return (
    <main className="page-shell py-10 sm:py-14">
      <p className="mb-4 text-sm text-stone-500">
        <Link href="/" className="text-green-800 underline">
          ← Strona główna
        </Link>
        {" · "}
        <Link href="/mapa" className="text-green-800 underline">
          Mapa wsi
        </Link>
      </p>

      <h1 className="font-serif text-3xl text-green-950">Transport publiczny</h1>
      <p className="mt-2 max-w-2xl text-sm text-stone-600">
        Na profilach wsi zobaczysz najbliższe odjazdy pociągów (PKP PLK, po synchronizacji). Rozkłady PKS i autobusów
        sprawdzisz w zewnętrznych wyszukiwarkach — linki są też przy każdej wsi.
      </p>

      <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="font-serif text-xl text-green-950">Kolej — rozkład stacji</h2>
        <p className="mt-1 text-sm text-stone-600">Wyszukaj stację PKP i zobacz nadchodzące odjazdy (wymaga klucza API na serwerze).</p>
        <RozkladSzukajFormularz />
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-sky-200/80 bg-sky-50/40 p-4">
          <h3 className="font-medium text-sky-950">PKP</h3>
          <p className="mt-1 text-sm text-stone-700">Oficjalny rozkład i opóźnienia pociągów.</p>
          <a
            href="https://rozklad.pkp.pl/pl/recommended"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm font-medium text-green-800 underline"
          >
            rozklad.pkp.pl ↗
          </a>
        </div>
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4">
          <h3 className="font-medium text-amber-950">PKS i busy</h3>
          <p className="mt-1 text-sm text-stone-700">
            Brak jednego krajowego API PKS — użyj e-podróżnika lub Jakdojade przy wsi na mapie.
          </p>
          <a
            href="https://www.e-podroznik.pl"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm font-medium text-green-800 underline"
          >
            e-podroznik.pl ↗
          </a>
        </div>
      </section>

      <p className="mt-8 text-sm text-stone-600">
        Jesteś mieszkańcem? Ustaw{" "}
        <Link href="/panel/mieszkaniec" className="text-green-800 underline">
          ulubione relacje transportowe
        </Link>{" "}
        i włącz powiadomienia o opóźnieniach kolei.
      </p>
    </main>
  );
}
