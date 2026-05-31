import Link from "next/link";
import type { LicznikiOczekujacychSoltysa } from "@/lib/panel/liczniki-oczekujacych-soltysa";

export type PozycjaKolejki = {
  id: string;
  typ: "wniosek" | "post" | "rynek" | "pomoc" | "zgloszenie" | "zdjecie" | "poi_propozycja" | "poi_weryfikacja";
  tytul: string;
  wies: string;
  data: string;
  href: string;
  pilne?: boolean;
};

export function SoltysKolejkaPracy({
  pozycje,
  liczniki,
  pokazModeracje = true,
}: {
  pozycje: PozycjaKolejki[];
  liczniki: LicznikiOczekujacychSoltysa;
  pokazModeracje?: boolean;
}) {
  const sumaRynekPomoc = liczniki.rynek + liczniki.pomoc;

  return (
    <section id="kolejka-pracy" className="scroll-mt-24 mt-8 rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
      <h2 className="font-serif text-lg text-green-950">Kolejka pracy</h2>
      <p className="mt-1 text-xs text-stone-600">
        Najnowsze pozycje wymagające decyzji — w jednym widoku, bez przeskakiwania po modułach.
      </p>

      <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
        {liczniki.zgloszenia > 0 ? (
          <Link href="/panel/soltys/zgloszenia" className="rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-900">
            Zgłoszenia: {liczniki.zgloszenia}
          </Link>
        ) : null}
        {liczniki.poiWeryfikacja > 0 ? (
          <Link
            href="/panel/soltys/moja-wies"
            className="rounded-full bg-sky-100 px-2 py-0.5 font-medium text-sky-900"
          >
            Mapa — weryfikacja: {liczniki.poiWeryfikacja}
          </Link>
        ) : null}
        {liczniki.propozycjePoi > 0 ? (
          <Link
            href="/panel/soltys/moja-wies"
            className="rounded-full bg-teal-100 px-2 py-0.5 font-medium text-teal-900"
          >
            Propozycje mapy: {liczniki.propozycjePoi}
          </Link>
        ) : null}
        {pokazModeracje && liczniki.zdjecia > 0 ? (
          <Link href="/panel/soltys/fotokronika" className="rounded-full bg-violet-100 px-2 py-0.5 font-medium text-violet-900">
            Zdjęcia: {liczniki.zdjecia}
          </Link>
        ) : null}
        {pokazModeracje && sumaRynekPomoc > 0 ? (
          <Link href="/panel/soltys#moderacja-mieszkancow" className="rounded-full bg-orange-100 px-2 py-0.5 font-medium text-orange-900">
            Rynek + pomoc: {sumaRynekPomoc}
          </Link>
        ) : null}
        {pokazModeracje && liczniki.raportySpolecznosci > 0 ? (
          <Link
            href="/panel/soltys/spolecznosc/moderacja"
            className="rounded-full bg-indigo-100 px-2 py-0.5 font-medium text-indigo-900"
          >
            Raporty treści: {liczniki.raportySpolecznosci}
          </Link>
        ) : null}
      </div>

      {pozycje.length === 0 ? (
        <p className="mt-4 text-sm text-stone-600">Brak oczekujących pozycji w kolejce — możesz skupić się na planowaniu wydarzeń.</p>
      ) : (
        <ul className="mt-4 divide-y divide-stone-100 rounded-xl border border-stone-200">
          {pozycje.map((p) => (
            <li key={`${p.typ}-${p.id}`} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm">
              <div className="min-w-0">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">
                  {p.typ === "wniosek"
                    ? "Wniosek o rolę"
                    : p.typ === "post"
                      ? "Post"
                      : p.typ === "rynek"
                        ? "Rynek"
                        : p.typ === "pomoc"
                          ? "Pomoc sąsiedzka"
                          : p.typ === "zgloszenie"
                            ? "Zgłoszenie"
                            : p.typ === "poi_propozycja"
                              ? "Propozycja mapy"
                              : p.typ === "poi_weryfikacja"
                                ? "Weryfikacja mapy"
                                : "Zdjęcie"}
                  {p.pilne ? " · pilne" : ""}
                </span>
                <p className="truncate font-medium text-stone-900">{p.tytul}</p>
                <p className="text-xs text-stone-500">
                  {p.wies} · {new Date(p.data).toLocaleString("pl-PL")}
                </p>
              </div>
              <Link href={p.href} className="shrink-0 text-xs font-medium text-green-800 underline">
                Otwórz →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
