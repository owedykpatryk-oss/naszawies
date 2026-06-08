import Link from "next/link";
import { linkChroniony } from "@/lib/auth/sciezki-chronione";
import type { HubGminy, HubPowiatu, HubWojewodztwa } from "@/lib/wies/hub-administracyjny";
import { SekcjaLinkiPrzydatne } from "@/components/wies/sekcja-linki-przydatne";
import type { LinkPrzydatnyPubliczny } from "@/lib/wies/linki-przydatne";
import { ListaWsiFiltrowanaKlient } from "@/components/wies/lista-wsi-filtrowana-klient";
import { MojeObserwujGminePasek } from "@/components/panel/moje/moje-obserwuj-gmine-pasek";
import { sciezkaPowiatu, sciezkaWojewodztwa } from "@/lib/wies/sciezka-publiczna";
import { KartaStatystykiHub } from "@/components/wies/karta-statystyki-hub";
import { TytulSekcjiWies } from "@/components/wies/tytul-sekcji-wies";

function formatPopulacja(n: number | null): string {
  if (n == null) return "—";
  return n.toLocaleString("pl-PL");
}

function Okruszki({
  woj,
  pow,
  gmina,
}: {
  woj: string;
  pow?: string;
  gmina?: string;
}) {
  return (
    <nav className="mb-6 text-sm text-stone-600" aria-label="Okruszki">
      <Link href="/" className="text-green-800 hover:underline">
        Strona główna
      </Link>
      {" · "}
      <Link href="/szukaj" className="text-green-800 hover:underline">
        Szukaj
      </Link>
      {" · "}
      <Link href={sciezkaWojewodztwa(woj)} className="text-green-800 hover:underline">
        {woj}
      </Link>
      {pow ? (
        <>
          {" · "}
          <Link href={sciezkaPowiatu({ voivodeship: woj, county: pow })} className="text-green-800 hover:underline">
            pow. {pow}
          </Link>
        </>
      ) : null}
      {gmina ? <span className="text-stone-800"> · {gmina}</span> : null}
    </nav>
  );
}

export function HubGminyStrona({
  hub,
  linkiPrzydatne = [],
  zalogowany = false,
}: {
  hub: HubGminy;
  linkiPrzydatne?: LinkPrzydatnyPubliczny[];
  zalogowany?: boolean;
}) {
  const aktywne = hub.wies.filter((w) => w.is_active).length;

  return (
    <main className="mx-auto min-w-0 w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <Okruszki woj={hub.wojewodztwo} pow={hub.powiat} gmina={hub.gmina} />
      <header className="wow-wejscie">
        <p className="text-xs font-bold uppercase tracking-wider text-green-800">Gmina</p>
        <h1 className="mt-1 font-serif text-3xl text-green-950 sm:text-4xl">{hub.gmina}</h1>
        <p className="mt-2 text-sm text-stone-600">
          Powiat {hub.powiat} · woj. {hub.wojewodztwo}
        </p>
        <MojeObserwujGminePasek wojewodztwo={hub.wojewodztwo} powiat={hub.powiat} gmina={hub.gmina} />
      </header>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <KartaStatystykiHub etykieta="Miejscowości w serwisie" wartosc={hub.wies.length} />
        <KartaStatystykiHub etykieta="Aktywne profile" wartosc={aktywne} wariant="akcent" />
        <KartaStatystykiHub
          etykieta="Łącznie mieszkańców (szac.)"
          wartosc={formatPopulacja(hub.wies.reduce((s, w) => s + (w.population ?? 0), 0))}
        />
      </div>

      <SekcjaLinkiPrzydatne linki={linkiPrzydatne} nazwaGminy={hub.gmina} />

      <section className="sekcja-poza-foldem mt-10">
        <TytulSekcjiWies
          tytul="Sołectwa i miejscowości — jednym kliknięciem"
          opis="Wybierz wieś, aby zobaczyć profil, ogłoszenia, kalendarz świetlicy i więcej."
        />
        <div className="mt-5">
          <ListaWsiFiltrowanaKlient wies={hub.wies} />
        </div>
      </section>

      <p className="mt-10 text-sm text-stone-500">
        <Link href={sciezkaPowiatu({ voivodeship: hub.wojewodztwo, county: hub.powiat })} className="text-green-800 underline">
          ← Wszystkie gminy w powiecie {hub.powiat}
        </Link>
        {" · "}
        <Link href={linkChroniony("/mapa", zalogowany)} className="text-green-800 underline">
          Mapa wsi
        </Link>
      </p>
    </main>
  );
}

