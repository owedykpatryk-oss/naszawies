"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LightboxGaleriiKlient } from "@/components/wies/lightbox-galerii-klient";
import { OslonaSekcjiWies } from "@/components/wies/oslona-sekcji-wies";
import { TytulSekcjiWies } from "@/components/wies/tytul-sekcji-wies";
import { UjawnijPoPrzewinieciu } from "@/components/ui/ujawnij-po-przewinieciu";
import type { AlbumPublicznyFotokroniki, ZdjeciePubliczne } from "@/lib/fotokronika/pobierz-fotokronike-publiczna";

type Props = {
  zdjecia: ZdjeciePubliczne[];
  albumy?: AlbumPublicznyFotokroniki[];
  nazwaWsi: string;
  pokazLinkDodaj?: boolean;
  pusta?: boolean;
};

function GaleriaZdjec({
  zdjecia,
  onPowieksz,
  bento = false,
}: {
  zdjecia: ZdjeciePubliczne[];
  onPowieksz: (i: number) => void;
  bento?: boolean;
}) {
  const ukladBento = bento && zdjecia.length >= 4;

  return (
    <ul
      className={
        ukladBento
          ? "fotokronika-bento fotokronika-masonry mt-5 grid gap-2 lg:gap-3"
          : "fotokronika-masonry mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 lg:gap-3"
      }
    >
      {zdjecia.map((z, i) => (
        <li key={z.id} className={ukladBento && i === 0 ? "fotokronika-bento__hero" : undefined}>
          <UjawnijPoPrzewinieciu opoznienieMs={Math.min(i * 60, 360)}>
            <button
              type="button"
              className="fotokronika-kafelek group relative w-full overflow-hidden rounded-xl border border-stone-200/80 bg-stone-100 text-left shadow-sm ring-1 ring-stone-900/[0.03] transition duration-300 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
              onClick={() => onPowieksz(i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={z.url}
                alt={z.caption ?? "Zdjęcie z fotokroniki"}
                className="aspect-square w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                loading="lazy"
              />
              <span
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-0 transition group-hover:opacity-100"
                aria-hidden
              />
              {z.caption ? (
                <span className="pointer-events-none absolute bottom-0 left-0 right-0 line-clamp-2 px-2.5 py-2 text-left text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
                  {z.caption}
                </span>
              ) : null}
              <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/90 opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
                Powiększ
              </span>
            </button>
          </UjawnijPoPrzewinieciu>
        </li>
      ))}
    </ul>
  );
}

export function FotokronikaGaleriaKlient({
  zdjecia,
  albumy = [],
  nazwaWsi,
  pokazLinkDodaj = true,
  pusta = false,
}: Props) {
  const [lightboxIndeks, ustawLightboxIndeks] = useState<number | null>(null);
  const [aktywnyAlbumId, ustawAktywnyAlbumId] = useState<string | null>(
    albumy.length > 0 ? albumy[0]!.id : null,
  );

  const wyswietlane = useMemo(() => {
    if (albumy.length === 0) return zdjecia;
    const album = albumy.find((a) => a.id === aktywnyAlbumId) ?? albumy[0];
    return album?.zdjecia ?? zdjecia;
  }, [albumy, aktywnyAlbumId, zdjecia]);

  const aktywnyAlbum = albumy.find((a) => a.id === aktywnyAlbumId) ?? albumy[0] ?? null;

  if (pusta) {
    return (
      <OslonaSekcjiWies id="fotokronika-wsi" wariant="historia">
        <TytulSekcjiWies
          etykieta="Fotokronika"
          tytul="Zdjęcia z życia wsi"
          opis={`Chronika wizualna ${nazwaWsi} — pierwsze zdjęcia czekają na dodanie.`}
        />
        <div className="fotokronika-pusta mt-4 rounded-2xl border border-dashed border-amber-300/70 bg-gradient-to-br from-amber-50/60 via-white to-emerald-50/40 px-5 py-8 text-center">
          <p className="text-4xl" aria-hidden>
            📷
          </p>
          <p className="mt-2 font-serif text-lg text-green-950">Album jeszcze pusty</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-stone-600">
            Utwórz albumy tematyczne (Dożynki, OSP, archiwum) w panelu sołtysa — zdjęcia mieszkańców
            trafią do chroniki wizualnej wsi.
          </p>
          {pokazLinkDodaj ? (
            <Link
              href="/panel/mieszkaniec/fotokronika"
              className="mt-4 inline-flex min-h-11 items-center rounded-full bg-green-800 px-5 text-sm font-medium text-white hover:bg-green-900"
            >
              Dodaj pierwsze zdjęcie →
            </Link>
          ) : (
            <Link
              href="/logowanie"
              className="mt-4 inline-flex min-h-11 items-center rounded-full border border-green-800/30 bg-white px-5 text-sm font-medium text-green-900 hover:bg-green-50"
            >
              Zaloguj się i dodaj zdjęcie
            </Link>
          )}
        </div>
      </OslonaSekcjiWies>
    );
  }

  const slajdy = wyswietlane.map((z) => ({ url: z.url, opis: z.caption }));

  return (
    <OslonaSekcjiWies id="fotokronika-wsi">
      <TytulSekcjiWies
        etykieta="Fotokronika"
        tytul="Zdjęcia z życia wsi"
        opis={
          albumy.length > 1
            ? `Chronika społeczności ${nazwaWsi} — ${albumy.length} albumów, ${zdjecia.length} zdjęć.`
            : `Chronika społeczności ${nazwaWsi} — ${zdjecia.length} zatwierdzonych zdjęć od mieszkańców.`
        }
      />

      {albumy.length > 1 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {albumy.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => ustawAktywnyAlbumId(a.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                aktywnyAlbumId === a.id
                  ? "bg-amber-800 text-white shadow-sm"
                  : "border border-amber-300/70 bg-white text-amber-950 hover:bg-amber-50"
              }`}
            >
              {a.title}
              <span className="ml-1 opacity-75">({a.zdjecia.length})</span>
            </button>
          ))}
        </div>
      ) : null}

      {aktywnyAlbum?.description ? (
        <p className="mt-3 text-sm text-stone-600">{aktywnyAlbum.description}</p>
      ) : null}

      <GaleriaZdjec zdjecia={wyswietlane} onPowieksz={(i) => ustawLightboxIndeks(i)} bento />

      {pokazLinkDodaj ? (
        <p className="mt-4 text-sm text-stone-600">
          Masz zdjęcie z wydarzenia?{" "}
          <Link href="/panel/mieszkaniec/fotokronika" className="font-medium text-green-800 underline">
            Dodaj do fotokroniki
          </Link>{" "}
          (wymaga konta mieszkańca).
        </p>
      ) : null}
      {lightboxIndeks != null ? (
        <LightboxGaleriiKlient
          slajdy={slajdy}
          poczatkowyIndeks={lightboxIndeks}
          zamknij={() => ustawLightboxIndeks(null)}
        />
      ) : null}
    </OslonaSekcjiWies>
  );
}
