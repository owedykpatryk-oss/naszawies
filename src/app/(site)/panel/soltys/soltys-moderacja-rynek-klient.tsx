"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { PasekMasowychAkcji } from "@/components/panel/pasek-masowych-akcji";
import { zatwierdzRynekMasowoSoltys } from "./akcje-masowe";
import {
  odrzucMarketplaceOferteMieszkanca,
  odrzucOfertePomocySasiedzkiej,
  zatwierdzMarketplaceOferteMieszkanca,
  zatwierdzOfertePomocySasiedzkiej,
} from "./akcje";
import {
  etykietaJednostkiCeny,
  etykietaKategoriiOgloszenia,
  etykietaKategoriiSprzetu,
  etykietaTypuOgloszenia,
} from "@/lib/marketplace/kategorie-ogloszen";
import { czyOgloszenieZPakietuKgw } from "@/lib/marketplace/czy-pakiet-kgw";
import { czyKategoriaNieruchomosci, formatujPowierzchnieDzialki } from "@/lib/marketplace/nieruchomosci";
import type { GeoJsonGeometriiDzialki } from "@/lib/geoportal/wkt-do-geojson";

const MapaDzialkiOgledzin = dynamic(
  () => import("@/components/marketplace/mapa-dzialki-ogledzin").then((m) => m.MapaDzialkiOgledzin),
  { ssr: false, loading: () => <p className="text-xs text-stone-500">Ładowanie mapy działki…</p> },
);

type Wiersz = {
  id: string;
  title: string;
  typ: "marketplace" | "pomoc";
  wies: string;
  sciezkaWsi?: string | null;
  owner_user_id?: string | null;
  created_at?: string | null;
  listing_type?: string | null;
  equipment_category?: string | null;
  category?: string | null;
  description?: string | null;
  image_urls?: string[] | null;
  price_amount?: number | null;
  price_unit?: string | null;
  currency?: string | null;
  parcel_number?: string | null;
  cadastral_district?: string | null;
  parcel_area_m2?: number | null;
  parcel_geojson?: unknown;
  latitude?: number | null;
  longitude?: number | null;
};

function PodgladDzialkiModeracja({ w }: { w: Wiersz }) {
  const kat = w.equipment_category ?? w.category;
  if (!czyKategoriaNieruchomosci(kat)) return null;

  const pow = formatujPowierzchnieDzialki(w.parcel_area_m2);
  const maMape = Boolean(w.parcel_geojson);
  const cena =
    w.price_amount != null
      ? `${w.price_amount} ${w.currency ?? "PLN"}${w.price_unit ? ` ${etykietaJednostkiCeny(w.price_unit)}` : ""}`
      : null;

  return (
    <div className="mt-3 rounded-lg border border-amber-200/80 bg-amber-50/40 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-950">Nieruchomość / działka</p>
      <ul className="mt-1.5 space-y-0.5 text-xs text-stone-700">
        {kat ? <li>Kategoria: {etykietaKategoriiOgloszenia(kat)}</li> : null}
        {w.parcel_number ? <li>Numer działki: {w.parcel_number}</li> : null}
        {w.cadastral_district ? <li>Obręb: {w.cadastral_district}</li> : null}
        {pow ? <li>Powierzchnia: {pow}</li> : null}
        {cena ? <li>Cena: {cena}</li> : null}
      </ul>
      {maMape ? (
        <div className="mt-2 overflow-hidden rounded-lg border border-stone-200">
          <MapaDzialkiOgledzin
            geometria={w.parcel_geojson as GeoJsonGeometriiDzialki}
            srodekLat={w.latitude}
            srodekLng={w.longitude}
            numerDzialki={w.parcel_number ?? undefined}
            obreb={w.cadastral_district ?? undefined}
            powierzchniaM2={w.parcel_area_m2 ?? undefined}
            wysokosc="kompakt"
          />
        </div>
      ) : (
        <p className="mt-2 text-xs text-stone-500">Brak granicy działki z Geoportalu — sprawdź lokalizację w opisie.</p>
      )}
    </div>
  );
}

