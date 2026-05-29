import type { Metadata } from "next";
import Link from "next/link";
import { RozkladSzukajFormularz } from "@/components/transport/rozklad-szukaj-formularz";
import { wymagajLogowaniaStrona } from "@/lib/auth/wymagaj-logowania-strona";
import { epodroznikSkonfigurowany } from "@/lib/transport/epodroznik-api";
import { gtfsCsvSkonfigurowany } from "@/lib/transport/gtfs-csv";

export const metadata: Metadata = {
  title: "Transport — kolej i autobusy",
  description: "Rozkłady PKP, PKS i busy — hub transportu dostępny po zalogowaniu.",
  robots: { index: false, follow: false },
};

export default async function TransportHubPage() {
  await wymagajLogowaniaStrona("/transport");

  const pkpWlaczone =
    String(process.env.TRANSPORT_SYNC_ENABLED ?? "0") === "1" && !!process.env.PKP_PLK_API_KEY?.trim();
  const autobusWlaczone = String(process.env.TRANSPORT_BUS_SYNC_ENABLED ?? "0") === "1";
  const autobusZrodlo = gtfsCsvSkonfigurowany()
    ? "GTFS CSV"
    : epodroznikSkonfigurowany()
      ? "e-podróżnik API"
      : null;

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
        Na profilach wsi zobaczysz najbliższe odjazdy pociągów (PKP PLK, po synchronizacji) oraz sekcję „Do miasta
        powiatowego” z realnymi połączeniami. Autobusy: cache po włączeniu GTFS lub e-podróżnika.
      </p>

      <ul className="mt-4 flex flex-wrap gap-2 text-xs">
        <li
          className={`rounded-full border px-2.5 py-1 ${pkpWlaczone ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-stone-200 bg-stone-50 text-stone-600"}`}
        >
          PKP live: {pkpWlaczone ? "włączone" : "wyłączone"}
        </li>
        <li
          className={`rounded-full border px-2.5 py-1 ${autobusWlaczone && autobusZrodlo ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-stone-200 bg-stone-50 text-stone-600"}`}
        >
          Autobusy: {autobusWlaczone && autobusZrodlo ? autobusZrodlo : "tylko linki zewnętrzne"}
        </li>
      </ul>

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
        Jesteś mieszkańcem?{" "}
        <Link href="/panel/moje/transport" className="text-green-800 underline">
          Ustawienia transportu
        </Link>{" "}
        (progi opóźnień, stacje docelowe). Sołtys:{" "}
        <Link href="/panel/soltys/transport" className="text-green-800 underline">
          mapowanie stacji PKP
        </Link>
        .
      </p>
    </main>
  );
}
