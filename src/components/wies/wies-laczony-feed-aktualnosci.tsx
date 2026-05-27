import Link from "next/link";
import type { ElementLaczonegoFeedu } from "@/lib/wies/zbuduj-laczony-feed-aktualnosci";
import { TytulSekcjiWies } from "@/components/wies/tytul-sekcji-wies";

const STYL_ETYKIETY: Record<string, string> = {
  Ogłoszenie: "bg-amber-100 text-amber-950 ring-amber-200/80",
  Blog: "bg-violet-100 text-violet-950 ring-violet-200/80",
  "Historia wsi": "bg-stone-200/80 text-stone-800 ring-stone-300/60",
  "Wiadomość lokalna": "bg-sky-100 text-sky-950 ring-sky-200/80",
  Wydarzenie: "bg-emerald-100 text-emerald-950 ring-emerald-200/80",
  Rynek: "bg-orange-100 text-orange-950 ring-orange-200/80",
};

function EtykietaFeedu({ tekst }: { tekst: string }) {
  const klasy = STYL_ETYKIETY[tekst] ?? "bg-stone-100 text-stone-800 ring-stone-200/80";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${klasy}`}>
      {tekst}
    </span>
  );
}

/** Skrót chronologiczny z kilku modułów — ułatwia mieszkańcom „co nowego” bez przechodzenia po zakładkach. */
export function WiesLaczonyFeedAktualnosci({ wpisy }: { wpisy: ElementLaczonegoFeedu[] }) {
  if (wpisy.length === 0) {
    return (
      <section
        id="sekcja-aktualnosci-laczone"
        className="sekcja-poza-foldem mt-10 scroll-mt-8 rounded-2xl border border-dashed border-stone-300/90 bg-stone-50/80 px-5 py-6"
      >
        <TytulSekcjiWies
          etykieta="Chronologia"
          tytul="Najnowsze na wsi"
          opis="Gdy pojawią się ogłoszenia, wpisy bloga, historia, wiadomości lub wydarzenia, zobaczysz tu jeden wspólny skrót chronologiczny."
        />
      </section>
    );
  }

  return (
    <section
      id="sekcja-aktualnosci-laczone"
      className="sekcja-poza-foldem wow-wejscie mt-10 scroll-mt-8 overflow-hidden rounded-2xl border border-emerald-900/10 bg-gradient-to-br from-[#f5f9f0] via-white to-sky-50/40 p-5 shadow-sm ring-1 ring-stone-900/[0.02] sm:p-6"
    >
      <TytulSekcjiWies
        etykieta="Chronologia"
        tytul="Najnowsze na wsi"
        opis="Jedna lista — ogłoszenia, blog, historia, wiadomości lokalne i zbliżające się wydarzenia, od najnowszych."
      />
      <ul className="mt-5 space-y-2">
        {wpisy.map((w) => (
          <li key={`${w.etykieta}-${w.href}-${w.sortAt}`}>
            <Link
              href={w.href}
              className="karta-wow group flex gap-3 rounded-xl border border-stone-200/90 bg-white/95 px-3 py-3 shadow-sm ring-1 ring-stone-900/[0.02] sm:px-4"
            >
              <span className="mt-0.5 hidden w-1 shrink-0 rounded-full bg-gradient-to-b from-emerald-500/70 to-emerald-500/20 sm:block" aria-hidden />
              <div className="min-w-0 flex-1">
                <EtykietaFeedu tekst={w.etykieta} />
                <p className="mt-1.5 font-medium text-stone-900 transition group-hover:text-green-950">{w.tytul}</p>
                <p className="mt-1 text-xs text-stone-500">{w.podpis}</p>
              </div>
              <span className="hidden shrink-0 self-center text-sm text-emerald-800 opacity-0 transition group-hover:opacity-100 sm:inline" aria-hidden>
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
