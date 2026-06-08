import type { Metadata } from "next";
import Link from "next/link";
import { BramkiChronionychTras } from "@/components/panel/bramki-chronionych-tras";
import { LinkPomocyKontekstowej } from "@/components/pomoc/link-pomocy-kontekstowej";
import { HeroModuluPublicznego } from "@/components/wspolne/hero-modulu-publicznego";
import { RozkladSzukajFormularz } from "@/components/transport/rozklad-szukaj-formularz";
import { epodroznikSkonfigurowany } from "@/lib/transport/epodroznik-api";
import { gtfsCsvSkonfigurowany } from "@/lib/transport/gtfs-csv";

export const metadata: Metadata = {
  title: "Transport — kolej i autobusy",
  description: "Rozkłady PKP, PKS i busy — hub transportu dostępny po zalogowaniu.",
  robots: { index: false, follow: false },
};

export default async function TransportHubPage() {
  const pkpWlaczone =
    String(process.env.TRANSPORT_SYNC_ENABLED ?? "0") === "1" && !!process.env.PKP_PLK_API_KEY?.trim();
  const autobusWlaczone = String(process.env.TRANSPORT_BUS_SYNC_ENABLED ?? "0") === "1";
  const autobusZrodlo = gtfsCsvSkonfigurowany()
    ? "GTFS CSV"
    : epodroznikSkonfigurowany()
      ? "e-podróżnik API"
      : null;

  return (
    <>
      <BramkiChronionychTras />
    <main className="page-shell py-6 sm:py-10">
      <HeroModuluPublicznego
        etykieta="Transport"
        tytul="Transport publiczny"
        opis="Rozkłady PKP na profilach wsi, sekcja „Do miasta powiatowego” i cache autobusów (GTFS / e-podróżnik). Na mapie włącz warstwę transportu."
        dzieci={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/mapa?warstwa=transport"
              className="inline-flex min-h-[40px] items-center rounded-xl bg-green-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-900"
            >
              Mapa — warstwa transportu
            </Link>
            <LinkPomocyKontekstowej href="/pomoc#mapa" label="Pomoc: mapa i transport" />
          </div>
        }
      />

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

      <section className="panel-karta mt-8">
        <h2 className="tytul-sekcji-panelu text-xl">Kolej — rozkład stacji</h2>
        <p className="mt-1 text-sm text-stone-600">Wyszukaj stację PKP i zobacz nadchodzące odjazdy (wymaga klucza API na serwerze).</p>
        <div className="mt-4">
          <RozkladSzukajFormularz />
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="karta-skrot-modulu border-sky-200/80 bg-sky-50/40">
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
        <div className="karta-skrot-modulu border-amber-200/80 bg-amber-50/40">
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
    </>
  );
}
