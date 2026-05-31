import Link from "next/link";
import { redirect } from "next/navigation";
import { PanelStronaMoje } from "@/components/panel/panel-strona-moje";
import { MojeDodajGmineKlient } from "@/components/panel/moje/moje-dodaj-gmine-klient";
import { MojeGminyObserwowaneLista } from "@/components/panel/moje/moje-gminy-obserwowane-lista";
import { pobierzMojePowiazania } from "@/lib/panel/pobierz-moje-powiazania";

export const metadata = { title: "Gmina i powiat — Moje" };

export default async function MojeSamorzadPage() {
  const dane = await pobierzMojePowiazania();
  if (!dane) {
    redirect("/logowanie?next=/panel/moje/samorzad");
  }

  const juzObserwowane = dane.gminyObserwowane.map((g) => ({
    wojewodztwo: g.wojewodztwo,
    powiat: g.powiat,
    gmina: g.gmina,
    sciezkaHub: g.sciezkaHub,
  }));

  return (
    <PanelStronaMoje
      tytul="Gmina i powiat"
      opis="Obserwuj całą gminę bez przypisywania wsi albo przejdź do hubów wynikających z Twoich miejscowości."
      dzieci={
        <>
          <section className="mt-8">
            <h2 className="font-serif text-lg text-green-950">Obserwowane gminy (bez przypisanej wsi)</h2>
        <div className="mt-4">
          <MojeGminyObserwowaneLista gminy={dane.gminyObserwowane} />
        </div>
      </section>

      <div className="mt-8">
        <MojeDodajGmineKlient juzObserwowane={juzObserwowane} />
      </div>

      {dane.gminy.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-sm text-stone-600">
          Huby gmin i powiatów z Twoich miejscowości pojawią się po dodaniu wsi w{" "}
          <Link href="/panel/moje/wies" className="font-medium text-green-800 underline">
            Moje wsie
          </Link>
          .
        </p>
      ) : (
        <>
          <section className="mt-10">
            <h2 className="font-serif text-lg text-green-950">Gminy z Twoich miejscowości</h2>
            <ul className="mt-4 space-y-4">
              {dane.gminy.map((g) => (
                <li key={g.klucz} className="karta-wow rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <Link href={g.sciezkaHub} className="font-serif text-lg text-green-950 hover:underline">
                        {g.gmina}
                      </Link>
                      <p className="text-xs text-stone-500">
                        Powiat {g.powiat} · {g.wojewodztwo}
                      </p>
                    </div>
                    <Link
                      href={g.sciezkaHub}
                      className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900 ring-1 ring-emerald-200/60"
                    >
                      Hub gminy →
                    </Link>
                  </div>
                  <p className="mt-3 text-xs text-stone-500">Twoje wsie w tej gminie:</p>
                  <ul className="mt-1 flex flex-wrap gap-2">
                    {g.wies.map((w) => (
                      <li key={w.villageId}>
                        <Link
                          href={w.sciezkaProfilu}
                          className="inline-flex rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-800 hover:bg-stone-200/80"
                        >
                          {w.nazwa}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10">
            <h2 className="font-serif text-lg text-green-950">Powiaty</h2>
            <ul className="mt-4 space-y-4">
              {dane.powiaty.map((p) => (
                <li key={p.klucz} className="karta-wow rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <Link href={p.sciezkaHub} className="font-serif text-lg text-green-950 hover:underline">
                        Powiat {p.powiat}
                      </Link>
                      <p className="text-xs text-stone-500">{p.wojewodztwo}</p>
                    </div>
                    <Link
                      href={p.sciezkaHub}
                      className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900 ring-1 ring-emerald-200/60"
                    >
                      Hub powiatu →
                    </Link>
                  </div>
                  <p className="mt-3 text-xs text-stone-500">
                    {p.gminy.length} {p.gminy.length === 1 ? "gmina" : "gmin"} ·{" "}
                    {p.gminy.reduce((s, g) => s + g.wies.length, 0)} Twoich miejscowości
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {dane.wojewodztwa.length > 1 ? (
            <section className="mt-10">
              <h2 className="font-serif text-lg text-green-950">Województwa</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {dane.wojewodztwa.map((w) => (
                  <li key={w.wojewodztwo}>
                    <Link
                      href={w.sciezkaHub}
                      className="inline-flex rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-green-950 hover:border-emerald-300"
                    >
                      {w.wojewodztwo} ({w.wies.length})
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
        </>
      }
    />
  );
}
