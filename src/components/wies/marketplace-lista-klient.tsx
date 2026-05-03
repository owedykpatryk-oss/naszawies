"use client";

import Link from "next/link";
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
  { value: "wszystkie", label: "Wszystkie typy" },
  { value: "sprzedam", label: "Sprzedam" },
  { value: "kupie", label: "Kupię" },
  { value: "oddam", label: "Oddam" },
  { value: "usluga", label: "Usługa" },
  { value: "praca", label: "Praca" },
] as const;

const szablonyTytulow: { value: string; label: string }[] = [
  { value: "", label: "Dowolny tytuł" },
  { value: "sprzedam", label: "Szablon: Sprzedam …" },
  { value: "oddam", label: "Szablon: Oddam …" },
  { value: "usluga", label: "Szablon: Oferuję usługę …" },
  { value: "praca", label: "Szablon: Praca / zlecenie …" },
];

export function MarketplaceListaKlient({
  oferty,
  kotwicaZasadSwietlicy,
}: {
  oferty: RynekOfertaPubliczna[];
  /** Kotwica do sekcji świetlica / zasady na profilu wsi (np. `/wies/.../wies-slug#swietlica-regulamin`). */
  kotwicaZasadSwietlicy?: string;
}) {
  const [fraza, setFraza] = useState("");
  const [typ, setTyp] = useState<(typeof opcjeTypu)[number]["value"]>("wszystkie");
  const [kategoria, setKategoria] = useState("wszystkie");
  const [sortowanie, setSortowanie] = useState<"najnowsze" | "najstarsze">("najnowsze");
  const [szablonPodpowiedz, setSzablonPodpowiedz] = useState("");

  const kategorieUnikalne = useMemo(() => {
    const z = new Set<string>();
    for (const o of oferty) {
      if (o.category && o.category.trim()) z.add(o.category.trim());
    }
    return Array.from(z).sort((a, b) => a.localeCompare(b, "pl"));
  }, [oferty]);

  const przefiltrowane = useMemo(() => {
    const q = fraza.trim().toLowerCase();
    let rows = oferty.filter((o) => {
      if (typ !== "wszystkie" && o.listing_type !== typ) return false;
      if (kategoria !== "wszystkie" && (o.category ?? "").trim() !== kategoria) return false;
      if (!q) return true;
      const haystack = [o.title, o.category, o.location_text].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(q);
    });
    rows = [...rows].sort((a, b) => {
      const ta = Date.parse(a.published_at ?? a.created_at) || 0;
      const tb = Date.parse(b.published_at ?? b.created_at) || 0;
      return sortowanie === "najnowsze" ? tb - ta : ta - tb;
    });
    return rows;
  }, [fraza, oferty, typ, kategoria, sortowanie]);

  return (
    <div className="mt-4">
      <div className="grid gap-2 rounded-xl border border-stone-200 bg-stone-50 p-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          value={fraza}
          onChange={(e) => setFraza(e.target.value)}
          placeholder="Szukaj po tytule, kategorii lub miejscu..."
          className="rounded border border-stone-300 bg-white px-3 py-2 text-sm sm:col-span-2 lg:col-span-1"
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
        <select
          value={kategoria}
          onChange={(e) => setKategoria(e.target.value)}
          className="rounded border border-stone-300 bg-white px-3 py-2 text-sm"
        >
          <option value="wszystkie">Wszystkie kategorie</option>
          {kategorieUnikalne.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <select
          value={sortowanie}
          onChange={(e) => setSortowanie(e.target.value as "najnowsze" | "najstarsze")}
          className="rounded border border-stone-300 bg-white px-3 py-2 text-sm"
        >
          <option value="najnowsze">Sortuj: najnowsze</option>
          <option value="najstarsze">Sortuj: najstarsze</option>
        </select>
      </div>

      <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2 text-xs text-stone-700">
        <span className="font-medium text-stone-800">Szablony tytułów (podpowiedź przy dodawaniu oferty w panelu):</span>{" "}
        <select
          value={szablonPodpowiedz}
          onChange={(e) => setSzablonPodpowiedz(e.target.value)}
          className="ml-1 mt-1 max-w-full rounded border border-stone-300 bg-white px-2 py-1 text-xs sm:ml-2 sm:mt-0"
        >
          {szablonyTytulow.map((s) => (
            <option key={s.value || "x"} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        {szablonPodpowiedz ? (
          <span className="mt-1 block text-stone-600">
            {szablonPodpowiedz === "sprzedam" ? "Np. „Sprzedam rower dziecięcy — dobry stan, Studzienki”." : null}
            {szablonPodpowiedz === "oddam" ? "Np. „Oddam meble kuchenne — odbiór osobisty”." : null}
            {szablonPodpowiedz === "usluga" ? "Np. „Oferuję koszenie trawy — okolice wsi”." : null}
            {szablonPodpowiedz === "praca" ? "Np. „Zlecenie remontu drobnego w świetlicy”." : null}
          </span>
        ) : null}
        {kotwicaZasadSwietlicy ? (
          <p className="mt-2 border-t border-amber-200/80 pt-2">
            <Link href={kotwicaZasadSwietlicy} className="text-green-800 underline">
              Zasady świetlicy i rezerwacji
            </Link>{" "}
            — ogłoszenia na rynku są bezpłatne; wynajem sali ustala sołtys poza płatnościami w serwisie.
          </p>
        ) : (
          <p className="mt-2 border-t border-amber-200/80 pt-2 text-stone-600">
            Oferty są ogłoszeniowe — bez płatności online w modelu naszawies.pl.
          </p>
        )}
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
