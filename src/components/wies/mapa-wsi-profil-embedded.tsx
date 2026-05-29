"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { linkChroniony } from "@/lib/auth/sciezki-chronione";
import type { ZnacznikPoi, ZnacznikWsi } from "@/components/mapa/mapa-wsi-leaflet";
import { OslonaSekcjiWies } from "@/components/wies/oslona-sekcji-wies";
import { TytulSekcjiWies } from "@/components/wies/tytul-sekcji-wies";

const MapaWsiLeaflet = dynamic(
  () => import("@/components/mapa/mapa-wsi-leaflet").then((m) => ({ default: m.MapaWsiLeaflet })),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex h-[min(420px,55dvh)] items-center justify-center rounded-xl border border-dashed border-green-900/20 bg-stone-50"
        aria-busy="true"
      >
        <p className="text-sm text-stone-500">Ładowanie mapy…</p>
      </div>
    ),
  },
);

type Props = {
  nazwaWsi: string;
  villageId: string;
  zalogowany: boolean;
  znacznik: ZnacznikWsi | null;
  pois: ZnacznikPoi[];
};

export function MapaWsiProfilEmbedded({ nazwaWsi, villageId, zalogowany, znacznik, pois }: Props) {
  const linkPelnaMapa = linkChroniony(`/mapa?wies=${encodeURIComponent(villageId)}`, zalogowany);

  if (!zalogowany) {
    return (
      <OslonaSekcjiWies id="sekcja-mapa" className="from-emerald-50/50 via-white to-stone-50/40">
        <TytulSekcjiWies
          tytul="Mapa miejscowości"
          opis="Interaktywna mapa z pinezkami: świetlica (kalendarz zajętości), przystanki (odjazdy), kościół, sklep, szkoła (telefon i godziny)."
        />
        <p className="mt-4 text-sm text-stone-600">
          Mapa katalogu i szczegóły punktów POI są dostępne po{" "}
          <Link href={linkChroniony("/mapa", false)} className="font-medium text-green-800 underline">
            zalogowaniu
          </Link>
          .
        </p>
      </OslonaSekcjiWies>
    );
  }

  if (!znacznik && pois.length === 0) {
    return (
      <OslonaSekcjiWies id="sekcja-mapa">
        <TytulSekcjiWies tytul="Mapa miejscowości" opis="Punkty POI pojawią się, gdy sołectwo uzupełni mapę." />
        <p className="mt-3 text-sm text-stone-500">Brak współrzędnych i punktów na mapie dla {nazwaWsi}.</p>
      </OslonaSekcjiWies>
    );
  }

  const znaczniki = znacznik ? [znacznik] : [];

  return (
    <OslonaSekcjiWies id="sekcja-mapa" className="from-emerald-50/40 via-white to-stone-50/30">
      <TytulSekcjiWies
        tytul="Mapa miejscowości"
        opis="Kliknij pinezkę: świetlica → kalendarz sal, przystanek → odjazdy, kościół / sklep / szkoła → telefon i godziny otwarcia."
      />
      <div className="mt-4 overflow-hidden rounded-xl border border-stone-200 shadow-sm ring-1 ring-stone-900/[0.03]">
        <MapaWsiLeaflet znaczniki={znaczniki} punktyPoi={pois} pokazRynek={false} wysokoscMapy="kompakt" />
      </div>
      <p className="mt-3 flex flex-wrap gap-x-4 text-sm text-stone-600">
        <Link href={linkPelnaMapa} className="font-medium text-green-800 underline">
          Otwórz w pełnej mapie katalogu →
        </Link>
        {pois.length > 0 ? (
          <span className="text-xs text-stone-500">{pois.length} punktów na mapie tej wsi</span>
        ) : null}
      </p>
    </OslonaSekcjiWies>
  );
}
