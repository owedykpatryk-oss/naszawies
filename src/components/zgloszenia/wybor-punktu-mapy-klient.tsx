"use client";

import { useEffect, useState } from "react";

type Props = {
  domyslnaLat?: number | null;
  domyslnaLng?: number | null;
  onChange: (lat: number | null, lng: number | null) => void;
};

/** Prosty wybór współrzędnych (bez zewnętrznego API map — działa offline). */
export function WyborPunktuMapyKlient({ domyslnaLat, domyslnaLng, onChange }: Props) {
  const startLat = domyslnaLat ?? 52.1;
  const startLng = domyslnaLng ?? 19.4;
  const [lat, ustawLat] = useState(String(startLat));
  const [lng, ustawLng] = useState(String(startLng));
  const [wlacz, ustawWlacz] = useState(false);

  useEffect(() => {
    if (!wlacz) {
      onChange(null, null);
      return;
    }
    const la = parseFloat(lat.replace(",", "."));
    const ln = parseFloat(lng.replace(",", "."));
    if (Number.isFinite(la) && Number.isFinite(ln) && la >= -90 && la <= 90 && ln >= -180 && ln <= 180) {
      onChange(la, ln);
    } else {
      onChange(null, null);
    }
  }, [wlacz, lat, lng, onChange]);

  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50/60 p-3">
      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-stone-800">
        <input
          type="checkbox"
          checked={wlacz}
          onChange={() => ustawWlacz((v) => !v)}
          className="accent-green-800"
        />
        Zaznacz punkt na mapie (współrzędne GPS)
      </label>
      {wlacz ? (
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div>
            <label className="mb-0.5 block text-xs text-stone-600" htmlFor="zgl-lat">
              Szerokość (lat)
            </label>
            <input
              id="zgl-lat"
              type="text"
              inputMode="decimal"
              value={lat}
              onChange={(e) => ustawLat(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="mb-0.5 block text-xs text-stone-600" htmlFor="zgl-lng">
              Długość (lng)
            </label>
            <input
              id="zgl-lng"
              type="text"
              inputMode="decimal"
              value={lng}
              onChange={(e) => ustawLng(e.target.value)}
              className="w-full"
            />
          </div>
          <p className="sm:col-span-2 text-xs text-stone-500">
            Wskazówka: w Google Maps przytrzymaj punkt → skopiuj współrzędne. Opcjonalne — przyspiesza lokalizację
            problemu.
          </p>
        </div>
      ) : null}
    </div>
  );
}
