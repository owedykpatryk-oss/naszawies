import Link from "next/link";
import { KartaBudynkuSwietlicy } from "@/components/swietlica/karta-budynku-swietlicy";
import type { SalaPublicznaWsi } from "@/lib/swietlica/pobierz-sale-publiczne-wsi";

type Props = {
  nazwaWsi: string;
  sale: SalaPublicznaWsi[];
};

export function SwietliceWsiPubliczneSekcja({ nazwaWsi, sale }: Props) {
  if (sale.length === 0) return null;

  return (
    <section id="swietlice-wsi" className="scroll-mt-8 mt-10">
      <h2 className="font-serif text-xl text-green-950">Świetlice w {nazwaWsi}</h2>
      <p className="mt-1 text-sm text-stone-600">
        Sale wiejskie w sołectwie — rezerwacja po zalogowaniu jako mieszaniec. Poniżej adres, metraż i parking.
      </p>
      <ul className="mt-5 space-y-4">
        {sale.map((s) => (
          <li key={s.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
            <KartaBudynkuSwietlicy
              nazwa={s.name}
              adres={s.address}
              areaM2={s.area_m2}
              maxCapacity={s.max_capacity}
              parkingSpaces={s.parking_spaces}
              opis={s.description}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/logowanie?next=${encodeURIComponent(`/panel/mieszkaniec/swietlica/${s.id}`)}`}
                className="inline-flex min-h-[44px] items-center rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900"
              >
                Zaloguj się — rezerwacja sali
              </Link>
              <Link
                href={`/logowanie?next=${encodeURIComponent(`/panel/mieszkaniec/swietlica/${s.id}/dokument`)}`}
                className="inline-flex min-h-[44px] items-center rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm text-stone-800 hover:bg-stone-50"
              >
                Dokument informacyjny
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
