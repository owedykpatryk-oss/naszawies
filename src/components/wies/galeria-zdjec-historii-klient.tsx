"use client";

import { useState } from "react";
import { LightboxGaleriiKlient } from "@/components/wies/lightbox-galerii-klient";

type Props = {
  urls: string[];
  tytul?: string;
  kompakt?: boolean;
};

export function GaleriaZdjecHistoriiKlient({ urls, tytul, kompakt = false }: Props) {
  const lista = urls.filter((u) => u.startsWith("http")).slice(0, 12);
  const [lightboxIndeks, ustawLightboxIndeks] = useState<number | null>(null);

  if (lista.length === 0) return null;

  const slajdy = lista.map((url) => ({ url, opis: tytul ?? null }));

  if (lista.length === 1) {
    return (
      <>
        <figure className={kompakt ? "mt-3" : "mt-4"}>
          <button
            type="button"
            className="group relative block w-full overflow-hidden rounded-xl border border-stone-200 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
            onClick={() => ustawLightboxIndeks(0)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lista[0]}
              alt={tytul ? `Zdjęcie: ${tytul}` : "Zdjęcie z kroniki"}
              className="max-h-80 w-full object-cover transition duration-500 group-hover:scale-[1.02]"
              loading="lazy"
            />
            <span className="absolute bottom-2 right-2 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
              Powiększ
            </span>
          </button>
        </figure>
        {lightboxIndeks != null ? (
          <LightboxGaleriiKlient slajdy={slajdy} poczatkowyIndeks={0} zamknij={() => ustawLightboxIndeks(null)} />
        ) : null}
      </>
    );
  }

  return (
    <>
      <div
        className={`mt-3 grid gap-2 ${kompakt ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"}`}
        role="list"
        aria-label="Galeria zdjęć"
      >
        {lista.map((url, i) => (
          <figure key={url} role="listitem">
            <button
              type="button"
              className="group relative block w-full overflow-hidden rounded-lg border border-stone-200 bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
              onClick={() => ustawLightboxIndeks(i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-[1.03]" loading="lazy" />
              <span className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" aria-hidden />
            </button>
          </figure>
        ))}
      </div>
      {lightboxIndeks != null ? (
        <LightboxGaleriiKlient
          slajdy={slajdy}
          poczatkowyIndeks={lightboxIndeks}
          zamknij={() => ustawLightboxIndeks(null)}
        />
      ) : null}
    </>
  );
}
