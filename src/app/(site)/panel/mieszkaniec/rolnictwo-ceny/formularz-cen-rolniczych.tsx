"use client";

import { useState, useTransition } from "react";
import {
  ETYKIETY_KATEGORII_PRODUKTU,
  PRODUKTY_LOKALNE,
  etykietaProduktuLokalnego,
  type KategoriaProduktuLokalnego,
} from "@/lib/ceny/produkty-lokalne";
import { potwierdzCeneSkupuLokalna, zglosCeneSkupuLokalna } from "@/app/(site)/panel/mieszkaniec/akcje-rolnictwo";

type WiesOpcja = { id: string; name: string };

const KATEGORIE: KategoriaProduktuLokalnego[] = ["rolne", "opal", "paliwa", "inne"];

export function FormularzCenRolniczych({
  wioski,
  raporty,
}: {
  wioski: WiesOpcja[];
  raporty: {
    id: string;
    village_id: string;
    product_key: string;
    price_value: number;
    price_unit: string;
    place_name: string;
    confirmation_count: number;
    reported_by: string;
  }[];
  userId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [komunikat, setKomunikat] = useState<string | null>(null);
  const [villageId, setVillageId] = useState(wioski[0]?.id ?? "");
  const [productKey, setProductKey] = useState(PRODUKTY_LOKALNE[0]?.key ?? "pszenica");
  const [priceValue, setPriceValue] = useState("");
  const [placeName, setPlaceName] = useState("");
  const [notes, setNotes] = useState("");

  function zglos() {
    setKomunikat(null);
    const val = Number.parseFloat(priceValue.replace(",", "."));
    if (!villageId || !placeName.trim() || !Number.isFinite(val)) {
      setKomunikat("Uzupełnij wieś, miejsce i cenę.");
      return;
    }
    startTransition(async () => {
      const w = await zglosCeneSkupuLokalna({
        villageId,
        productKey,
        priceValue: val,
        placeName: placeName.trim(),
        notes: notes.trim() || null,
      });
      if ("blad" in w) setKomunikat(w.blad);
      else {
        setKomunikat("Zgłoszenie zapisane. Inni mieszkańcy mogą je potwierdzić.");
        setPriceValue("");
        setNotes("");
      }
    });
  }

  function potwierdz(id: string) {
    setKomunikat(null);
    startTransition(async () => {
      const w = await potwierdzCeneSkupuLokalna({ priceReportId: id });
      setKomunikat("blad" in w ? w.blad : "Dziękujemy za potwierdzenie.");
    });
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">Zgłoś cenę lokalną</h2>
        <p className="mt-1 text-sm text-stone-600">
          Skup zboża, pellet, węgiel, drewno, AdBlue — podaj ile zapłaciłeś i gdzie. Inni mieszkańcy mogą
          potwierdzić (ceny paliw na stacjach aktualizują się automatycznie na profilu wsi).
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-stone-700">Wieś</span>
            <select
              className="w-full rounded-lg border border-stone-300 px-3 py-2"
              value={villageId}
              onChange={(e) => setVillageId(e.target.value)}
            >
              {wioski.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-stone-700">Produkt</span>
            <select
              className="w-full rounded-lg border border-stone-300 px-3 py-2"
              value={productKey}
              onChange={(e) => setProductKey(e.target.value)}
            >
              {KATEGORIE.map((kat) => {
                const lista = PRODUKTY_LOKALNE.filter((p) => p.kategoria === kat);
                if (lista.length === 0) return null;
                return (
                  <optgroup key={kat} label={ETYKIETY_KATEGORII_PRODUKTU[kat]}>
                    {lista.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.label} ({p.jednostka})
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-stone-700">Cena</span>
            <input
              type="text"
              inputMode="decimal"
              className="w-full rounded-lg border border-stone-300 px-3 py-2"
              value={priceValue}
              onChange={(e) => setPriceValue(e.target.value)}
              placeholder="np. 1450"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-stone-700">Miejsce (skup, skład, stacja)</span>
            <input
              type="text"
              className="w-full rounded-lg border border-stone-300 px-3 py-2"
              value={placeName}
              onChange={(e) => setPlaceName(e.target.value)}
              placeholder="np. Skład opału w Nakle"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-stone-700">Uwagi (wilgotność, klasa, sortyment)</span>
            <input
              type="text"
              className="w-full rounded-lg border border-stone-300 px-3 py-2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={zglos}
          className="mt-4 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          Zgłoś cenę
        </button>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">Potwierdź cenę sąsiada</h2>
        {raporty.length === 0 ? (
          <p className="mt-2 text-sm text-stone-600">Brak zgłoszeń do potwierdzenia.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {raporty.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <div className="text-sm text-stone-800">
                  <strong>
                    {etykietaProduktuLokalnego(r.product_key)} — {r.price_value} {r.price_unit}
                  </strong>{" "}
                  @ {r.place_name}
                  <span className="text-stone-500"> ({r.confirmation_count} potwierdzeń)</span>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => potwierdz(r.id)}
                  className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-50 disabled:opacity-60"
                >
                  Też tak zapłaciłem
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {komunikat && <p className="text-sm text-stone-700">{komunikat}</p>}
    </div>
  );
}
