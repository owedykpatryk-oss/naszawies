"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { linkChroniony } from "@/lib/auth/sciezki-chronione";
import type { ZnacznikRynek, ZnacznikRynekDzialka, ZnacznikWsi } from "@/components/mapa/mapa-wsi-leaflet";

const MapaWsiLeaflet = dynamic(
  () => import("@/components/mapa/mapa-wsi-leaflet").then((m) => ({ default: m.MapaWsiLeaflet })),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex h-[min(360px,50dvh)] items-center justify-center rounded-xl border border-dashed border-orange-200/80 bg-orange-50/30"
        aria-busy="true"
      >
        <p className="text-sm text-stone-500">Ładowanie mapy rynku…</p>
      </div>
    ),
  },
);

export function RynekMapaEmbedded({
  nazwaWsi,
  sciezkaWsi,
  villageId,
  znacznikWsi,
  punktyRynek,
  punktyRynekDzialki,
  kompakt = false,
  className = "",
  zalogowany = false,
}: {
  nazwaWsi: string;
  sciezkaWsi: string;
  villageId: string;
  znacznikWsi: ZnacznikWsi | null;
  punktyRynek: ZnacznikRynek[];
  punktyRynekDzialki: ZnacznikRynekDzialka[];
  /** Mniejszy nagłówek — panel boczny na desktopie. */
  kompakt?: boolean;
  className?: string;
  zalogowany?: boolean;
}) {
  const liczbaPinezek = punktyRynek.length;
  const liczbaDzialek = punktyRynekDzialki.length;
  if (liczbaPinezek === 0 && liczbaDzialek === 0) return null;

  const znaczniki = znacznikWsi ? [znacznikWsi] : [];

  return (
    <section
      id="rynek-mapa"
      className={`scroll-mt-24 overflow-hidden rounded-2xl border border-orange-200/70 bg-gradient-to-br from-orange-50/40 via-white to-amber-50/30 p-4 shadow-sm ring-1 ring-stone-950/[0.03] sm:p-5 ${kompakt ? "mt-0" : "mt-8"} ${className}`}
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className={`font-serif text-green-950 ${kompakt ? "text-base" : "text-lg"}`}>Rynek na mapie</h2>
          <p className={`mt-1 text-stone-600 ${kompakt ? "text-xs" : "text-sm"}`}>
            {liczbaPinezek > 0 ? `${liczbaPinezek} ogłoszeń z lokalizacją` : null}
            {liczbaPinezek > 0 && liczbaDzialek > 0 ? " · " : null}
            {liczbaDzialek > 0 ? `${liczbaDzialek} działek z Geoportalem` : null}
            {" — "}
            {nazwaWsi}
          </p>
        </div>
        <Link
          href={linkChroniony("/mapa", zalogowany, `?wies=${encodeURIComponent(villageId)}`)}
          className="text-xs font-semibold text-green-800 underline hover:text-green-950"
        >
          Pełna mapa →
        </Link>
      </div>
      <div className="mt-4 overflow-hidden rounded-xl border border-stone-200 shadow-sm">
        <MapaWsiLeaflet
          znaczniki={znaczniki}
          punktyRynek={punktyRynek}
          punktyRynekDzialki={punktyRynekDzialki}
          pokazPoi={false}
          pokazRynek={true}
          wysokoscMapy="kompakt"
        />
      </div>
      <p className="mt-2 text-xs text-stone-500">
        Kliknij pinezkę lub obrys działki, aby przejść do ogłoszenia. Działki z mapą Geoportalu — unikalna funkcja vs portale ogólnokrajowe.
      </p>
      <p className="mt-1 text-xs">
        <Link href={`${sciezkaWsi}/rynek?geoportal=1`} className="font-medium text-amber-900 underline">
          Pokaż tylko ogłoszenia z mapą działki →
        </Link>
      </p>
    </section>
  );
}
