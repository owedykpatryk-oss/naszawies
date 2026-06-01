import Link from "next/link";
import { OslonaSekcjiWies } from "@/components/wies/oslona-sekcji-wies";
import { QrKronikaHistoriiKlient } from "@/components/wies/qr-kronika-historii-klient";
import { TytulSekcjiWies } from "@/components/wies/tytul-sekcji-wies";
import { UdostepnijHistorieWsiKlient } from "@/components/wies/udostepnij-historie-wsi-klient";

type Props = {
  sciezkaProfilu: string;
  nazwaWsi: string;
  villageId: string;
  zalogowany?: boolean;
  jestSoltys?: boolean;
};

/** Pusty moduł historii — zachęta do pierwszego wpisu i zgłoszeń mieszkańców. */
export function SekcjaHistoriaPusta({
  sciezkaProfilu,
  nazwaWsi,
  zalogowany = false,
  jestSoltys = false,
}: Props) {
  return (
    <OslonaSekcjiWies id="sekcja-historia" wariant="historia">
      <TytulSekcjiWies
        etykieta="Kronika"
        tytul="Historia miejscowości"
        opis="Miejsce na wspomnienia, zdjęcia archiwalne i opowieści mieszkańców — zacznij od pierwszego wpisu."
      />

      <div className="mt-4 rounded-xl border border-dashed border-amber-300/80 bg-amber-50/40 px-4 py-6 text-center">
        <p className="text-4xl" aria-hidden>
          📜
        </p>
        <p className="mt-2 font-medium text-amber-950">Kronika czeka na pierwszy wpis</p>
        <p className="mt-2 text-sm text-stone-600">
          Opisz legendę wsi, ważne wydarzenie lub dodaj zdjęcie z archiwum — mieszkańcy mogą też zgłaszać wspomnienia do
          akceptacji.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {jestSoltys ? (
            <Link
              href="/panel/soltys/spolecznosc/historia"
              className="inline-flex min-h-11 items-center rounded-full bg-green-800 px-5 text-sm font-medium text-white hover:bg-green-900"
            >
              Dodaj pierwszy wpis (panel)
            </Link>
          ) : null}
          {zalogowany ? (
            <Link
              href="/panel/mieszkaniec/historia"
              className="inline-flex min-h-11 items-center rounded-full border border-amber-400 bg-white px-5 text-sm font-medium text-amber-950 hover:bg-amber-50"
            >
              Zgłoś wspomnienie
            </Link>
          ) : (
            <Link
              href="/logowanie"
              className="inline-flex min-h-11 items-center rounded-full border border-amber-400 bg-white px-5 text-sm font-medium text-amber-950 hover:bg-amber-50"
            >
              Zaloguj się i zgłoś wspomnienie
            </Link>
          )}
        </div>
      </div>

      <UdostepnijHistorieWsiKlient sciezkaProfilu={sciezkaProfilu} nazwaWsi={nazwaWsi} />

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <QrKronikaHistoriiKlient nazwaWsi={nazwaWsi} sciezkaProfilu={sciezkaProfilu} />
        <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-700">
          <p className="font-medium text-stone-900">Zaproś sąsiadów</p>
          <p className="mt-1 text-xs text-stone-600">
            Udostępnij link do profilu wsi w grupie na Facebooku lub na tablicy ogłoszeń — im więcej wspomnień, tym
            bogatsza kronika.
          </p>
          <p className="mt-3 text-xs text-stone-500">
            Po pierwszym wpisie pojawi się oś czasu, mapa miejsc i przypomnienie „Dzisiaj w historii”.
          </p>
        </div>
      </div>
    </OslonaSekcjiWies>
  );
}
