import Link from "next/link";
import { redirect } from "next/navigation";
import { MojeDodajWiesKlient } from "@/components/panel/moje/moje-dodaj-wies-klient";
import { MojeKartaWsi } from "@/components/panel/moje/moje-karta-wsi";
import { pobierzMojePowiazania } from "@/lib/panel/pobierz-moje-powiazania";

export const metadata = { title: "Moje wsie" };

export default async function MojeWiesPage() {
  const dane = await pobierzMojePowiazania();
  if (!dane) {
    redirect("/logowanie?next=/panel/moje/wies");
  }

  const mieszkam = dane.wies.filter((w) => w.rola && w.statusRoli === "active");
  const obserwuje = dane.wies.filter((w) => !w.rola && w.followId);
  const wnioskiWToku = dane.wies.filter((w) => w.rola && w.statusRoli === "pending");

  return (
    <main>
      <h1 className="font-serif text-2xl text-green-950">Moje wsie</h1>
      <p className="mt-2 text-sm text-stone-600">
        Gdzie jesteś członkiem, co obserwujesz bez członkostwa oraz wnioski oczekujące na zatwierdzenie sołtysa.
      </p>

      <div className="mt-8">
        <MojeDodajWiesKlient />
      </div>

      {mieszkam.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-serif text-lg text-green-950">Mieszkam / jestem członkiem</h2>
          <p className="mt-1 text-xs text-stone-600">Aktywne role — skróty do ogłoszeń, świetlicy i profilu wsi.</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {mieszkam.map((w) => (
              <li key={w.villageId}>
                <MojeKartaWsi wies={w} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {obserwuje.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-serif text-lg text-green-950">Obserwuję (ulubione)</h2>
          <p className="mt-1 text-xs text-stone-600">
            Bez członkostwa — powiadomienia ustawisz w{" "}
            <Link href="/panel/moje/ulubione" className="text-green-800 underline">
              Ulubione
            </Link>
            .
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {obserwuje.map((w) => (
              <li key={w.villageId}>
                <MojeKartaWsi wies={w} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {wnioskiWToku.length > 0 ? (
        <section id="wnioski-w-toku" className="mt-10 scroll-mt-24">
          <h2 className="font-serif text-lg text-green-950">Wniosek w toku</h2>
          <p className="mt-1 text-xs text-stone-600">Sołtys musi zatwierdzić rolę — dostaniesz powiadomienie w skrzynce.</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {wnioskiWToku.map((w) => (
              <li key={w.villageId}>
                <MojeKartaWsi wies={w} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {dane.wies.length === 0 ? (
        <p className="mt-10 text-sm text-stone-500">Po dodaniu pierwszej miejscowości pojawi się ona na liście powyżej.</p>
      ) : null}
    </main>
  );
}
