"use client";

import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

type WiesPodglad = {
  name: string;
  voivodeship: string;
  county: string;
  commune: string;
  slug: string;
};

type Props = {
  wies: WiesPodglad;
  themeId: string;
  logoUrl: string;
  coverUrl: string;
  heroNaglowek: string;
  heroPodtytul: string;
};

/** Podgląd na żywo — iframe profilu (odświeża po zmianie motywu). */
export function PodgladWygladWsiKlient({ wies, themeId, logoUrl, coverUrl, heroNaglowek, heroPodtytul }: Props) {
  const sciezka = sciezkaProfiluWsi(wies);
  const klucz = `${themeId}-${logoUrl}-${coverUrl}-${heroNaglowek}`;

  return (
    <div className="rounded-xl border border-stone-200 bg-gradient-to-br from-stone-50 via-white to-emerald-50/30 p-3 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Podgląd profilu</p>
      <p className="mt-1 text-xs text-stone-600">
        {heroNaglowek || wies.name}
        {heroPodtytul ? ` — ${heroPodtytul}` : ""}
      </p>
      <div className="mt-2 overflow-hidden rounded-lg border border-stone-200 bg-white">
        <iframe
          key={klucz}
          title="Podgląd profilu wsi"
          src={`${sciezka}?podglad=1`}
          className="h-[min(240px,42dvh)] w-full min-w-0 sm:h-[min(360px,48dvh)] lg:h-[min(420px,50vh)]"
          loading="lazy"
        />
      </div>
      <a href={sciezka} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-green-800 underline">
        Otwórz profil w nowej karcie
      </a>
    </div>
  );
}
