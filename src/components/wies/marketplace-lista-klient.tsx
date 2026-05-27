"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  GRUPY_KATEGORII_RYNKU,
  TYPY_OGLOSZEN,
  czyKategoriaProduktuLokalnego,
  etykietaJednostkiCeny,
  etykietaKategoriiOgloszenia,
  etykietaTypuOgloszenia,
} from "@/lib/marketplace/kategorie-ogloszen";

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

const opcjeKategorii = [{ value: "wszystkie", label: "Wszystkie kategorie" }];

export function MarketplaceListaKlient({
  oferty,
  sciezkaWsi,
  kotwicaZasadSwietlicy,
  pokazLinkWszystkie = true,
  limitWyswietlania,
}: {
  oferty: RynekOfertaPubliczna[];
  sciezkaWsi: string;
  kotwicaZasadSwietlicy?: string;
  /** Gdy false — jesteś już na stronie pełnej listy. */
  pokazLinkWszystkie?: boolean;
  limitWyswietlania?: number;
}) {
  const [fraza, setFraza] = useState("");
  const [typ, setTyp] = useState("wszystkie");
  const [kategoria, setKategoria] = useState("wszystkie");
  const [tylkoZOperatorem, setTylkoZOperatorem] = useState(false);
  const [tylkoProduktyLokalne, setTylkoProduktyLokalne] = useState(false);
  const [sortowanie, setSortowanie] = useState<"najnowsze" | "najstarsze">("najnowsze");

  const przefiltrowane = useMemo(() => {
    const q = fraza.trim().toLowerCase();
    let rows = oferty.filter((o) => {
      const kat = o.equipment_category ?? o.category ?? "";
      if (typ !== "wszystkie" && o.listing_type !== typ) return false;
      if (kategoria !== "wszystkie" && kat !== kategoria) return false;
      if (tylkoZOperatorem && !o.with_operator) return false;
      if (tylkoProduktyLokalne && !czyKategoriaProduktuLokalnego(kat)) return false;
      if (!q) return true;
      const haystack = [o.title, kat, o.location_text, o.listing_type].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(q);
    });
    rows = [...rows].sort((a, b) => {
      const ta = Date.parse(a.published_at ?? a.created_at) || 0;
      const tb = Date.parse(b.published_at ?? b.created_at) || 0;
      return sortowanie === "najnowsze" ? tb - ta : ta - tb;
    });
    if (limitWyswietlania != null) rows = rows.slice(0, limitWyswietlania);
    return rows;
  }, [fraza, oferty, typ, kategoria, tylkoZOperatorem, tylkoProduktyLokalne, sortowanie, limitWyswietlania]);

  const maWiecejNaProfilu = pokazLinkWszystkie && oferty.length >= 8;

  return (
    <div className="mt-4">
      <div className="rounded-xl border border-orange-100 bg-orange-50/40 px-3 py-2 text-xs text-stone-700">
        <strong>Darmowy rynek lokalny</strong> — miód, sery, mięso, warzywa z gospodarstw, maszyny rolnicze, konie,
        wynajem z operatorem. Zalogowani mieszkańcy mogą napisać wiadomość przy ogłoszeniu.
      </div>

      <div className="mt-3 grid gap-2 rounded-xl border border-stone-200 bg-stone-50 p-3 sm:grid-cols-2 lg:grid-cols-3">
        <input
          value={fraza}
          onChange={(e) => setFraza(e.target.value)}
          placeholder="Szukaj: miód, sery, ciągnik, kombajn…"
          className="rounded border border-stone-300 bg-white px-3 py-2 text-sm sm:col-span-2 lg:col-span-1"
        />
        <select value={typ} onChange={(e) => setTyp(e.target.value)} className="rounded border border-stone-300 bg-white px-3 py-2 text-sm">
          {opcjeTypu.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={kategoria}
          onChange={(e) => setKategoria(e.target.value)}
          className="rounded border border-stone-300 bg-white px-3 py-2 text-sm"
        >
          {opcjeKategorii.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
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
          onChange={(e) => setSortowanie(e.target.value as "najnowsze" | "najstarsze")}
          className="rounded border border-stone-300 bg-white px-3 py-2 text-sm"
        >
          <option value="najnowsze">Najnowsze</option>
          <option value="najstarsze">Najstarsze</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-stone-800">
          <input
            type="checkbox"
            checked={tylkoProduktyLokalne}
            onChange={(e) => setTylkoProduktyLokalne(e.target.checked)}
            className="accent-green-800"
          />
          Produkty z gospodarstwa
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-800">
          <input
            type="checkbox"
            checked={tylkoZOperatorem}
            onChange={(e) => setTylkoZOperatorem(e.target.checked)}
            className="accent-green-800"
          />
          Tylko z operatorem
        </label>
      </div>

      <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-stone-600">
        {maWiecejNaProfilu ? (
          <Link href={`${sciezkaWsi}/rynek`} className="font-medium text-green-800 underline">
            Zobacz wszystkie ogłoszenia ({oferty.length}+)
          </Link>
        ) : null}
        {kotwicaZasadSwietlicy ? (
          <Link href={kotwicaZasadSwietlicy} className="text-green-800 underline">
            Zasady świetlicy
          </Link>
        ) : null}
        <Link href="/panel/mieszkaniec/marketplace" className="text-green-800 underline">
          Dodaj ogłoszenie
        </Link>
        <Link href="/panel/czat" className="text-green-800 underline">
          Wiadomości
        </Link>
      </p>

      {przefiltrowane.length === 0 ? (
        <p className="mt-3 text-sm text-stone-500">Brak ogłoszeń dla wybranych filtrów.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {przefiltrowane.map((o) => {
            const kat = o.equipment_category ?? o.category;
            const mini = o.image_urls?.[0];
            return (
              <li key={o.id}>
                <Link
                  href={`${sciezkaWsi}/rynek/${o.id}`}
                  className="flex gap-3 rounded-xl border border-stone-200 bg-white p-3 shadow-sm transition hover:border-orange-300 hover:shadow-md"
                >
                  {mini ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mini} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-[10px] text-stone-400">
                      Brak zdjęcia
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-stone-900">
                      {o.title}
                      {o.seller_verified ? (
                        <span className="ml-1 text-[10px] font-semibold text-emerald-800">✓</span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-xs text-stone-600">
                      {etykietaTypuOgloszenia(o.listing_type)}
                      {kat ? ` · ${etykietaKategoriiOgloszenia(kat)}` : ""}
                      {o.with_operator ? " · z operatorem" : ""}
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      {o.price_amount != null
                        ? `${o.price_amount} ${o.currency ?? "PLN"}${o.price_unit ? ` ${etykietaJednostkiCeny(o.price_unit)}` : ""}`
                        : "Cena do ustalenia"}
                      {o.location_text ? ` · ${o.location_text}` : ""}
                      {" · "}
                      {new Date(o.published_at ?? o.created_at).toLocaleDateString("pl-PL")}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
