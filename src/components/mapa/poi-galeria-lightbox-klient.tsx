"use client";

import { useState } from "react";
import Image from "next/image";
import { LightboxGaleriiKlient } from "@/components/wies/lightbox-galerii-klient";
import type { ZdjecieProfiluPoi } from "@/lib/mapa/zdjecia-profilu-poi";

function czyObrazZdalny(url: string): boolean {
  return url.startsWith("http") && !url.includes(".supabase.co");
}

export function PoiGaleriaLightboxKlient({ galeria }: { galeria: ZdjecieProfiluPoi[] }) {
  const [indeks, ustawIndeks] = useState<number | null>(null);
  const slajdy = galeria.map((z) => ({ url: z.url, opis: z.etykieta }));

  return (
    <>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {galeria.map((z, i) => (
          <li
            key={z.id}
            className={`overflow-hidden rounded-xl border border-stone-100 bg-stone-50 shadow-sm ${i === 0 && galeria.length === 1 ? "sm:col-span-2" : ""}`}
          >
            <button
              type="button"
              className="group relative block w-full text-left"
              onClick={() => ustawIndeks(i)}
            >
              <div className={`relative w-full bg-stone-100 ${i === 0 && galeria.length === 1 ? "aspect-[16/10]" : "aspect-[4/3]"}`}>
                {czyObrazZdalny(z.url) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={z.url} alt={z.etykieta} className="h-full w-full object-cover transition group-hover:scale-[1.02]" loading="lazy" />
                ) : (
                  <Image src={z.url} alt={z.etykieta} fill className="object-cover transition group-hover:scale-[1.02]" sizes="(max-width: 640px) 100vw, 480px" />
                )}
                <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-semibold uppercase text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
                  Powiększ
                </span>
              </div>
              <p className="px-3 py-2 text-xs leading-relaxed text-stone-600">{z.etykieta}</p>
            </button>
          </li>
        ))}
      </ul>
      {indeks != null ? (
        <LightboxGaleriiKlient slajdy={slajdy} poczatkowyIndeks={indeks} zamknij={() => ustawIndeks(null)} />
      ) : null}
    </>
  );
}
