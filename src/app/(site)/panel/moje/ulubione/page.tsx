import Link from "next/link";
import { redirect } from "next/navigation";
import { PanelStronaMoje } from "@/components/panel/panel-strona-moje";
import { MojeGminyObserwowaneLista } from "@/components/panel/moje/moje-gminy-obserwowane-lista";
import { MojeZapisaneTresciLista } from "@/components/panel/moje/moje-zapisane-tresci-lista";
import { MojeUlubioneLista } from "@/components/panel/moje/moje-ulubione-lista";
import { pobierzMojePowiazania } from "@/lib/panel/pobierz-moje-powiazania";

export const metadata = { title: "Ulubione — Moje" };

export default async function MojeUlubionePage() {
  const dane = await pobierzMojePowiazania();
  if (!dane) {
    redirect("/logowanie?next=/panel/moje/ulubione");
  }

  return (
    <PanelStronaMoje
      tytul="Ulubione"
      opis="Obserwowane miejscowości, zapisane ogłoszenia i wydarzenia oraz relacje transportowe — w jednym miejscu."
      dzieci={
        <>
          <section className="mt-8">
            <h2 className="font-serif text-lg text-green-950">Zapisane ogłoszenia i wydarzenia</h2>
        <div className="mt-4">
          <MojeZapisaneTresciLista tresci={dane.zapisaneTresci} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-lg text-green-950">Obserwowane wsie</h2>
        <div className="mt-4">
          <MojeUlubioneLista wies={dane.wies} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-lg text-green-950">Obserwowane gminy</h2>
        <p className="mt-1 text-xs text-stone-600">
          Gminy bez przypisanej wsi — feed „Co nowego” obejmuje też ich miejscowości. Zarządzanie:{" "}
          <Link href="/panel/moje/samorzad" className="text-green-800 underline">
            Moja gmina
          </Link>
          .
        </p>
        <div className="mt-4">
          <MojeGminyObserwowaneLista gminy={dane.gminyObserwowane} />
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-sky-200/80 bg-sky-50/30 p-5">
        <h2 className="font-serif text-lg text-green-950">Relacje transportowe</h2>
        <p className="mt-1 text-xs text-stone-600">
          Połączenia do miasta powiatowego i wojewódzkiego — dodawane automatycznie dla aktywnych ról we wsi.
        </p>
        {dane.relacjeTransportowe.length === 0 ? (
          <p className="mt-3 text-sm text-stone-600">Brak zapisanych relacji.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {dane.relacjeTransportowe.map((r) => (
              <li key={r.id} className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700">
                <strong>{r.title}</strong>
                {r.target_label ? ` · ${r.target_label}` : ""}
                {r.target_station_name ? (
                  <span className="block text-xs text-stone-500">PKP: {r.target_station_name}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-sm">
          <Link href="/panel/moje/transport" className="font-medium text-green-800 underline">
            Edytuj progi i stacje docelowe →
          </Link>
        </p>
      </section>

      <p className="mt-8 text-sm text-stone-500">
        Chcesz dodać kolejną wieś?{" "}
        <Link href="/panel/moje/wies" className="text-green-800 underline">
          Moje wsie → Dodaj miejscowość
        </Link>
      </p>
        </>
      }
    />
  );
}
