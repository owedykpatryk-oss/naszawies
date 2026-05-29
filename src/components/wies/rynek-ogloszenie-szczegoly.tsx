"use client";

import Link from "next/link";
import { useState } from "react";
import {
  etykietaJednostkiCeny,
  etykietaKategoriiSprzetu,
  etykietaTypuOgloszenia,
} from "@/lib/marketplace/kategorie-ogloszen";
import { ZapiszTrescPrzycisk } from "@/components/panel/moje/zapisz-tresc-przycisk";
import { RynekKontaktSprzedawcy } from "@/components/wies/rynek-kontakt-sprzedawcy";
import { RynekObserwujCene } from "@/components/wies/rynek-obserwuj-cene";
import { RynekRejestrujWyswietlenie } from "@/components/wies/rynek-licznik-wyswietlen";
import { RynekUdostepnijPrzycisk } from "@/components/wies/rynek-udostepnij-przycisk";
import { zbudujTekstUdostepnieniaOgloszenia } from "@/lib/marketplace/tekst-udostepnienia";
import { ObrazR2 } from "@/components/media/obraz-r2";
import {
  BlokInfoRynku,
  FormatujCeneOgloszenia,
  MiniaturaOgloszenia,
  OdznakaZweryfikowany,
  PasekOdznakSprzedawcy,
} from "@/components/wies/rynek-ui";
import type { ZaufanieSprzedawcy } from "@/lib/marketplace/zaufanie-sprzedawcy";
import { MapaDzialkiOgledzin } from "@/components/marketplace/mapa-dzialki-ogledzin";
import { czyKategoriaNieruchomosci, formatujPowierzchnieDzialki } from "@/lib/marketplace/nieruchomosci";
import type { GeoJsonGeometriiDzialki } from "@/lib/geoportal/wkt-do-geojson";

export type OgloszenieRynekPubliczne = {
  id: string;
  title: string;
  description: string;
  listing_type: string;
  equipment_category: string | null;
  category: string | null;
  price_amount: number | null;
  price_unit: string | null;
  currency?: string | null;
  with_operator: boolean;
  phone: string | null;
  location_text: string | null;
  image_urls: string[] | null;
  published_at: string | null;
  created_at: string;
  owner_user_id: string;
  seller_verified?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  pickup_in_village?: boolean;
  delivery_radius_km?: number | null;
  seasonal_note?: string | null;
  product_produced_at?: string | null;
  product_best_before?: string | null;
  is_organic?: boolean;
  allergens_text?: string | null;
  sales_poi_name?: string | null;
  profile_id?: string | null;
  parcel_geojson?: GeoJsonGeometriiDzialki | null;
  parcel_number?: string | null;
  cadastral_district?: string | null;
  parcel_area_m2?: number | null;
  geoportal_parcel_id?: string | null;
  view_count?: number;
};

export type ProfilSprzedawcySkrot = {
  id: string;
  business_name: string;
  is_verified: boolean;
};

export type OgloszenieRynekSkrot = {
  id: string;
  title: string;
  listing_type: string;
  price_amount: number | null;
  price_unit: string | null;
  equipment_category: string | null;
  category: string | null;
};

