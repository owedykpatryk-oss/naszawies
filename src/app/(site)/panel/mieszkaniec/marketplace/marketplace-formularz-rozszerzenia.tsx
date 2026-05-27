"use client";

import { WyborPunktuMapyKlient } from "@/components/zgloszenia/wybor-punktu-mapy-klient";
import { czyKategoriaProduktuLokalnego } from "@/lib/marketplace/kategorie-ogloszen";

export type PoiOpcja = { id: string; name: string; category: string; village_id: string };

export type WartosciRozszerzone = {
  latitude: number | null;
  longitude: number | null;
  pickupInVillage: boolean;
  deliveryRadiusKm: number | null;
  seasonalNote: string;
  productProducedAt: string;
  productBestBefore: string;
  isOrganic: boolean;
  allergensText: string;
  salesPoiId: string | null;
};

type Props = {
  kat: string;
  pois: PoiOpcja[];
  wartosci: WartosciRozszerzone;
  onChange: (v: WartosciRozszerzone) => void;
};

export function MarketplaceFormularzRozszerzenia({ kat, pois, wartosci, onChange }: Props) {
  const pokazJedzenie = czyKategoriaProduktuLokalnego(kat);
  const poisWsi = pois.filter(() => true);

  return (
    <div className="space-y-4 border-t border-stone-200 pt-4">
      <p className="text-sm font-medium text-stone-800">Logistyka i lokalizacja</p>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={wartosci.pickupInVillage}
            onChange={(e) => onChange({ ...wartosci, pickupInVillage: e.target.checked })}
            className="accent-green-800"
          />
          Odbiór osobisty we wsi
        </label>
        <label className="text-sm">
          Dowóz (km, opcjonalnie)
          <input
            type="number"
            min={0}
            max={150}
            step={1}
            value={wartosci.deliveryRadiusKm ?? ""}
            onChange={(e) =>
              onChange({
                ...wartosci,
                deliveryRadiusKm: e.target.value === "" ? null : Number(e.target.value),
              })
            }
            className="mt-1 block w-24 rounded border border-stone-300 px-2 py-1"
          />
        </label>
      </div>
      <label className="block text-sm">
        Sezon / dostępność
        <input
          value={wartosci.seasonalNote}
          onChange={(e) => onChange({ ...wartosci, seasonalNote: e.target.value })}
          placeholder="np. dostępne od maja, tylko sezon letni"
          maxLength={200}
          className="mt-1 block w-full"
        />
      </label>
      {poisWsi.length > 0 ? (
        <label className="block text-sm">
          Stały punkt sprzedaży (z mapy wsi)
          <select
            value={wartosci.salesPoiId ?? ""}
            onChange={(e) => onChange({ ...wartosci, salesPoiId: e.target.value || null })}
            className="mt-1 block w-full max-w-md"
          >
            <option value="">— brak —</option>
            {poisWsi.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.category})
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <WyborPunktuMapyKlient
        domyslnaLat={wartosci.latitude}
        domyslnaLng={wartosci.longitude}
        onChange={(lat, lng) => onChange({ ...wartosci, latitude: lat, longitude: lng })}
      />

      {pokazJedzenie ? (
        <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-3">
          <p className="text-sm font-medium text-amber-950">Produkt spożywczy (opcjonalnie)</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <label className="text-sm">
              Data produkcji / zbioru
              <input
                type="date"
                value={wartosci.productProducedAt}
                onChange={(e) => onChange({ ...wartosci, productProducedAt: e.target.value })}
                className="mt-1 block w-full"
              />
            </label>
            <label className="text-sm">
              Najlepiej spożyć do
              <input
                type="date"
                value={wartosci.productBestBefore}
                onChange={(e) => onChange({ ...wartosci, productBestBefore: e.target.value })}
                className="mt-1 block w-full"
              />
            </label>
          </div>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={wartosci.isOrganic}
              onChange={(e) => onChange({ ...wartosci, isOrganic: e.target.checked })}
              className="accent-green-800"
            />
            Produkcja ekologiczna / certyfikat
          </label>
          <label className="mt-2 block text-sm">
            Alergeny / skład (opcjonalnie)
            <textarea
              value={wartosci.allergensText}
              onChange={(e) => onChange({ ...wartosci, allergensText: e.target.value })}
              rows={2}
              maxLength={500}
              placeholder="np. zawiera gluten, mleko…"
              className="mt-1 block w-full"
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}