export function SoltysModeracjaRynekKlient({ wiersze }: { wiersze: Wiersz[] }) {
  const router = useRouter();
  const [blad, ustawBlad] = useState("");
  const [czek, startT] = useTransition();
  const [odrzucId, ustawOdrzucId] = useState<string | null>(null);
  const [notatka, ustawNotatka] = useState("");
  const [zaznaczoneRynek, ustawZaznaczoneRynek] = useState<Set<string>>(new Set());
  const [filtrTyp, ustawFiltrTyp] = useState<"" | "marketplace" | "pomoc">("");
  const [filtrWies, ustawFiltrWies] = useState("");

  const wiesOpcje = useMemo(() => Array.from(new Set(wiersze.map((w) => w.wies))).sort(), [wiersze]);

  const widoczne = useMemo(() => {
    return wiersze.filter((w) => {
      if (filtrTyp && w.typ !== filtrTyp) return false;
      if (filtrWies && w.wies !== filtrWies) return false;
      return true;
    });
  }, [wiersze, filtrTyp, filtrWies]);

  const pakietyKgw = useMemo(() => {
    const grupy = new Map<string, Wiersz[]>();
    for (const w of widoczne) {
      if (w.typ !== "marketplace" || !czyOgloszenieZPakietuKgw(w.description)) continue;
      if (!w.owner_user_id) continue;
      const arr = grupy.get(w.owner_user_id) ?? [];
      arr.push(w);
      grupy.set(w.owner_user_id, arr);
    }
    return Array.from(grupy.values()).filter((items) => items.length >= 2);
  }, [widoczne]);

  if (wiersze.length === 0) return null;

  return (
    <section className="mt-8 rounded-xl border border-orange-200 bg-orange-50/40 p-4">
      <h2 className="font-serif text-lg text-green-950">Do moderacji (mieszkańcy)</h2>
      <p className="mt-1 text-xs text-stone-600">
        Rynek lokalny i pomoc sąsiedzka. Przy odrzuceniu autor dostaje powiadomienie z krótką notatką.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <select
          value={filtrTyp}
          onChange={(e) => ustawFiltrTyp(e.target.value as "" | "marketplace" | "pomoc")}
          className="rounded-lg border border-stone-300 px-2 py-1.5 text-xs"
        >
          <option value="">Wszystkie typy</option>
          <option value="marketplace">Rynek</option>
          <option value="pomoc">Pomoc sąsiedzka</option>
        </select>
        <select
          value={filtrWies}
          onChange={(e) => ustawFiltrWies(e.target.value)}
          className="rounded-lg border border-stone-300 px-2 py-1.5 text-xs"
        >
          <option value="">Wszystkie wsie</option>
          {wiesOpcje.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() =>
            ustawZaznaczoneRynek(new Set(widoczne.filter((w) => w.typ === "marketplace").map((w) => w.id)))
          }
          className="rounded-lg border border-stone-300 px-2 py-1 text-xs hover:bg-white"
        >
          Zaznacz ogłoszenia rynku
        </button>
      </div>

      {blad ? (
        <p className="mt-2 text-sm text-red-800" role="alert">
          {blad}
        </p>
      ) : null}

      {pakietyKgw.length > 0 ? (
        <div className="mt-3 space-y-2">
          {pakietyKgw.map((pozycje) => {
            const ids = pozycje.map((p) => p.id);
            const wiesPakietu = pozycje[0]?.wies ?? "wsi";
            return (
              <div
                key={ids.join("-")}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-violet-200 bg-violet-50/60 px-3 py-2"
              >
                <p className="text-xs text-violet-950">
                  <span className="font-bold">Pakiet KGW</span> · {pozycje.length} ogłoszeń · {wiesPakietu}
                </p>
                <button
                  type="button"
                  disabled={!!czek}
                  className="rounded-lg bg-violet-800 px-3 py-1 text-xs font-medium text-white hover:bg-violet-900 disabled:opacity-50"
                  onClick={() => {
                    ustawBlad("");
                    startT(async () => {
                      const wynik = await zatwierdzRynekMasowoSoltys(ids);
                      if ("blad" in wynik) {
                        ustawBlad(wynik.blad);
                        return;
                      }
                      router.refresh();
                    });
                  }}
                >
                  Zatwierdź pakiet KGW ({pozycje.length})
                </button>
              </div>
            );
          })}
        </div>
      ) : null}

      <ul className="mt-3 space-y-3">
        {widoczne.map((w) => (
          <li key={`${w.typ}-${w.id}`} className="rounded-lg bg-white px-3 py-3 text-sm shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex min-w-0 items-start gap-2">
                {w.typ === "marketplace" ? (
                  <input
                    type="checkbox"
                    checked={zaznaczoneRynek.has(w.id)}
                    onChange={() =>
                      ustawZaznaczoneRynek((prev) => {
                        const n = new Set(prev);
                        if (n.has(w.id)) n.delete(w.id);
                        else n.add(w.id);
                        return n;
                      })
                    }
                    className="mt-1 h-4 w-4 rounded border-stone-300"
                  />
                ) : null}
                <div className="min-w-0">
                  <span className="text-xs uppercase text-stone-500">{w.typ === "marketplace" ? "Rynek" : "Pomoc"}</span>
                  <p className="font-medium text-stone-900">{w.title}</p>
                  <p className="text-xs text-stone-500">{w.wies}</p>
                  {w.typ === "marketplace" && w.listing_type ? (
                    <p className="mt-1 text-xs text-stone-600">
                      {etykietaTypuOgloszenia(w.listing_type)}
                      {w.equipment_category
                        ? ` · ${etykietaKategoriiSprzetu(w.equipment_category)}`
                        : w.category
                          ? ` · ${etykietaKategoriiOgloszenia(w.category)}`
                          : ""}
                    </p>
                  ) : null}
                  {w.description ? (
                    <p className="mt-2 line-clamp-3 text-xs text-stone-700">{w.description}</p>
                  ) : null}
                  {(w.image_urls ?? []).length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(w.image_urls ?? []).slice(0, 5).map((url) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={url} src={url} alt="" className="h-12 w-12 rounded object-cover" />
                      ))}
                      {(w.image_urls ?? []).length > 5 ? (
                        <span className="self-center text-[10px] text-stone-500">+{(w.image_urls ?? []).length - 5}</span>
                      ) : null}
                    </div>
                  ) : null}
                  {w.typ === "marketplace" ? <PodgladDzialkiModeracja w={w} /> : null}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {w.typ === "marketplace" && w.sciezkaWsi ? (
                  <Link
                    href={`${w.sciezkaWsi}/rynek/${w.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-950 hover:bg-orange-100"
                  >
                    Podgląd publiczny
                  </Link>
                ) : null}
                <button
                  type="button"
                  disabled={!!czek}
                  className="rounded-lg bg-green-800 px-3 py-1 text-xs font-medium text-white hover:bg-green-900 disabled:opacity-50"
                  onClick={() => {
                    ustawBlad("");
                    startT(async () => {
                      const wynik =
                        w.typ === "marketplace"
                          ? await zatwierdzMarketplaceOferteMieszkanca(w.id)
                          : await zatwierdzOfertePomocySasiedzkiej(w.id);
                      if ("blad" in wynik) {
                        ustawBlad(wynik.blad);
                        return;
                      }
                      router.refresh();
                    });
                  }}
                >
                  Zatwierdź
                </button>
                <button
                  type="button"
                  disabled={!!czek}
                  className="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-800 hover:bg-red-50 disabled:opacity-50"
                  onClick={() => {
                    ustawOdrzucId(w.id);
                    ustawNotatka("");
                  }}
                >
                  Odrzuć
                </button>
              </div>
            </div>
            {odrzucId === w.id ? (
              <div className="mt-3 border-t border-stone-100 pt-3">
                <label className="mb-1 block text-xs font-medium text-stone-700">Powód odrzucenia</label>
                <textarea
                  value={notatka}
                  onChange={(e) => ustawNotatka(e.target.value)}
                  rows={2}
                  className="w-full rounded border border-stone-300 px-2 py-1 text-sm"
                  placeholder="Np. brak opisu, nieczytelne zdjęcie…"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    disabled={!!czek}
                    className="rounded-lg bg-red-800 px-3 py-1 text-xs text-white disabled:opacity-50"
                    onClick={() => {
                      ustawBlad("");
                      startT(async () => {
                        const wynik =
                          w.typ === "marketplace"
                            ? await odrzucMarketplaceOferteMieszkanca(w.id, notatka)
                            : await odrzucOfertePomocySasiedzkiej(w.id, notatka);
                        if ("blad" in wynik) {
                          ustawBlad(wynik.blad);
                          return;
                        }
                        ustawOdrzucId(null);
                        router.refresh();
                      });
                    }}
                  >
                    Potwierdź odrzucenie
                  </button>
                  <button
                    type="button"
                    className="text-xs text-stone-600 underline"
                    onClick={() => ustawOdrzucId(null)}
                  >
                    Anuluj
                  </button>
                </div>
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      <PasekMasowychAkcji
        liczbaZaznaczonych={zaznaczoneRynek.size}
        etykietaAkcji="Zatwierdź zaznaczone ogłoszenia"
        onZatwierdz={async () => {
          const w = await zatwierdzRynekMasowoSoltys(Array.from(zaznaczoneRynek));
          if ("blad" in w) return { blad: w.blad };
          return { zatwierdzono: w.zatwierdzono, pominieto: w.pominieto };
        }}
        onPoSukcesie={() => {
          ustawZaznaczoneRynek(new Set());
          router.refresh();
        }}
      />
    </section>
  );
}
