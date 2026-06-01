import Link from "next/link";
import { OslonaSekcjiWies } from "@/components/wies/oslona-sekcji-wies";
import { QrTerminarzSportuKlient } from "@/components/wies/qr-terminarz-sportu-klient";
import { TytulSekcjiWies } from "@/components/wies/tytul-sekcji-wies";

type Props = {
  sciezkaProfilu: string;
  nazwaWsi: string;
};

export function SekcjaSportPusta({ sciezkaProfilu, nazwaWsi }: Props) {
  return (
    <OslonaSekcjiWies id="sekcja-sport" wariant="sport">
      <TytulSekcjiWies
        wariant="sport"
        etykieta="Sport"
        tytul="Klub i terminarz"
        opis={`Miejsce na treningi, mecze i kontakt do klubu sportowego we wsi ${nazwaWsi}.`}
      />
      <div className="mt-4 rounded-xl border border-dashed border-sky-300/80 bg-sky-50/40 px-4 py-6 text-center">
        <p className="text-4xl" aria-hidden>
          ⚽
        </p>
        <p className="mt-2 font-medium text-sky-950">Brak opublikowanego terminarza</p>
        <p className="mt-2 text-sm text-stone-600">
          Sołtys może dodać klub (typ „sport”), stałe treningi w planie tygodnia oraz mecze w kalendarzu wydarzeń.
        </p>
        <Link
          href="/panel/soltys/sport"
          className="mt-4 inline-flex min-h-11 items-center rounded-full bg-green-800 px-5 text-sm font-medium text-white hover:bg-green-900"
        >
          Panel sportu (sołtys)
        </Link>
        <p className="mt-3 text-xs text-stone-500">
          Po publikacji mieszkańcy zobaczą tu treningi, mecze i miejsce spotkań — link:{" "}
          <span className="font-mono text-stone-700">{sciezkaProfilu}#sekcja-sport</span>
        </p>
        <div className="mt-6 text-left">
          <QrTerminarzSportuKlient nazwaWsi={nazwaWsi} sciezkaProfilu={sciezkaProfilu} />
        </div>
      </div>
    </OslonaSekcjiWies>
  );
}
