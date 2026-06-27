"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { linkChroniony } from "@/lib/auth/sciezki-chronione";
import type { ZnacznikPoi, ZnacznikWsi } from "@/components/mapa/mapa-wsi-leaflet";
import { PropozycjaPoiFormularz } from "@/components/wies/propozycja-poi-formularz";
import { OslonaSekcjiWies } from "@/components/wies/oslona-sekcji-wies";
import { TytulSekcjiWies } from "@/components/wies/tytul-sekcji-wies";
import { SekcjaSkrotPoiWsi } from "@/components/wies/sekcja-skrot-poi-wsi";

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
  const maDaneMapy = Boolean(znacznik) || pois.length > 0;

  if (!maDaneMapy) {
    return (
      <OslonaSekcjiWies id="sekcja-mapa">
        <TytulSekcjiWies tytul="Mapa miejscowości" opis="Punkty POI pojawią się, gdy sołectwo uzupełni mapę." />
        <p className="mt-3 text-sm text-stone-500">Brak współrzędnych i punktów na mapie dla {nazwaWsi}.</p>
        {zalogowany ? (
          <PropozycjaPoiFormularz villageId={villageId} nazwaWsi={nazwaWsi} />
        ) : (
          <p className="mt-3 text-sm text-stone-600">
            <Link href="/rejestracja" className="font-medium text-green-800 underline">
              Dołącz do wsi
            </Link>{" "}
            i zaproponuj brakujące miejsce.
          </p>
        )}
      </OslonaSekcjiWies>
    );
  }

  const znaczniki = znacznik ? [znacznik] : [];

  return (
    <OslonaSekcjiWies id="sekcja-mapa" className="from-emerald-50/40 via-white to-stone-50/30">
      <TytulSekcjiWies
        tytul="Mapa miejscowości"
        opis="Sklepy, szkoły, kościoły, przystanki i inne miejsca — dane z OpenStreetMap i rejestrów państwowych."
      />

      {pois.length > 0 ? <SekcjaSkrotPoiWsi pois={pois} nazwaWsi={nazwaWsi} /> : null}

      <div className="mt-4 overflow-hidden rounded-xl border border-stone-200 shadow-sm ring-1 ring-stone-900/[0.03] [&_.mapa-wsi-map-shell]:min-h-[min(320px,45dvh)]">
        <MapaWsiLeaflet
          znaczniki={znaczniki}
          punktyPoi={pois}
          pokazRynek={false}
          wysokoscMapy="kompakt"
          sterowanieWarstwZewnetrzne
        />
      </div>

      <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-600">
        <Link href={linkPelnaMapa} className="font-medium text-green-800 underline">
          {zalogowany ? "Otwórz w pełnej mapie katalogu →" : "Zaloguj się, aby zobaczyć pełną mapę powiatu →"}
        </Link>
        {pois.length > 0 ? (
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-900 ring-1 ring-emerald-200/80">
            {pois.length} punktów na mapie
          </span>
        ) : null}
      </p>

      {!zalogowany ? (
        <p className="mt-2 text-xs text-stone-500">
          Po zalogowaniu: odjazdy z przystanków, szczegóły świetlicy i propozycje nowych miejsc.
        </p>
      ) : null}

      {zalogowany ? (
        <PropozycjaPoiFormularz
          villageId={villageId}
          nazwaWsi={nazwaWsi}
          domyslnaLat={znacznik?.lat ?? null}
          domyslnaLng={znacznik?.lon ?? null}
        />
      ) : null}
    </OslonaSekcjiWies>
  );
}
