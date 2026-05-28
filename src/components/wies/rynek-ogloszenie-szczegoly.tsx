"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  etykietaJednostkiCeny,
  etykietaKategoriiSprzetu,
  etykietaTypuOgloszenia,
} from "@/lib/marketplace/kategorie-ogloszen";
import { rozpocznijCzatZOgloszenia } from "@/app/(site)/panel/czat/akcje";
import { ZapiszTrescPrzycisk } from "@/components/panel/moje/zapisz-tresc-przycisk";
import { RynekUdostepnijPrzycisk } from "@/components/wies/rynek-udostepnij-przycisk";
import {
  BlokInfoRynku,
  FormatujCeneOgloszenia,
  MiniaturaOgloszenia,
  OdznakaZweryfikowany,
} from "@/components/wies/rynek-ui";

export type OgloszenieRynekPubliczne = {
  id: string;
  title: string;
  description: string;
  listing_type: string;
  equipment_category: string | null;
  category: string | null;
  price_amount: number | null;
  price_unit: string | null;
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
  villageId,
  zalogowany,
  toJa,
  zapisaneId = null,
  profilSprzedawcy = null,
  podobne = [],
}: {
  ogloszenie: OgloszenieRynekPubliczne;
  sciezkaWsi: string;
  villageId: string;
  zalogowany: boolean;
  toJa: boolean;
  zapisaneId?: string | null;
  profilSprzedawcy?: ProfilSprzedawcySkrot | null;
  podobne?: OgloszenieRynekSkrot[];
}) {
  const router = useRouter();
  const [blad, ustawBlad] = useState("");
  const [czek, startT] = useTransition();
  const [zdjecieAktywne, ustawZdjecieAktywne] = useState(0);
  const zdjecia = ogloszenie.image_urls ?? [];
  const kat = ogloszenie.equipment_category ?? ogloszenie.category;
  const bazaUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://naszawies.pl";
  const urlOgloszenia = `${bazaUrl}${sciezkaWsi}/rynek/${ogloszenie.id}`;

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
    <article className="overflow-hidden rounded-2xl border border-orange-200/80 bg-white shadow-sm">
      <div className="lg:grid lg:grid-cols-[1fr_minmax(240px,280px)] lg:gap-0">
        <div className="border-b border-stone-100 p-5 sm:p-6 lg:border-b-0 lg:border-r">
          <p className="text-xs font-bold uppercase tracking-wider text-orange-900">
            {etykietaTypuOgloszenia(ogloszenie.listing_type)}
            {kat ? ` · ${etykietaKategoriiSprzetu(kat)}` : ""}
            {ogloszenie.with_operator ? " · z operatorem" : ""}
          </p>
          <h1 className="mt-2 font-serif text-2xl text-green-950 sm:text-3xl">{ogloszenie.title}</h1>

          {zdjecia.length > 0 ? (
            <div className="mt-4">
              <a href={zdjecia[zdjecieAktywne]} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={zdjecia[zdjecieAktywne]}
                  alt=""
                  className="aspect-[4/3] w-full object-cover sm:max-h-80"
                />
              </a>
              {zdjecia.length > 1 ? (
                <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                  {zdjecia.map((url, i) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => ustawZdjecieAktywne(i)}
                      className={`shrink-0 overflow-hidden rounded-lg ring-2 ring-offset-1 ${
                        i === zdjecieAktywne ? "ring-orange-500" : "ring-transparent"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="h-14 w-14 object-cover" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-4">
              <MiniaturaOgloszenia rozmiar="duzy" />
            </div>
          )}

          <div className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-stone-800">{ogloszenie.description}</div>

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

          {ogloszenie.latitude != null && ogloszenie.longitude != null ? (
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

        <aside className="bg-gradient-to-b from-orange-50/50 to-stone-50/30 p-5 sm:p-6">
          <div className="rounded-2xl border border-orange-200/70 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-stone-500">Cena</p>
            <p className="mt-1 text-2xl font-semibold text-green-900">
              <FormatujCeneOgloszenia kwota={ogloszenie.price_amount} jednostka={ogloszenie.price_unit} />
            </p>
            <p className="mt-2 text-xs text-stone-600">
              {ogloszenie.location_text ? `${ogloszenie.location_text} · ` : ""}
              Opublikowano {new Date(ogloszenie.published_at ?? ogloszenie.created_at).toLocaleDateString("pl-PL")}
            </p>
            {ogloszenie.seller_verified ? (
              <p className="mt-3">
                <OdznakaZweryfikowany duza />
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

          {ogloszenie.phone ? (
            <a
              href={`tel:${ogloszenie.phone.replace(/\s/g, "")}`}
              className="mt-4 flex w-full items-center justify-center rounded-xl bg-green-800 px-4 py-3 text-sm font-semibold text-white hover:bg-green-900"
            >
              Zadzwoń: {ogloszenie.phone}
            </a>
          ) : null}

          <div className="mt-4 space-y-2">
            {!toJa && zalogowany ? (
              <button
                type="button"
                disabled={czek}
                className="w-full rounded-xl border border-green-800 bg-white px-4 py-2.5 text-sm font-semibold text-green-900 hover:bg-green-50 disabled:opacity-50"
                onClick={() => {
                  ustawBlad("");
                  startT(async () => {
                    const w = await rozpocznijCzatZOgloszenia(ogloszenie.id);
                    if ("blad" in w) {
                      ustawBlad(w.blad);
                      return;
                    }
                    if (w.conversationId) router.push(`/panel/czat/${w.conversationId}`);
                  });
                }}
              >
                {czek ? "Otwieranie…" : "Napisz wiadomość"}
              </button>
            ) : null}
            {!zalogowany ? (
              <Link
                href={`/logowanie?next=${encodeURIComponent(`${sciezkaWsi}/rynek/${ogloszenie.id}`)}`}
                className="block w-full rounded-xl border border-green-800 px-4 py-2.5 text-center text-sm font-semibold text-green-900 hover:bg-green-50"
              >
                Zaloguj się, aby napisać
              </Link>
            ) : null}
            <Link
              href={`${sciezkaWsi}/rynek`}
              className="block w-full rounded-xl border border-stone-300 px-4 py-2.5 text-center text-sm text-stone-800 hover:bg-stone-50"
            >
              ← Wszystkie ogłoszenia
            </Link>
            <div className="flex flex-wrap gap-2">
              <RynekUdostepnijPrzycisk url={`${sciezkaWsi}/rynek/${ogloszenie.id}`} tytul={ogloszenie.title} />
              {zalogowany ? (
                <ZapiszTrescPrzycisk
                  villageId={villageId}
                  contentType="listing"
                  contentId={ogloszenie.id}
                  title={ogloszenie.title}
                  href={`${sciezkaWsi}/rynek/${ogloszenie.id}`}
                  zapisaneId={zapisaneId}
                />
              ) : null}
            </div>
          </div>

          {blad ? (
            <p className="mt-3 text-sm text-red-800" role="alert">
              {blad}
            </p>
          ) : null}
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
