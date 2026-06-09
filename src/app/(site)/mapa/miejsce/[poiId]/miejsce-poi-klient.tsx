"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState, useTransition } from "react";
import { dodajKomentarzPodPoi } from "@/app/(site)/panel/soltys/akcje-poi-miejsca";
import { MiejscePoiMapaLokalizacji } from "@/components/mapa/miejsce-poi-mapa-lokalizacji";
import type { ZnacznikPoi } from "@/components/mapa/mapa-wsi-leaflet";
import { etykietaKategoriiPoi } from "@/lib/mapa/kategorie-poi";
import type { WierszGodzinOtwarcia } from "@/lib/mapa/formatuj-godziny-otwarcia";
import { WyswietlTrescBogata } from "@/components/ui/tresc-bogata";
import { linkChroniony, urlLogowaniaZPowrotem } from "@/lib/auth/sciezki-chronione";
import { linkGoogleMapsTransit } from "@/lib/transport/linki-zewnetrzne";
import { RynekUdostepnijPrzycisk } from "@/components/wies/rynek-udostepnij-przycisk";
import type { PodgladOrganizacjiPoi } from "@/lib/mapa/pobierz-organizacje-dla-poi";
import { PoiProfilTrescPubliczna } from "@/components/mapa/poi-profil-tresc-publiczna";
import { PoiBrakOrganizacjiPodpowiedz, PoiTeaserOrganizacji } from "@/components/mapa/poi-teaser-organizacji";
import type { WpisKronikiPoi } from "@/lib/mapa/pobierz-kronike-poi";
import type { ZdjecieProfiluPoi } from "@/lib/mapa/zdjecia-profilu-poi";

export type KomentarzPoiWiersz = {
  id: string;
  body: string;
  createdAt: string;
  authorLabel: string;
};

type Props = {
  poiId: string;
  nazwa: string;
  kategoria: string;
  opis: string | null;
  photoUrl: string | null;
  photoCaption: string | null;
  telefon: string | null;
  godziny: string | null;
  godzinyLista: WierszGodzinOtwarcia[];
  villageName: string;
  villageSciezka: string;
  lat: number;
  lon: number;
  komentarze: KomentarzPoiWiersz[];
  zalogowany: boolean;
  pinezkaMapy: ZnacznikPoi;
  zrodloTekst: string;
  zrodloKlasy: string;
  wymagaWeryfikacji: boolean;
  organizacja: PodgladOrganizacjiPoi | null;
  pokazPodpowiedzOrganizacji: boolean;
  historia: string | null;
  ciekawostki: string | null;
  galeria: ZdjecieProfiluPoi[];
  wpisyKroniki: WpisKronikiPoi[];
  sciezkaKronikiWsi: string;
};

