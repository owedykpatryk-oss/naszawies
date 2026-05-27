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
  podobne = [],
}: {
  ogloszenie: OgloszenieRynekPubliczne;
  sciezkaWsi: string;
  villageId: string;
  zalogowany: boolean;
  toJa: boolean;
  zapisaneId?: string | null;
  podobne?: OgloszenieRynekSkrot[];
}) {
  const router = useRouter();
  const [blad, ustawBlad] = useState("");
  const [czek, startT] = useTransition();
  const zdjecia = ogloszenie.image_urls ?? [];
  const kat = ogloszenie.equipment_category ?? ogloszenie.category;

  return (
    <article className="rounded-2xl border border-orange-200/80 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-orange-900">
        {etykietaTypuOgloszenia(ogloszenie.listing_type)}
        {kat ? ` · ${etykietaKategoriiSprzetu(kat)}` : ""}
        {ogloszenie.with_operator ? " · z operatorem" : ""}
      </p>
      <h1 className="mt-2 font-serif text-2xl text-green-950 sm:text-3xl">
        {ogloszenie.title}
        {ogloszenie.seller_verified ? (
          <span className="ml-2 inline-block rounded-full bg-emerald-100 px-2 py-0.5 align-middle text-xs font-semibold text-emerald-900">
            Zweryfikowany sprzedawca
          </span>
        ) : null}
      </h1>
      <p className="mt-2 text-sm text-stone-600">
        {ogloszenie.price_amount != null
          ? `${ogloszenie.price_amount} PLN${ogloszenie.price_unit ? ` ${etykietaJednostkiCeny(ogloszenie.price_unit)}` : ""}`
          : "Cena do uzgodnienia"}
        {ogloszenie.location_text ? ` · ${ogloszenie.location_text}` : ""}
        {" · "}
        {new Date(ogloszenie.published_at ?? ogloszenie.created_at).toLocaleDateString("pl-PL")}
      </p>

      {zdjecia.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {zdjecia.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <a key={url} href={url} target="_blank" rel="noopener noreferrer">
              <img src={url} alt="" className="h-36 w-36 rounded-lg border border-stone-200 object-cover sm:h-44 sm:w-44" />
            </a>
          ))}
        </div>
      ) : null}

      <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-stone-800">{ogloszenie.description}</div>

      <ul className="mt-4 space-y-1 text-sm text-stone-700">
        {ogloszenie.pickup_in_village ? <li>✓ Odbiór osobisty we wsi</li> : null}
        {ogloszenie.delivery_radius_km != null && ogloszenie.delivery_radius_km > 0 ? (
          <li>✓ Dowóz do ok. {ogloszenie.delivery_radius_km} km</li>
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

      {ogloszenie.latitude != null && ogloszenie.longitude != null ? (
        <p className="mt-3 text-sm">
          <a
            href={`https://www.openstreetmap.org/?mlat=${ogloszenie.latitude}&mlon=${ogloszenie.longitude}#map=15/${ogloszenie.latitude}/${ogloszenie.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-green-800 underline"
          >
            Zobacz na mapie (OpenStreetMap)
          </a>
          {" · "}
          <Link
            href={`/mapa?wies=${villageId}&lat=${ogloszenie.latitude}&lon=${ogloszenie.longitude}&zoom=15`}
            className="text-green-800 underline"
          >
            Mapa wsi (naszawies)
          </Link>
        </p>
      ) : null}

      {ogloszenie.phone ? (
        <p className="mt-4 text-sm">
          Telefon:{" "}
          <a href={`tel:${ogloszenie.phone.replace(/\s/g, "")}`} className="font-medium text-green-900 underline">
            {ogloszenie.phone}
          </a>
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        {!toJa && zalogowany ? (
          <button
            type="button"
            disabled={czek}
            className="rounded-xl bg-green-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-900 disabled:opacity-50"
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
            className="rounded-xl border border-green-800 px-4 py-2.5 text-sm font-semibold text-green-900 hover:bg-green-50"
          >
            Zaloguj się, aby napisać
          </Link>
        ) : null}
        <Link
          href={`${sciezkaWsi}/rynek`}
          className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-stone-800 hover:bg-stone-50"
        >
          ← Wszystkie ogłoszenia
        </Link>
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
      {blad ? (
        <p className="mt-3 text-sm text-red-800" role="alert">
          {blad}
        </p>
      ) : null}
      {toJa ? <p className="mt-2 text-xs text-stone-500">To Twoje ogłoszenie — odpowiedzi zobaczysz w Wiadomościach.</p> : null}

      {podobne.length > 0 ? (
        <section className="mt-8 border-t border-stone-200 pt-6">
          <h2 className="font-serif text-lg text-green-950">Podobne ogłoszenia</h2>
          <ul className="mt-3 space-y-2">
            {podobne.map((p) => {
              const katP = p.equipment_category ?? p.category;
              return (
                <li key={p.id}>
                  <Link
                    href={`${sciezkaWsi}/rynek/${p.id}`}
                    className="block rounded-lg border border-orange-100 bg-orange-50/40 px-3 py-2 text-sm hover:bg-orange-50"
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
