"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  GRUPY_KATEGORII_RYNKU,
  TYPY_OGLOSZEN,
  czyKategoriaProduktuLokalnego,
} from "@/lib/marketplace/kategorie-ogloszen";
import {
  KartaOgloszeniaRynek,
  PasekAkcjiRynku,
} from "@/components/wies/rynek-ui";

export type RynekOfertaPubliczna = {
  id: string;
  title: string;
  listing_type: string;
  category: string | null;
  equipment_category?: string | null;
  location_text: string | null;
  price_amount: number | null;
  price_unit?: string | null;
  currency: string | null;
  with_operator?: boolean | null;
  seller_verified?: boolean | null;
  image_urls?: string[] | null;
  published_at: string | null;
  created_at: string;
};

const opcjeTypu = [{ value: "wszystkie", label: "Wszystkie typy" }, ...TYPY_OGLOSZEN.map((t) => ({ value: t.value, label: t.label }))];

const SZYBKIE_KATEGORIE = [
  { value: "miod", label: "Miód" },
  { value: "sery_nabial", label: "Sery" },
  { value: "warzywa_owoce", label: "Warzywa" },
  { value: "ciagnik", label: "Ciągnik" },
  { value: "usluga_z_operatorem", label: "Z operatorem" },
] as const;

function liczbaAktywnychFiltrow(st: {
  fraza: string;
  typ: string;
  kategoria: string;
  tylkoZOperatorem: boolean;
  tylkoProduktyLokalne: boolean;
  tylkoZweryfikowane: boolean;
}) {
  let n = 0;
  if (st.fraza.trim()) n++;
  if (st.typ !== "wszystkie") n++;
  if (st.kategoria !== "wszystkie") n++;
  if (st.tylkoZOperatorem) n++;
  if (st.tylkoProduktyLokalne) n++;
  if (st.tylkoZweryfikowane) n++;
  return n;
}

