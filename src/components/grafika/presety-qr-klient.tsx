"use client";

import { useState } from "react";
import { PRESETY_QR_GRAFIKI, originStronyGrafiki } from "@/lib/grafika/qr-presety";

type Props = {
  sciezkaWsi: string;
  qrUrl: string;
  onUstawQr: (url: string) => void;
};

export function PresetyQrKlient({ sciezkaWsi, qrUrl, onUstawQr }: Props) {
  const [linkAnkiety, ustawLinkAnkiety] = useState("");

  const zastosuj = (presetId: string) => {
    const preset = PRESETY_QR_GRAFIKI.find((p) => p.id === presetId);
    if (!preset) return;
    const url = preset.budujUrl({
      sciezkaWsi,
      origin: originStronyGrafiki(),
      linkAnkiety,
    });
    if (!url) {
      if (presetId === "ankieta") {
        alert("Wklej adres formularza (Google Forms) w polu poniżej, potem kliknij ponownie.");
      }
      return;
    }
    onUstawQr(url);
  };

  return (
    <div className="mt-3 space-y-2 border-t border-stone-200 pt-3">
      <p className="text-xs font-medium text-stone-700">Szybkie presety kodu QR</p>
      <div className="flex flex-wrap gap-1.5">
        {PRESETY_QR_GRAFIKI.map((p) => (
          <button
            key={p.id}
            type="button"
            title={p.opis}
            onClick={() => zastosuj(p.id)}
            className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] text-stone-800 hover:bg-green-100 hover:text-green-900"
          >
            {p.etykieta}
          </button>
        ))}
      </div>
      <label className="block text-xs text-stone-600">
        Link do ankiety (Google / Microsoft Forms)
        <input
          type="url"
          value={linkAnkiety}
          onChange={(e) => ustawLinkAnkiety(e.target.value)}
          placeholder="https://forms.google.com/…"
          className="mt-1 w-full rounded border border-stone-300 px-2 py-1 text-xs"
        />
      </label>
      {qrUrl ? (
        <p className="truncate text-[10px] text-stone-500" title={qrUrl}>
          Aktywny QR: {qrUrl}
        </p>
      ) : null}
    </div>
  );
}
