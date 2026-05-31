"use client";

import Link from "next/link";

export type AkcjaPanelu = {
  href: string;
  tytul: string;
  opis: string;
  ikona: string;
  highlight?: boolean;
};

const AKCJE_MIESZKANIEC: AkcjaPanelu[] = [
  {
    href: "/panel/mieszkaniec/zgloszenia",
    tytul: "Zgłoś problem",
    opis: "Dziura w drodze, śmieci, oświetlenie — do sołtysa.",
    ikona: "📋",
  },
  {
    href: "/panel/mieszkaniec/marketplace",
    tytul: "Dodaj ogłoszenie",
    opis: "Rynek lokalny — produkty, usługi, działki.",
    ikona: "🛒",
    highlight: true,
  },
  {
    href: "/panel/mieszkaniec/swietlica",
    tytul: "Zarezerwuj salę",
    opis: "Świetlica — sprawdź kalendarz i złóż wniosek.",
    ikona: "🏛️",
  },
  {
    href: "/panel/mieszkaniec/pomoc-sasiedzka",
    tytul: "Pomoc sąsiedzka",
    opis: "Poproś o transport, zakupy lub zaoferuj pomoc.",
    ikona: "🤝",
  },
  {
    href: "/panel/mieszkaniec/fotokronika",
    tytul: "Dodaj zdjęcie",
    opis: "Fotokronika wsi — po akceptacji sołtysa.",
    ikona: "📷",
  },
  {
    href: "/panel/mieszkaniec/grafika",
    tytul: "Stwórz plakat",
    opis: "Kreator grafiki — zaproszenie na imprezę.",
    ikona: "🎨",
  },
];

const AKCJE_SOLTYS: AkcjaPanelu[] = [
  {
    href: "/panel/soltys",
    tytul: "Kolejka pracy",
    opis: "Wnioski, moderacja, rezerwacje — zacznij tutaj.",
    ikona: "✅",
    highlight: true,
  },
  {
    href: "/panel/soltys/moja-wies",
    tytul: "Profil wsi",
    opis: "Opis, zdjęcie okładki, dane publiczne.",
    ikona: "🏡",
  },
  {
    href: "/panel/soltys/rezerwacje",
    tytul: "Rezerwacje sal",
    opis: "Zatwierdź lub odrzuć wnioski mieszkańców.",
    ikona: "📅",
  },
  {
    href: "/panel/soltys/spolecznosc",
    tytul: "Społeczność",
    opis: "Wydarzenia, blog, organizacje KGW/OSP.",
    ikona: "👥",
  },
  {
    href: "/panel/soltys/grafika",
    tytul: "Kreator plakatów",
    opis: "Plakaty na zebranie, festyn, polowanie.",
    ikona: "🖼️",
  },
  {
    href: "/panel/soltys/lowiectwo",
    tytul: "Polowania",
    opis: "Ostrzeżenia dla mieszkańców i turystów.",
    ikona: "🦌",
  },
];

type Props = {
  jestSoltysem?: boolean;
};

export function CoMogeZrobic({ jestSoltysem = false }: Props) {
  const akcje = jestSoltysem ? [...AKCJE_SOLTYS, ...AKCJE_MIESZKANIEC.slice(0, 2)] : AKCJE_MIESZKANIEC;

  return (
    <section className="mb-10" aria-labelledby="co-moge-zrobic-naglowek">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="etykieta-modulu">Szybki start</p>
          <h2 id="co-moge-zrobic-naglowek" className="font-serif text-xl text-green-950 sm:text-2xl">
            Co mogę zrobić?
          </h2>
        </div>
        <Link href="/pomoc" className="text-sm font-medium text-green-800 underline decoration-emerald-600/40 underline-offset-2 hover:decoration-emerald-800">
          Mapa pomocy →
        </Link>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {akcje.map((a, i) => (
          <li key={a.href} className="animate-wow-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
            <Link
              href={a.href}
              className={`group karta-akcji motion-reduce:transition-none ${a.highlight ? "karta-akcji--highlight" : ""}`}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-xl ring-1 ring-emerald-800/10" aria-hidden>
                {a.ikona}
              </span>
              <span className="mt-3 font-semibold text-green-950 group-hover:text-green-900">{a.tytul}</span>
              <span className="mt-1 flex-1 text-sm leading-relaxed text-stone-600">{a.opis}</span>
              <span className="mt-3 text-xs font-semibold text-emerald-800 opacity-80 group-hover:opacity-100">
                Przejdź →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
