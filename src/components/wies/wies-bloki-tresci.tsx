import Link from "next/link";
import type { BlokTresciWsiPubliczny } from "@/lib/wies/ustawienia-wsi";
import { TytulSekcjiWies } from "@/components/wies/tytul-sekcji-wies";
import { OslonaSekcjiWies } from "@/components/wies/oslona-sekcji-wies";

type Props = {
  bloki: BlokTresciWsiPubliczny[];
};

/** Własne bloki treści dodane przez sołtysa (tekst, link, obraz). */
export function WiesBlokiTresci({ bloki }: Props) {
  if (bloki.length === 0) return null;

  return (
    <OslonaSekcjiWies id="sekcja-bloki-wlasne" className="from-white via-[color-mix(in_srgb,var(--wies-tlo,#f0fdf4)_35%,white)] to-white">
      <TytulSekcjiWies
        etykieta="Od sołtysa"
        tytul="Ważne informacje"
        opis="Treści dodane i utrzymywane przez zespół sołectwa."
      />
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {bloki.map((b) => {
          if (b.typ === "obraz" && b.obraz_url) {
            return (
              <figure
                key={b.id}
                className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-sm sm:col-span-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.obraz_url} alt={b.tytul ?? "Ilustracja"} className="max-h-80 w-full object-cover" loading="lazy" />
                {b.tytul || b.tresc ? (
                  <figcaption className="border-t border-stone-100 px-4 py-3 text-sm text-stone-700">
                    {b.tytul ? <p className="font-medium text-stone-900">{b.tytul}</p> : null}
                    {b.tresc ? <p className="mt-1 whitespace-pre-wrap">{b.tresc}</p> : null}
                  </figcaption>
                ) : null}
              </figure>
            );
          }

          if (b.typ === "link" && b.url) {
            const zewnetrzny = b.url.startsWith("http");
            return (
              <div key={b.id} className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-sm">
                {b.tytul ? <p className="font-medium text-stone-900">{b.tytul}</p> : null}
                {b.tresc ? <p className="mt-1 text-sm text-stone-600">{b.tresc}</p> : null}
                <p className="mt-3">
                  {zewnetrzny ? (
                    <a
                      href={b.url}
                      className="inline-flex rounded-lg bg-[var(--wies-akcent,#166534)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {b.tytul ? "Przejdź ↗" : b.url}
                    </a>
                  ) : (
                    <Link
                      href={b.url}
                      className="inline-flex rounded-lg bg-[var(--wies-akcent,#166534)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                    >
                      {b.tytul ? "Przejdź" : "Zobacz więcej"}
                    </Link>
                  )}
                </p>
              </div>
            );
          }

          return (
            <div key={b.id} className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-sm">
              {b.tytul ? <p className="font-medium text-stone-900">{b.tytul}</p> : null}
              {b.tresc ? <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{b.tresc}</p> : null}
            </div>
          );
        })}
      </div>
    </OslonaSekcjiWies>
  );
}
