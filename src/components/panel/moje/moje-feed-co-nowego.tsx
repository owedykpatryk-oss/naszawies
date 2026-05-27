import Link from "next/link";
import type { MojeElementFeedu } from "@/lib/panel/pobierz-moj-feed-co-nowego";

const STYL_ETYKIETY: Record<string, string> = {
  Ogłoszenie: "bg-amber-100 text-amber-950 ring-amber-200/80",
  Blog: "bg-violet-100 text-violet-950 ring-violet-200/80",
  Wiadomość: "bg-sky-100 text-sky-950 ring-sky-200/80",
  Wydarzenie: "bg-emerald-100 text-emerald-950 ring-emerald-200/80",
};

export function MojeFeedCoNowego({ wpisy }: { wpisy: MojeElementFeedu[] }) {
  if (wpisy.length === 0) {
    return (
      <section className="sekcja-poza-foldem mt-8 rounded-2xl border border-dashed border-stone-300/90 bg-stone-50/80 px-5 py-6">
        <h2 className="font-serif text-xl text-green-950">Co nowego</h2>
        <p className="mt-2 text-sm text-stone-600">
          Gdy obserwujesz wsie lub gminy, tutaj pojawi się wspólny skrót ogłoszeń, wiadomości i wydarzeń — bez
          przechodzenia po profilach jedna po drugiej.
        </p>
        <p className="mt-3 text-sm">
          <Link href="/panel/moje/wies" className="font-medium text-green-800 underline">
            Dodaj miejscowość lub gminę →
          </Link>
        </p>
      </section>
    );
  }

  return (
    <section className="sekcja-poza-foldem wow-wejscie mt-8 overflow-hidden rounded-2xl border border-emerald-900/10 bg-gradient-to-br from-[#f5f9f0] via-white to-sky-50/40 p-5 shadow-sm ring-1 ring-stone-900/[0.02] sm:p-6">
      <h2 className="font-serif text-xl text-green-950 sm:text-2xl">Co nowego</h2>
      <p className="mt-1 text-sm text-stone-600">
        Najświeższe treści ze wszystkich Twoich wsi i obserwowanych gmin — jedna chronologia.
      </p>
      <ul className="mt-5 space-y-2">
        {wpisy.map((w) => {
          const klasy = STYL_ETYKIETY[w.etykieta] ?? "bg-stone-100 text-stone-800 ring-stone-200/80";
          return (
            <li key={`${w.villageId}-${w.etykieta}-${w.href}-${w.sortAt}`}>
              <Link
                href={w.href}
                className="karta-wow group flex gap-3 rounded-xl border border-stone-200/90 bg-white/95 px-3 py-3 shadow-sm ring-1 ring-stone-900/[0.02] sm:px-4"
              >
                <span className="mt-0.5 hidden w-1 shrink-0 rounded-full bg-gradient-to-b from-emerald-500/70 to-emerald-500/20 sm:block" aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${klasy}`}>
                      {w.etykieta}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800/80">{w.nazwaWsi}</span>
                  </div>
                  <p className="mt-1.5 font-medium text-stone-900 transition group-hover:text-green-950">{w.tytul}</p>
                  <p className="mt-1 text-xs text-stone-500">{w.podpis}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
