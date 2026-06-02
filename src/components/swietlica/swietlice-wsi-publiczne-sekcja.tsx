import Link from "next/link";
import { KartaBudynkuSwietlicy } from "@/components/swietlica/karta-budynku-swietlicy";
import { GaleriaProfiluSwietlicyPubliczna } from "@/components/swietlica/galeria-profilu-swietlicy-publiczna";
import { linkChroniony } from "@/lib/auth/sciezki-chronione";
import type { SalaPublicznaWsi } from "@/lib/swietlica/pobierz-sale-publiczne-wsi";
import { KARTA_LISTY_WIES, OslonaSekcjiWies } from "@/components/wies/oslona-sekcji-wies";
import { TytulSekcjiWies } from "@/components/wies/tytul-sekcji-wies";

type Props = {
  nazwaWsi: string;
  sale: SalaPublicznaWsi[];
  zalogowany?: boolean;
};

export function SwietliceWsiPubliczneSekcja({ nazwaWsi, sale, zalogowany = false }: Props) {
  if (sale.length === 0) return null;

  return (
    <OslonaSekcjiWies id="swietlice-wsi">
      <TytulSekcjiWies
        etykieta="Świetlica"
        tytul={`Świetlice w ${nazwaWsi}`}
        opis="Sale wiejskie w sołectwie — kalendarz zajętości uzupełnia sołtys. Poniżej adres, metraż i wolne/zajęte terminy."
      />
      <ul className="mt-5 space-y-4">
        {sale.map((s) => (
          <li key={s.id} className={`${KARTA_LISTY_WIES} p-4 sm:p-5`}>
            <KartaBudynkuSwietlicy
              nazwa={s.name}
              adres={s.address}
              areaM2={s.area_m2}
              maxCapacity={s.max_capacity}
              parkingSpaces={s.parking_spaces}
              opis={s.description}
            />
            <GaleriaProfiluSwietlicyPubliczna nazwaSali={s.name} zdjecia={s.profile_photos} />
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={linkChroniony(`/panel/mieszkaniec/swietlica/${s.id}`, zalogowany)}
                className="inline-flex min-h-[44px] items-center rounded-lg border border-green-800/40 bg-white px-4 py-2 text-sm font-medium text-green-900 hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-800"
              >
                Kalendarz sali (podgląd)
              </Link>
              <Link
                href={linkChroniony(`/panel/mieszkaniec/swietlica/${s.id}/dokument`, zalogowany)}
                className="inline-flex min-h-[44px] items-center rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm text-stone-800 hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-800"
              >
                Dokument informacyjny
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </OslonaSekcjiWies>
  );
}