export function HubPowiatuStrona({ hub }: { hub: HubPowiatu }) {
  return (
    <main className="mx-auto min-w-0 w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <Okruszki woj={hub.wojewodztwo} pow={hub.powiat} />
      <header className="wow-wejscie">
        <p className="text-xs font-bold uppercase tracking-wider text-green-800">Powiat</p>
        <h1 className="mt-1 font-serif text-3xl text-green-950 sm:text-4xl">Powiat {hub.powiat}</h1>
        <p className="mt-2 text-sm text-stone-600">Województwo {hub.wojewodztwo}</p>
      </header>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <KartaStatystykiHub etykieta="Gmin" wartosc={hub.gminy.length} />
        <KartaStatystykiHub etykieta="Miejscowości" wartosc={hub.wies.length} />
        <KartaStatystykiHub
          etykieta="Aktywne profile"
          wartosc={hub.wies.filter((w) => w.is_active).length}
          wariant="akcent"
        />
      </div>

      <section className="sekcja-poza-foldem mt-10">
        <TytulSekcjiWies tytul="Gminy w powiecie" opis="Kliknij gminę — zobaczysz listę wsi pod nią." />
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {hub.gminy.map((g) => (
            <li key={g.commune}>
              <Link
                href={g.sciezka}
                className="karta-wow block rounded-xl border border-stone-200 bg-white p-4 shadow-sm ring-1 ring-stone-900/[0.02]"
              >
                <p className="font-semibold text-green-950">{g.commune}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {g.commune_type} · {g.liczba_wsi} miejsc.
                  {g.liczba_aktywnych < g.liczba_wsi ? ` · ${g.liczba_aktywnych} aktywnych` : null}
                </p>
                <p className="mt-2 text-sm font-medium text-green-800">Zobacz miejscowości →</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="sekcja-poza-foldem mt-12">
        <TytulSekcjiWies tytul="Wszystkie miejscowości w powiecie" />
        <div className="mt-5">
          <ListaWsiFiltrowanaKlient wies={hub.wies} grupujPoGminie />
        </div>
      </section>

      <p className="mt-10 text-sm text-stone-500">
        <Link href={sciezkaWojewodztwa(hub.wojewodztwo)} className="text-green-800 underline">
          ← Powiaty w woj. {hub.wojewodztwo}
        </Link>
      </p>
    </main>
  );
}

export function HubWojewodztwaStrona({ hub, zalogowany = false }: { hub: HubWojewodztwa; zalogowany?: boolean }) {
  return (
    <main className="mx-auto min-w-0 w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <Okruszki woj={hub.wojewodztwo} />
      <header className="wow-wejscie">
        <p className="text-xs font-bold uppercase tracking-wider text-green-800">Województwo</p>
        <h1 className="mt-1 font-serif text-3xl text-green-950 sm:text-4xl">{hub.wojewodztwo}</h1>
      </header>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <KartaStatystykiHub etykieta="Powiatów" wartosc={hub.powiaty.length} />
        <KartaStatystykiHub etykieta="Miejscowości w serwisie" wartosc={hub.liczba_wsi} />
        <KartaStatystykiHub etykieta="Aktywne profile" wartosc={hub.liczba_aktywnych} wariant="akcent" />
      </div>

      <section className="sekcja-poza-foldem mt-10">
        <TytulSekcjiWies tytul="Powiaty" />
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {hub.powiaty.map((p) => (
            <li key={p.county}>
              <Link
                href={p.sciezka}
                className="karta-wow block rounded-xl border border-stone-200 bg-white p-4 shadow-sm ring-1 ring-stone-900/[0.02]"
              >
                <p className="font-semibold text-green-950">Powiat {p.county}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {p.liczba_gmin} gmin · {p.liczba_wsi} miejsc.
                </p>
                <p className="mt-2 text-sm font-medium text-green-800">Gminy i wsie →</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-10 text-sm text-stone-500">
        <Link href="/szukaj" className="text-green-800 underline">
          Szukaj miejscowości
        </Link>
        {" · "}
        <Link href={linkChroniony("/mapa", zalogowany)} className="text-green-800 underline">
          Mapa
        </Link>
      </p>
    </main>
  );
}