export function MarketplaceListaKlient({
  oferty,
  sciezkaWsi,
  kotwicaZasadSwietlicy,
  pokazLinkWszystkie = true,
  limitWyswietlania,
  tryb,
}: {
  oferty: RynekOfertaPubliczna[];
  sciezkaWsi: string;
  kotwicaZasadSwietlicy?: string;
  /** Gdy false — jesteś już na stronie pełnej listy. */
  pokazLinkWszystkie?: boolean;
  limitWyswietlania?: number;
  /** skrot — na profilu wsi; pelny — strona /rynek z siatką kart */
  tryb?: "skrot" | "pelny";
}) {
  const uklad = tryb ?? (pokazLinkWszystkie ? "skrot" : "pelny");

  const [fraza, setFraza] = useState("");
  const [typ, setTyp] = useState("wszystkie");
  const [kategoria, setKategoria] = useState("wszystkie");
  const [tylkoZOperatorem, setTylkoZOperatorem] = useState(false);
  const [tylkoProduktyLokalne, setTylkoProduktyLokalne] = useState(false);
  const [sortowanie, setSortowanie] = useState<"najnowsze" | "najstarsze" | "polecane">("najnowsze");
  const [tylkoZweryfikowane, setTylkoZweryfikowane] = useState(false);
  const [filtryOtwarte, setFiltryOtwarte] = useState(uklad === "pelny");

  const aktywneFiltry = liczbaAktywnychFiltrow({
    fraza,
    typ,
    kategoria,
    tylkoZOperatorem,
    tylkoProduktyLokalne,
    tylkoZweryfikowane,
  });

  const wyczyscFiltry = () => {
    setFraza("");
    setTyp("wszystkie");
    setKategoria("wszystkie");
    setTylkoZOperatorem(false);
    setTylkoProduktyLokalne(false);
    setTylkoZweryfikowane(false);
    setSortowanie("najnowsze");
  };

  const przefiltrowane = useMemo(() => {
    const q = fraza.trim().toLowerCase();
    let rows = oferty.filter((o) => {
      const kat = o.equipment_category ?? o.category ?? "";
      if (typ !== "wszystkie" && o.listing_type !== typ) return false;
      if (kategoria !== "wszystkie" && kat !== kategoria) return false;
      if (tylkoZOperatorem && !o.with_operator) return false;
      if (tylkoZweryfikowane && !o.seller_verified) return false;
      if (tylkoProduktyLokalne && !czyKategoriaProduktuLokalnego(kat)) return false;
      if (!q) return true;
      const haystack = [o.title, kat, o.location_text, o.listing_type].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(q);
    });
    rows = [...rows].sort((a, b) => {
      if (sortowanie === "polecane") {
        const va = a.seller_verified ? 1 : 0;
        const vb = b.seller_verified ? 1 : 0;
        if (vb !== va) return vb - va;
      }
      const ta = Date.parse(a.published_at ?? a.created_at) || 0;
      const tb = Date.parse(b.published_at ?? b.created_at) || 0;
      return sortowanie === "najstarsze" ? ta - tb : tb - ta;
    });
    if (limitWyswietlania != null) rows = rows.slice(0, limitWyswietlania);
    return rows;
  }, [fraza, oferty, typ, kategoria, tylkoZOperatorem, tylkoProduktyLokalne, tylkoZweryfikowane, sortowanie, limitWyswietlania]);

  const etykietaAktywnejKategorii =
    kategoria !== "wszystkie"
      ? SZYBKIE_KATEGORIE.find((s) => s.value === kategoria)?.label ??
        GRUPY_KATEGORII_RYNKU.flatMap((g) => g.items).find((i) => i.value === kategoria)?.label ??
        kategoria
      : null;

  return (
    <div className={uklad === "skrot" ? "mt-4" : "mt-6 space-y-4"}>
      {uklad === "skrot" ? (
        <p className="rounded-xl border border-orange-100/80 bg-orange-50/40 px-3 py-2.5 text-xs leading-relaxed text-stone-700">
          Zalogowani mieszkańcy mogą napisać wiadomość przy ogłoszeniu. Ogłoszenia wygasają automatycznie — przedłuż je w
          panelu.
        </p>
      ) : null}

      <div className="rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 px-3 py-2.5 sm:px-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltryOtwarte((v) => !v)}
              className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-800 hover:bg-stone-50"
              aria-expanded={filtryOtwarte}
            >
              {filtryOtwarte ? "Ukryj filtry" : "Filtry i sortowanie"}
              {aktywneFiltry > 0 ? (
                <span className="ml-1.5 rounded-full bg-orange-200 px-1.5 py-0.5 text-xs font-semibold text-orange-950">
                  {aktywneFiltry}
                </span>
              ) : null}
            </button>
            {aktywneFiltry > 0 ? (
              <button type="button" onClick={wyczyscFiltry} className="text-xs text-stone-600 underline hover:text-stone-900">
                Wyczyść filtry
              </button>
            ) : null}
          </div>
          <p className="text-xs text-stone-500">
            <span className="font-medium text-stone-800">{przefiltrowane.length}</span>{" "}
            {przefiltrowane.length === 1 ? "ogłoszenie" : "ogłoszeń"}
            {oferty.length !== przefiltrowane.length ? ` z ${oferty.length}` : ""}
          </p>
        </div>

        {filtryOtwarte ? (
          <div className="space-y-3 p-3 sm:p-4">
            <input
              value={fraza}
              onChange={(e) => setFraza(e.target.value)}
              placeholder="Szukaj: miód, sery, ciągnik, kombajn…"
              className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
            />

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <select
                value={typ}
                onChange={(e) => setTyp(e.target.value)}
                className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm"
              >
                {opcjeTypu.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <select
                value={kategoria}
                onChange={(e) => setKategoria(e.target.value)}
                className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm"
              >
                <option value="wszystkie">Wszystkie kategorie</option>
                {GRUPY_KATEGORII_RYNKU.map((grupa) => (
                  <optgroup key={grupa.id} label={grupa.label}>
                    {grupa.items.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <select
                value={sortowanie}
                onChange={(e) => setSortowanie(e.target.value as "najnowsze" | "najstarsze" | "polecane")}
                className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm"
              >
                <option value="najnowsze">Najnowsze</option>
                <option value="polecane">Polecane (zweryfikowane)</option>
                <option value="najstarsze">Najstarsze</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-stone-800">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={tylkoZweryfikowane}
                  onChange={(e) => setTylkoZweryfikowane(e.target.checked)}
                  className="accent-green-800"
                />
                Tylko zweryfikowani
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={tylkoProduktyLokalne}
                  onChange={(e) => setTylkoProduktyLokalne(e.target.checked)}
                  className="accent-green-800"
                />
                Produkty z gospodarstwa
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={tylkoZOperatorem}
                  onChange={(e) => setTylkoZOperatorem(e.target.checked)}
                  className="accent-green-800"
                />
                Tylko z operatorem
              </label>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {SZYBKIE_KATEGORIE.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setKategoria(kategoria === s.value ? "wszystkie" : s.value)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                    kategoria === s.value
                      ? "border-orange-500 bg-orange-100 text-orange-950"
                      : "border-stone-300 bg-stone-50 text-stone-700 hover:bg-white"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {aktywneFiltry > 0 && !filtryOtwarte ? (
          <div className="flex flex-wrap gap-1.5 border-t border-stone-100 px-3 py-2 sm:px-4">
            {fraza.trim() ? (
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-700">„{fraza.trim()}”</span>
            ) : null}
            {etykietaAktywnejKategorii ? (
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-950">{etykietaAktywnejKategorii}</span>
            ) : null}
            {tylkoZweryfikowane ? (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-900">Zweryfikowani</span>
            ) : null}
          </div>
        ) : null}
      </div>

      <PasekAkcjiRynku
        sciezkaWsi={sciezkaWsi}
        kotwicaZasadSwietlicy={kotwicaZasadSwietlicy}
        pokazLinkWszystkie={pokazLinkWszystkie}
        liczbaOgloszen={oferty.length}
      />

      {przefiltrowane.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 px-4 py-10 text-center">
          <p className="text-sm font-medium text-stone-800">Brak ogłoszeń dla wybranych filtrów</p>
          <p className="mt-1 text-xs text-stone-500">Spróbuj zmienić kryteria albo wyczyść filtry.</p>
          {aktywneFiltry > 0 ? (
            <button type="button" onClick={wyczyscFiltry} className="mt-3 text-sm font-medium text-green-800 underline">
              Wyczyść filtry
            </button>
          ) : null}
        </div>
      ) : uklad === "pelny" ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {przefiltrowane.map((o) => (
            <li key={o.id} className="min-h-0">
              <KartaOgloszeniaRynek oferta={o} href={`${sciezkaWsi}/rynek/${o.id}`} uklad="siatka" />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="space-y-3">
          {przefiltrowane.map((o) => (
            <li key={o.id}>
              <KartaOgloszeniaRynek oferta={o} href={`${sciezkaWsi}/rynek/${o.id}`} uklad="lista" />
            </li>
          ))}
        </ul>
      )}

      {uklad === "skrot" && pokazLinkWszystkie && oferty.length > (limitWyswietlania ?? 8) ? (
        <p className="text-center">
          <Link href={`${sciezkaWsi}/rynek`} className="text-sm font-medium text-green-800 underline">
            Zobacz pełną listę ogłoszeń →
          </Link>
        </p>
      ) : null}
    </div>
  );
}
