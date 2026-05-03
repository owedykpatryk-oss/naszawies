"use client";

import { useMemo, useState } from "react";

export type RynekOfertaPubliczna = {
  id: string;
  title: string;
  listing_type: string;
  category: string | null;
  location_text: string | null;
  price_amount: number | null;
  currency: string | null;
  published_at: string | null;
  created_at: string;
};

const opcjeTypu = [
  { value: "wszystkie", label: "Wszystkie" },
  { value: "sprzedam", label: "Sprzedam" },
  { value: "kupie", label: "Kupię" },
  { value: "oddam", label: "Oddam" },
  { value: "usluga", label: "Usługa" },
  { value: "praca", label: "Praca" },
] as const;

export function MarketplaceListaKlient({ oferty }: { oferty: RynekOfertaPubliczna[] }) {
  const [fraza, setFraza] = useState("");
  const [typ, setTyp] = useState<(typeof opcjeTypu)[number]["value"]>("wszystkie");

  const przefiltrowane = useMemo(() => {
    const q = fraza.trim().toLowerCase();
    return oferty.filter((o) => {
      if (typ !== "wszystkie" && o.listing_type !== typ) return false;
      if (!q) return true;
      const haystack = [o.title, o.category, o.location_text].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [fraza, oferty, typ]);

  return (
    <div className="mt-4">
      <div className="grid gap-2 rounded-xl border border-stone-200 bg-stone-50 p-3 sm:grid-cols-[2fr,1fr]">
        <input
          value={fraza}
          onChange={(e) => setFraza(e.target.value)}
          placeholder="Szukaj po tytule, kategorii lub miejscu..."
          className="rounded border border-stone-300 bg-white px-3 py-2 text-sm"
        />
        <select
          value={typ}
          onChange={(e) => setTyp(e.target.value as (typeof opcjeTypu)[number]["value"])}
          className="rounded border border-stone-300 bg-white px-3 py-2 text-sm"
        >
          {opcjeTypu.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {przefiltrowane.length === 0 ? (
        <p className="mt-3 text-sm text-stone-500">Brak ofert spełniających kryteria wyszukiwania.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {przefiltrowane.map((o) => (
            <li key={o.id} className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
              <p className="font-medium text-stone-900">{o.title}</p>
              <p className="mt-1 text-xs text-stone-600">
                {o.listing_type}
                {o.category ? ` · ${o.category}` : ""}
                {o.location_text ? ` · ${o.location_text}` : ""}
              </p>
              <p className="mt-1 text-xs text-stone-500">
                {o.price_amount != null ? `${o.price_amount} ${o.currency ?? "PLN"}` : "Cena do ustalenia"} ·{" "}
                {new Date(o.published_at ?? o.created_at).toLocaleDateString("pl-PL")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