export function RynekOgloszenieSzczegoly({
  ogloszenie,
  sciezkaWsi,
  nazwaWsi,
  villageId,
  zalogowany,
  toJa,
  zapisaneId = null,
  obserwujCene = false,
  zaufanieSprzedawcy = null,
  profilSprzedawcy = null,
  podobne = [],
}: {
  ogloszenie: OgloszenieRynekPubliczne;
  sciezkaWsi: string;
  nazwaWsi?: string;
  villageId: string;
  zalogowany: boolean;
  toJa: boolean;
  zapisaneId?: string | null;
  obserwujCene?: boolean;
  zaufanieSprzedawcy?: ZaufanieSprzedawcy | null;
  profilSprzedawcy?: ProfilSprzedawcySkrot | null;
  podobne?: OgloszenieRynekSkrot[];
}) {
  const [zdjecieAktywne, ustawZdjecieAktywne] = useState(0);
  const zdjecia = ogloszenie.image_urls ?? [];
  const kat = ogloszenie.equipment_category ?? ogloszenie.category;
  const bazaUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://naszawies.pl";
  const urlOgloszenia = `${bazaUrl}${sciezkaWsi}/rynek/${ogloszenie.id}`;

  const maMapeDzialki = Boolean(ogloszenie.parcel_geojson);
  const jestNieruchomoscia = czyKategoriaNieruchomosci(kat);
  const tekstUdostepnienia = zbudujTekstUdostepnieniaOgloszenia({
    tytul: ogloszenie.title,
    cena: ogloszenie.price_amount,
    waluta: ogloszenie.currency,
    jednostka: ogloszenie.price_unit,
    powierzchniaM2: ogloszenie.parcel_area_m2,
    nazwaWsi,
  });

  const maSzczegolyProduktu =
    ogloszenie.pickup_in_village ||
    (ogloszenie.delivery_radius_km != null && ogloszenie.delivery_radius_km > 0) ||
    ogloszenie.seasonal_note ||
    ogloszenie.product_produced_at ||
    ogloszenie.product_best_before ||
    ogloszenie.is_organic ||
    ogloszenie.allergens_text ||
    ogloszenie.sales_poi_name;

  return (
    <article className="wow-wejscie overflow-hidden rounded-2xl border border-orange-200/70 bg-white shadow-lg shadow-orange-950/5 ring-1 ring-stone-950/[0.03]">
      <div className="lg:grid lg:grid-cols-[1fr_minmax(240px,280px)] lg:gap-0">
        <div className="border-b border-stone-100 p-5 sm:p-6 lg:border-b-0 lg:border-r">
          <p className="inline-flex flex-wrap items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-900">
            <span className="rounded-full bg-orange-100/80 px-2 py-0.5">{etykietaTypuOgloszenia(ogloszenie.listing_type)}</span>
            {kat ? (
              <span className="rounded-full bg-stone-100 px-2 py-0.5 normal-case tracking-normal text-stone-700">
                {etykietaKategoriiSprzetu(kat)}
              </span>
            ) : null}
            {ogloszenie.with_operator ? (
              <span className="rounded-full bg-sky-100 px-2 py-0.5 normal-case tracking-normal text-sky-900">z operatorem</span>
            ) : null}
          </p>
          <h1 className="mt-3 font-serif text-2xl text-green-950 sm:text-3xl">{ogloszenie.title}</h1>

          {zdjecia.length > 0 ? (
            <div className="mt-5">
              <div className="relative overflow-hidden rounded-2xl ring-1 ring-stone-200/80">
                <ObrazR2
                  src={zdjecia[zdjecieAktywne]}
                  preset="pelny"
                  alt=""
                  className="aspect-[4/3] w-full object-cover sm:max-h-80"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
                <p className="absolute bottom-3 left-3 rounded-xl bg-white/95 px-3 py-1.5 text-lg font-bold text-green-900 shadow-lg backdrop-blur-sm">
                  <FormatujCeneOgloszenia kwota={ogloszenie.price_amount} jednostka={ogloszenie.price_unit} />
                </p>
              </div>
              {zdjecia.length > 1 ? (
                <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                  {zdjecia.map((url, i) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => ustawZdjecieAktywne(i)}
                      className={`shrink-0 overflow-hidden rounded-xl ring-2 ring-offset-2 transition ${
                        i === zdjecieAktywne ? "ring-orange-500" : "ring-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      <ObrazR2 src={url} preset="miniatura" alt="" className="h-14 w-14 object-cover" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-5">
              <MiniaturaOgloszenia rozmiar="duzy" />
            </div>
          )}

          <div className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-stone-800">{ogloszenie.description}</div>

          {jestNieruchomoscia ? (
            <div className="mt-6">
              {maMapeDzialki ? (
                <MapaDzialkiOgledzin
                  geometria={ogloszenie.parcel_geojson ?? null}
                  srodekLat={ogloszenie.latitude}
                  srodekLng={ogloszenie.longitude}
                  numerDzialki={ogloszenie.parcel_number}
                  obreb={ogloszenie.cadastral_district}
                  powierzchniaM2={ogloszenie.parcel_area_m2}
                />
              ) : null}
              {(ogloszenie.parcel_number || ogloszenie.cadastral_district || ogloszenie.parcel_area_m2) && !maMapeDzialki ? (
                <BlokInfoRynku tytul="Dane działki" ikona="📐">
                  <ul className="space-y-1 text-sm">
                    {ogloszenie.parcel_number ? <li>Numer: {ogloszenie.parcel_number}</li> : null}
                    {ogloszenie.cadastral_district ? <li>Obręb: {ogloszenie.cadastral_district}</li> : null}
                    {ogloszenie.parcel_area_m2 ? (
                      <li>Powierzchnia: {formatujPowierzchnieDzialki(ogloszenie.parcel_area_m2)}</li>
                    ) : null}
                  </ul>
                </BlokInfoRynku>
              ) : null}
              <p className="mt-2 text-[11px] text-stone-500">
                Informacja z Geoportalu ma charakter pomocniczy — przed zakupem sprawdź w urzędzie / u notariusza.
              </p>
            </div>
          ) : null}

          {maSzczegolyProduktu ? (
            <div className="mt-5">
              <BlokInfoRynku tytul="Szczegóły oferty" ikona="🧺">
                <ul className="space-y-1">
                  {ogloszenie.pickup_in_village ? <li>Odbiór osobisty we wsi</li> : null}
                  {ogloszenie.delivery_radius_km != null && ogloszenie.delivery_radius_km > 0 ? (
                    <li>Dowóz do ok. {ogloszenie.delivery_radius_km} km</li>
                  ) : null}
                  {ogloszenie.seasonal_note ? <li>Sezon: {ogloszenie.seasonal_note}</li> : null}
                  {ogloszenie.product_produced_at ? (
                    <li>Produkcja / zbiór: {new Date(ogloszenie.product_produced_at).toLocaleDateString("pl-PL")}</li>
                  ) : null}
                  {ogloszenie.product_best_before ? (
                    <li>Najlepiej spożyć do: {new Date(ogloszenie.product_best_before).toLocaleDateString("pl-PL")}</li>
                  ) : null}
                  {ogloszenie.is_organic ? <li>Produkcja ekologiczna / certyfikat</li> : null}
                  {ogloszenie.allergens_text ? <li>Alergeny: {ogloszenie.allergens_text}</li> : null}
                  {ogloszenie.sales_poi_name ? <li>Punkt sprzedaży: {ogloszenie.sales_poi_name}</li> : null}
                </ul>
              </BlokInfoRynku>
            </div>
          ) : null}

          {ogloszenie.latitude != null && ogloszenie.longitude != null && !maMapeDzialki ? (
            <p className="mt-4 text-sm">
              <a
                href={`https://www.openstreetmap.org/?mlat=${ogloszenie.latitude}&mlon=${ogloszenie.longitude}#map=15/${ogloszenie.latitude}/${ogloszenie.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-green-800 underline"
              >
                OpenStreetMap
              </a>
              {" · "}
              <Link
                href={`/mapa?wies=${villageId}&lat=${ogloszenie.latitude}&lon=${ogloszenie.longitude}&zoom=15`}
                className="text-green-800 underline"
              >
                Mapa wsi
              </Link>
            </p>
          ) : null}
        </div>

        <aside className="bg-gradient-to-b from-orange-50/60 via-amber-50/30 to-stone-50/40 p-5 sm:p-6">
          <div className="rounded-2xl border border-orange-200/60 bg-white/95 p-4 shadow-md backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Cena</p>
            <p className="mt-1 text-3xl font-bold text-green-900">
              <FormatujCeneOgloszenia kwota={ogloszenie.price_amount} jednostka={ogloszenie.price_unit} />
            </p>
            <p className="mt-2 text-xs text-stone-600">
              {ogloszenie.location_text ? `${ogloszenie.location_text} · ` : ""}
              Opublikowano {new Date(ogloszenie.published_at ?? ogloszenie.created_at).toLocaleDateString("pl-PL")}
            </p>
            <p className="mt-1 text-xs">
              <RynekRejestrujWyswietlenie listingId={ogloszenie.id} poczatkowaLiczba={ogloszenie.view_count ?? 0} />
            </p>
            {ogloszenie.seller_verified || zaufanieSprzedawcy?.znanyWWsi || zaufanieSprzedawcy?.aktywnySprzedawca ? (
              <p className="mt-3">
                <PasekOdznakSprzedawcy
                  sellerVerified={ogloszenie.seller_verified}
                  znanyWWsi={zaufanieSprzedawcy?.znanyWWsi}
                  aktywnySprzedawca={zaufanieSprzedawcy?.aktywnySprzedawca}
                  liczbaOgloszen={zaufanieSprzedawcy?.liczbaOgloszenSprzedawcy}
                />
              </p>
            ) : null}
          </div>

          {profilSprzedawcy ? (
            <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-stone-500">Sprzedawca</p>
              <Link
                href={`${sciezkaWsi}/rynek/uslugi/${profilSprzedawcy.id}`}
                className="mt-1 block font-medium text-green-900 hover:underline"
              >
                {profilSprzedawcy.business_name}
              </Link>
              {profilSprzedawcy.is_verified ? (
                <p className="mt-2">
                  <OdznakaZweryfikowany />
                </p>
              ) : null}
            </div>
          ) : null}

          <RynekKontaktSprzedawcy
            ogloszenieId={ogloszenie.id}
            telefon={ogloszenie.phone}
            tytul={ogloszenie.title}
            urlOgloszenia={urlOgloszenia}
            sciezkaWsi={sciezkaWsi}
            nazwaWsi={nazwaWsi}
            zalogowany={zalogowany}
            toJa={toJa}
          />

          <div className="mt-4 space-y-2">
            <Link
              href={`${sciezkaWsi}/rynek`}
              className="block w-full rounded-xl border border-stone-300 px-4 py-2.5 text-center text-sm text-stone-800 hover:bg-stone-50"
            >
              ← Wszystkie ogłoszenia
            </Link>
            <div className="flex flex-wrap gap-2">
              <RynekUdostepnijPrzycisk
                url={`${sciezkaWsi}/rynek/${ogloszenie.id}`}
                tytul={ogloszenie.title}
                tekst={tekstUdostepnienia}
              />
              {zalogowany ? (
                <>
                  <ZapiszTrescPrzycisk
                    villageId={villageId}
                    contentType="listing"
                    contentId={ogloszenie.id}
                    title={ogloszenie.title}
                    href={`${sciezkaWsi}/rynek/${ogloszenie.id}`}
                    zapisaneId={zapisaneId}
                  />
                  {zapisaneId ? (
                    <RynekObserwujCene zapisaneId={zapisaneId} poczatkowoWlaczone={obserwujCene} />
                  ) : null}
                </>
              ) : null}
            </div>
          </div>

          {toJa ? (
            <p className="mt-3 text-xs text-stone-500">To Twoje ogłoszenie — odpowiedzi zobaczysz w Wiadomościach.</p>
          ) : null}

          <p className="mt-4 text-xs text-stone-500">
            <Link
              href={`/zglos-naruszenie?url=${encodeURIComponent(urlOgloszenia)}`}
              className="underline hover:text-stone-800"
            >
              Zgłoś naruszenie
            </Link>
          </p>
        </aside>
      </div>

      {podobne.length > 0 ? (
        <section className="border-t border-stone-200 px-5 py-6 sm:px-6">
          <h2 className="font-serif text-lg text-green-950">Podobne ogłoszenia</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {podobne.map((p) => {
              const katP = p.equipment_category ?? p.category;
              return (
                <li key={p.id}>
                  <Link
                    href={`${sciezkaWsi}/rynek/${p.id}`}
                    className="block rounded-xl border border-orange-100 bg-orange-50/30 px-3 py-2.5 text-sm transition hover:border-orange-300 hover:bg-orange-50"
                  >
                    <span className="font-medium text-green-950">{p.title}</span>
                    <span className="mt-0.5 block text-xs text-stone-600">
                      {etykietaTypuOgloszenia(p.listing_type)}
                      {katP ? ` · ${etykietaKategoriiSprzetu(katP)}` : ""}
                      {p.price_amount != null
                        ? ` · ${p.price_amount} PLN${p.price_unit ? ` ${etykietaJednostkiCeny(p.price_unit)}` : ""}`
                        : ""}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
