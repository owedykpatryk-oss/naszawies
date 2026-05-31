"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState, useTransition } from "react";
import { dodajKomentarzPodPoi } from "@/app/(site)/panel/soltys/akcje-poi-miejsca";
import { etykietaKategoriiPoi } from "@/lib/mapa/kategorie-poi";

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
  villageName: string;
  villageSciezka: string;
  lat: number;
  lon: number;
  komentarze: KomentarzPoiWiersz[];
  zalogowany: boolean;
  zrodloTekst: string;
  zrodloKlasy: string;
  wymagaWeryfikacji: boolean;
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
  villageName,
  villageSciezka,
  lat,
  lon,
  komentarze: poczatkowe,
  zalogowany,
  zrodloTekst,
  zrodloKlasy,
  wymagaWeryfikacji,
}: Props) {
  const [komentarze, ustawKomentarze] = useState(poczatkowe);
  const [blad, ustawBlad] = useState("");
  const [czek, startT] = useTransition();

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
        <Link href="/mapa" className="text-green-800 underline">
          ← Mapa
        </Link>
        {" · "}
        <Link href={villageSciezka} className="text-green-800 underline">
          {villageName}
        </Link>
      </p>

      <header className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-md ring-1 ring-amber-400/20">
        {photoUrl ? (
          <div className="relative aspect-[16/10] w-full bg-stone-100">
            <Image src={photoUrl} alt={photoCaption || nazwa} fill className="object-cover" sizes="(max-width: 768px) 100vw, 720px" priority />
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
          {opis ? <p className="mt-2 text-sm leading-relaxed text-stone-700">{opis}</p> : null}
          {telefon ? (
            <p className="mt-2 text-sm">
              <strong>Tel.</strong>{" "}
              <a href={`tel:${telefon.replace(/\s/g, "")}`} className="text-green-800 underline">
                {telefon}
              </a>
            </p>
          ) : null}
          {godziny ? (
            <p className="mt-2 text-sm">
              <strong>Godziny:</strong> {godziny}
            </p>
          ) : null}
          {photoCaption ? <p className="mt-2 text-sm italic text-stone-600">{photoCaption}</p> : null}
          <p className="mt-4">
            <Link
              href={`/mapa?poi=${encodeURIComponent(poiId)}&lat=${lat}&lon=${lon}`}
              className="btn-panel-secondary inline-block text-sm"
            >
              Pokaż na mapie
            </Link>
          </p>
        </div>
      </header>

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
            <Link href={`/logowanie?next=/mapa/miejsce/${poiId}`} className="font-medium text-green-800 underline">
              Zaloguj się
            </Link>
            , aby dodać komentarz.
          </p>
        )}
      </section>
    </article>
  );
}
