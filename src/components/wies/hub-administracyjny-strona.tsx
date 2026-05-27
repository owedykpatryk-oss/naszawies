import Link from "next/link";
import type { HubGminy, HubPowiatu, HubWojewodztwa, WiesNaHubie } from "@/lib/wies/hub-administracyjny";
import { SekcjaLinkiPrzydatne } from "@/components/wies/sekcja-linki-przydatne";
import type { LinkPrzydatnyPubliczny } from "@/lib/wies/linki-przydatne";
import { sciezkaGminy, sciezkaPowiatu, sciezkaWojewodztwa } from "@/lib/wies/sciezka-publiczna";

function formatPopulacja(n: number | null): string {
  if (n == null) return "—";
  return n.toLocaleString("pl-PL");
}

function ListaWsi({ wies, grupujPoGminie }: { wies: WiesNaHubie[]; grupujPoGminie?: boolean }) {
  if (!grupujPoGminie) {
    return (
      <ul className="mt-4 divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white shadow-sm">
        {wies.map((v) => (
          <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <div>
              <Link href={v.sciezka} className="font-medium text-green-900 hover:underline">
                {v.name}
              </Link>
              {!v.is_active ? (
                <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-900">
                  w przygotowaniu
                </span>
              ) : null}
              <p className="text-xs text-stone-500">
                {v.commune} · ok. {formatPopulacja(v.population)} mieszk.
              </p>
            </div>
            <Link href={v.sciezka} className="text-sm text-green-800 underline">
              Profil →
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  const poGminie = wies.reduce<Record<string, WiesNaHubie[]>>((acc, v) => {
    const k = v.commune;
    if (!acc[k]) acc[k] = [];
    acc[k]!.push(v);
    return acc;
  }, {});

  return (
    <div className="mt-4 space-y-6">
      {Object.entries(poGminie)
        .sort(([a], [b]) => a.localeCompare(b, "pl"))
        .map(([gmina, lista]) => (
          <section key={gmina}>
            <h3 className="text-sm font-semibold text-stone-800">
              <Link
                href={sciezkaGminy({
                  voivodeship: lista[0]!.voivodeship,
                  county: lista[0]!.county,
                  commune: gmina,
                })}
                className="text-green-900 hover:underline"
              >
                {gmina}
              </Link>
              <span className="ml-2 font-normal text-stone-500">({lista.length} miejsc.)</span>
            </h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {lista.map((v) => (
                <li key={v.id}>
                  <Link
                    href={v.sciezka}
                    className="inline-flex rounded-full border border-stone-200 bg-white px-3 py-1 text-sm text-stone-800 hover:border-green-300 hover:bg-green-50"
                  >
                    {v.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
    </div>
  );
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
}: {
  hub: HubGminy;
  linkiPrzydatne?: LinkPrzydatnyPubliczny[];
}) {
  const aktywne = hub.wies.filter((w) => w.is_active).length;

  return (
    <main className="mx-auto min-w-0 max-w-3xl py-10 sm:py-14">
      <Okruszki woj={hub.wojewodztwo} pow={hub.powiat} gmina={hub.gmina} />
      <p className="text-xs font-bold uppercase tracking-wider text-green-800">Gmina</p>
      <h1 className="mt-1 font-serif text-3xl text-green-950">{hub.gmina}</h1>
      <p className="mt-2 text-sm text-stone-600">
        Powiat {hub.powiat} · woj. {hub.wojewodztwo}
      </p>

      <dl className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
          <dt className="text-xs text-stone-500">Miejscowości w serwisie</dt>
          <dd className="text-2xl font-semibold text-stone-900">{hub.wies.length}</dd>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
          <dt className="text-xs text-emerald-800">Aktywne profile</dt>
          <dd className="text-2xl font-semibold text-emerald-950">{aktywne}</dd>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
          <dt className="text-xs text-stone-500">Łącznie mieszkańców (szac.)</dt>
          <dd className="text-2xl font-semibold text-stone-900">
            {formatPopulacja(hub.wies.reduce((s, w) => s + (w.population ?? 0), 0))}
          </dd>
        </div>
      </dl>

      <SekcjaLinkiPrzydatne linki={linkiPrzydatne} nazwaGminy={hub.gmina} />

      <section className="mt-10">
        <h2 className="font-serif text-xl text-green-950">Sołectwa i miejscowości — jednym kliknięciem</h2>
        <p className="mt-1 text-sm text-stone-600">
          Wybierz wieś, aby zobaczyć profil, ogłoszenia, kalendarz świetlicy i więcej.
        </p>
        <ListaWsi wies={hub.wies} />
      </section>

      <p className="mt-10 text-sm text-stone-500">
        <Link href={sciezkaPowiatu({ voivodeship: hub.wojewodztwo, county: hub.powiat })} className="text-green-800 underline">
          ← Wszystkie gminy w powiecie {hub.powiat}
        </Link>
        {" · "}
        <Link href="/mapa" className="text-green-800 underline">
          Mapa wsi
        </Link>
      </p>
    </main>
  );
}

export function HubPowiatuStrona({ hub }: { hub: HubPowiatu }) {
  return (
    <main className="mx-auto min-w-0 max-w-4xl py-10 sm:py-14">
      <Okruszki woj={hub.wojewodztwo} pow={hub.powiat} />
      <p className="text-xs font-bold uppercase tracking-wider text-green-800">Powiat</p>
      <h1 className="mt-1 font-serif text-3xl text-green-950">Powiat {hub.powiat}</h1>
      <p className="mt-2 text-sm text-stone-600">Województwo {hub.wojewodztwo}</p>

      <dl className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
          <dt className="text-xs text-stone-500">Gmin</dt>
          <dd className="text-2xl font-semibold">{hub.gminy.length}</dd>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
          <dt className="text-xs text-stone-500">Miejscowości</dt>
          <dd className="text-2xl font-semibold">{hub.wies.length}</dd>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
          <dt className="text-xs text-emerald-800">Aktywne profile</dt>
          <dd className="text-2xl font-semibold text-emerald-950">{hub.wies.filter((w) => w.is_active).length}</dd>
        </div>
      </dl>

      <section className="mt-10">
        <h2 className="font-serif text-xl text-green-950">Gminy w powiecie</h2>
        <p className="mt-1 text-sm text-stone-600">Kliknij gminę — zobaczysz listę wsi pod nią.</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {hub.gminy.map((g) => (
            <li key={g.commune}>
              <Link
                href={g.sciezka}
                className="block rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-green-300 hover:shadow-md"
              >
                <p className="font-semibold text-green-950">{g.commune}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {g.commune_type} · {g.liczba_wsi} miejsc.
                  {g.liczba_aktywnych < g.liczba_wsi
                    ? ` · ${g.liczba_aktywnych} aktywnych`
                    : null}
                </p>
                <p className="mt-2 text-sm font-medium text-green-800">Zobacz miejscowości →</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-xl text-green-950">Wszystkie miejscowości w powiecie</h2>
        <ListaWsi wies={hub.wies} grupujPoGminie />
      </section>

      <p className="mt-10 text-sm text-stone-500">
        <Link href={sciezkaWojewodztwa(hub.wojewodztwo)} className="text-green-800 underline">
          ← Powiaty w woj. {hub.wojewodztwo}
        </Link>
      </p>
    </main>
  );
}

export function HubWojewodztwaStrona({ hub }: { hub: HubWojewodztwa }) {
  return (
    <main className="mx-auto min-w-0 max-w-4xl py-10 sm:py-14">
      <Okruszki woj={hub.wojewodztwo} />
      <p className="text-xs font-bold uppercase tracking-wider text-green-800">Województwo</p>
      <h1 className="mt-1 font-serif text-3xl text-green-950">{hub.wojewodztwo}</h1>

      <dl className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
          <dt className="text-xs text-stone-500">Powiatów</dt>
          <dd className="text-2xl font-semibold">{hub.powiaty.length}</dd>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
          <dt className="text-xs text-stone-500">Miejscowości w serwisie</dt>
          <dd className="text-2xl font-semibold">{hub.wies.length}</dd>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
          <dt className="text-xs text-emerald-800">Aktywne profile</dt>
          <dd className="text-2xl font-semibold text-emerald-950">{hub.wies.filter((w) => w.is_active).length}</dd>
        </div>
      </dl>

      <section className="mt-10">
        <h2 className="font-serif text-xl text-green-950">Powiaty</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {hub.powiaty.map((p) => (
            <li key={p.county}>
              <Link
                href={p.sciezka}
                className="block rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:border-green-300 hover:shadow-md"
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
        <Link href="/mapa" className="text-green-800 underline">
          Mapa
        </Link>
      </p>
    </main>
  );
}
