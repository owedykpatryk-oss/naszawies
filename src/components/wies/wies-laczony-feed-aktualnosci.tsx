import Link from "next/link";
import type { ElementLaczonegoFeedu } from "@/lib/wies/zbuduj-laczony-feed-aktualnosci";

/** Skrót chronologiczny z kilku modułów — ułatwia mieszkańcom „co nowego” bez przechodzenia po zakładkach. */
export function WiesLaczonyFeedAktualnosci({ wpisy }: { wpisy: ElementLaczonegoFeedu[] }) {
  if (wpisy.length === 0) {
    return (
      <section className="mt-10 rounded-xl border border-sky-200/80 bg-sky-50/30 px-4 py-5">
        <h2 className="font-serif text-xl text-green-950">Najnowsze na wsi</h2>
        <p className="mt-2 text-sm text-stone-600">
          Gdy pojawią się ogłoszenia, wpisy bloga, historia, wiadomości lub wydarzenia, zobaczysz tu jeden wspólny
          skrót chronologiczny.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-10 rounded-xl border border-sky-200/80 bg-sky-50/30 px-4 py-5 shadow-sm">
      <h2 className="font-serif text-xl text-green-950">Najnowsze na wsi</h2>
      <p className="mt-1 text-sm text-stone-600">
        Jedna lista — ogłoszenia, blog, historia, wiadomości lokalne i zbliżające się wydarzenia, od najnowszych.
      </p>
      <ul className="mt-4 space-y-2">
        {wpisy.map((w) => (
          <li key={`${w.etykieta}-${w.href}-${w.sortAt}`}>
            <Link
              href={w.href}
              className="block rounded-lg border border-sky-100 bg-white/90 px-3 py-2.5 text-sm shadow-sm transition hover:border-sky-300 hover:bg-white"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-sky-900">{w.etykieta}</span>
              <p className="mt-0.5 font-medium text-stone-900">{w.tytul}</p>
              <p className="mt-1 text-xs text-stone-500">{w.podpis}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