export function MiejscePoiKlient({
  poiId,
  nazwa,
  kategoria,
  opis,
  photoUrl,
  photoCaption,
  telefon,
  godziny,
  godzinyLista,
  villageName,
  villageSciezka,
  lat,
  lon,
  komentarze: poczatkowe,
  zalogowany,
  pinezkaMapy,
  zrodloTekst,
  zrodloKlasy,
  wymagaWeryfikacji,
  organizacja,
  pokazPodpowiedzOrganizacji,
  historia,
  ciekawostki,
  galeria,
  wpisyKroniki,
  sciezkaKronikiWsi,
}: Props) {
  const [komentarze, ustawKomentarze] = useState(poczatkowe);
  const [blad, ustawBlad] = useState("");
  const [czek, startT] = useTransition();
  const okladkaZdalna = Boolean(photoUrl?.startsWith("http") && !photoUrl.includes(".supabase.co"));

  function onKomentarz(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    ustawBlad("");
    const fd = new FormData(e.currentTarget);
    startT(async () => {
      const w = await dodajKomentarzPodPoi({ poiId, body: String(fd.get("body")) });
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      const tekst = String(fd.get("body")).trim();
      ustawKomentarze((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          body: tekst,
          createdAt: new Date().toISOString(),
          authorLabel: "Ty",
        },
      ]);
      e.currentTarget.reset();
    });
  }

  return (
    <article className="animate-mapa-reveal space-y-6 motion-reduce:animate-none">
      <p className="text-sm text-stone-500">
        {zalogowany ? (
          <>
            <Link
              href={linkChroniony("/mapa", zalogowany, `?poiId=${encodeURIComponent(poiId)}`)}
              className="text-green-800 underline"
            >
              ← Mapa katalogu
            </Link>
            {" · "}
          </>
        ) : null}
        <Link href={villageSciezka} className="text-green-800 underline">
          {zalogowany ? villageName : `← ${villageName}`}
        </Link>
      </p>

      <header className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-md ring-1 ring-amber-400/20">
        {photoUrl ? (
          <div className="relative aspect-[16/10] w-full bg-stone-100">
            {okladkaZdalna ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt={photoCaption || nazwa} className="h-full w-full object-cover" />
            ) : (
              <Image src={photoUrl} alt={photoCaption || nazwa} fill className="object-cover" sizes="(max-width: 768px) 100vw, 720px" priority />
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <p className="absolute bottom-3 left-4 right-4 font-serif text-2xl text-white drop-shadow-md">{nazwa}</p>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-amber-50 to-emerald-50 px-6 py-10">
            <h1 className="font-serif text-3xl text-green-950">{nazwa}</h1>
          </div>
        )}
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">{etykietaKategoriiPoi(kategoria)}</p>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${zrodloKlasy}`}>
              {zrodloTekst}
            </span>
          </div>
          {wymagaWeryfikacji ? (
            <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
              Ten punkt pochodzi z automatycznego importu i czeka na weryfikację sołtysa. Lokalizacja może wymagać
              korekty.
            </p>
          ) : null}
          {opis ? (
            <div className="mt-2">
              <WyswietlTrescBogata tresc={opis} className="text-stone-700" />
            </div>
          ) : null}
          {telefon ? (
            <p className="mt-2 text-sm">
              <strong>Tel.</strong>{" "}
              <a href={`tel:${telefon.replace(/\s/g, "")}`} className="text-green-800 underline">
                {telefon}
              </a>
            </p>
          ) : null}
          {godzinyLista.length > 0 ? (
            <div className="mt-3">
              <p className="text-sm font-semibold text-stone-800">Godziny i terminy</p>
              <ul className="mt-1.5 space-y-1 text-sm text-stone-700">
                {godzinyLista.map((w) => (
                  <li key={`${w.etykieta}-${w.wartosc}`} className="flex flex-wrap gap-x-2">
                    <span className="font-medium text-stone-800">{w.etykieta}:</span>
                    <span>{w.wartosc}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : godziny ? (
            <p className="mt-2 text-sm">
              <strong>Godziny:</strong> {godziny}
            </p>
          ) : null}
          {photoCaption ? <p className="mt-2 text-sm italic text-stone-600">{photoCaption}</p> : null}
          <p className="mt-4 flex flex-wrap items-center gap-2">
            <a href="#lokalizacja" className="btn-panel-secondary inline-block text-sm">
              Pokaż na mapie
            </a>
            {Number.isFinite(lat) && Number.isFinite(lon) ? (
              <a
                href={linkGoogleMapsTransit(lat, lon, nazwa)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-panel-secondary inline-block text-sm"
              >
                Nawiguj (Google Maps)
              </a>
            ) : null}
            <RynekUdostepnijPrzycisk
              url={`/mapa/miejsce/${poiId}`}
              tytul={nazwa}
              tekst={`${nazwa} — ${villageName}`}
            />
            {zalogowany ? (
              <Link
                href={linkChroniony("/mapa", zalogowany, `?poiId=${encodeURIComponent(poiId)}`)}
                className="btn-panel-secondary inline-block text-sm"
              >
                Otwórz w mapie katalogu
              </Link>
            ) : null}
          </p>
        </div>
      </header>

      {organizacja ? <PoiTeaserOrganizacji organizacja={organizacja} kategoria={kategoria} /> : null}
      {pokazPodpowiedzOrganizacji ? (
        <PoiBrakOrganizacjiPodpowiedz kategoria={kategoria} sciezkaPanelu="/panel/soltys/spolecznosc" />
      ) : null}

      <PoiProfilTrescPubliczna
        historia={historia}
        ciekawostki={ciekawostki}
        galeria={galeria}
        wpisyKroniki={wpisyKroniki}
        sciezkaKronikiWsi={sciezkaKronikiWsi}
      />

      <section
        id="lokalizacja"
        className="scroll-mt-20 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm sm:p-6"
        aria-labelledby="lokalizacja-tytul"
      >
        <h2 id="lokalizacja-tytul" className="font-serif text-lg text-green-950">
          Lokalizacja na mapie
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          {Number.isFinite(lat) && Number.isFinite(lon)
            ? `${lat.toFixed(5)}, ${lon.toFixed(5)} (WGS84)`
            : "Brak współrzędnych w bazie."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {Number.isFinite(lat) && Number.isFinite(lon) ? (
            <a
              href={linkGoogleMapsTransit(lat, lon, nazwa)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-panel-primary inline-block text-sm"
            >
              Nawiguj do miejsca
            </a>
          ) : null}
        </div>
        <div className="mt-4">
          <MiejscePoiMapaLokalizacji pinezka={pinezkaMapy} />
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-serif text-lg text-green-950">Komentarze ({komentarze.length})</h2>
        {komentarze.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">Brak komentarzy — bądź pierwszą osobą, która podzieli się wrażeniami.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {komentarze.map((k) => (
              <li key={k.id} className="rounded-xl border border-stone-100 bg-stone-50/80 px-4 py-3">
                <p className="text-sm text-stone-800">{k.body}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {k.authorLabel} · {new Date(k.createdAt).toLocaleString("pl-PL")}
                </p>
              </li>
            ))}
          </ul>
        )}

        {zalogowany ? (
          <form onSubmit={onKomentarz} className="mt-5 space-y-2 border-t border-stone-100 pt-5">
            <label className="block text-sm font-medium text-stone-800">
              Twój komentarz
              <textarea name="body" required maxLength={600} rows={3} className="form-control mt-1" placeholder="np. Świetne miejsce na spacer z dziećmi…" />
            </label>
            {blad ? <p className="text-sm text-red-800">{blad}</p> : null}
            <button type="submit" disabled={czek} className="btn-panel-primary text-sm">
              Dodaj komentarz
            </button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-stone-600">
            <Link href={urlLogowaniaZPowrotem(`/mapa/miejsce/${poiId}`)} className="font-medium text-green-800 underline">
              Zaloguj się
            </Link>
            , aby dodać komentarz.
          </p>
        )}
      </section>
    </article>
  );
}
