"use client";

import { useState, useTransition } from "react";
import {
  TYPY_POWIADOMIEN_PREFERENCJE,
  domyslnePreferencje,
  type CzestotliwoscPowiadomienia,
  type PreferencjaPowiadomieniaWiersz,
} from "@/lib/powiadomienia/typy-powiadomien-preferences";
import { zapiszPreferencjePowiadomien } from "./akcje-preferencje";

const OPCJE: { value: CzestotliwoscPowiadomienia; label: string }[] = [
  { value: "natychmiast", label: "Natychmiast" },
  { value: "digest_dzienny", label: "Podsumowanie dziennie (20:00)" },
  { value: "digest_tygodniowy", label: "Podsumowanie tygodniowe" },
  { value: "wylaczone", label: "Wyłączone" },
];

type Props = {
  zapisane: PreferencjaPowiadomieniaWiersz[];
};

export function PreferencjePowiadomienKlient({ zapisane }: Props) {
  const domyslne = domyslnePreferencje();
  const mapaZapisanych = new Map(zapisane.map((z) => [z.typ_powiadomienia, z]));

  const [prefs, ustawPrefs] = useState(() =>
    domyslne.map((d) => {
      const z = mapaZapisanych.get(d.typ_powiadomienia);
      return z ?? d;
    }),
  );
  const [komunikat, ustawKomunikat] = useState("");
  const [blad, ustawBlad] = useState("");
  const [czek, startT] = useTransition();

  function zmien(
    idx: number,
    pole: "kanal_push" | "kanal_email" | "kanal_sms",
    wartosc: CzestotliwoscPowiadomienia,
  ) {
    ustawPrefs((p) => p.map((row, i) => (i === idx ? { ...row, [pole]: wartosc } : row)));
  }

  function zapisz() {
    ustawBlad("");
    ustawKomunikat("");
    startT(async () => {
      const w = await zapiszPreferencjePowiadomien(prefs);
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawKomunikat("Preferencje zapisane.");
    });
  }

  return (
    <section className="mt-8 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="font-serif text-lg text-green-950">Preferencje powiadomień</h2>
      <p className="mt-1 text-sm text-stone-600">
        Wybierz, jak chcesz otrzymywać wiadomości z portalu. Powiadomienia w aplikacji zawsze trafiają do skrzynki
        powyżej.
      </p>

      <div className="mt-4 space-y-4">
        {TYPY_POWIADOMIEN_PREFERENCJE.map((typ, idx) => {
          const row = prefs[idx];
          if (!row) return null;
          return (
            <div key={typ.klucz} className="rounded-xl border border-stone-100 bg-stone-50/50 p-3">
              <p className="font-medium text-stone-900">{typ.etykieta}</p>
              <p className="text-xs text-stone-500">{typ.opis}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block text-xs">
                  <span className="font-medium text-stone-700">Push (telefon / przeglądarka)</span>
                  <select
                    className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-sm"
                    value={row.kanal_push}
                    onChange={(e) => zmien(idx, "kanal_push", e.target.value as CzestotliwoscPowiadomienia)}
                  >
                    {OPCJE.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs">
                  <span className="font-medium text-stone-700">E-mail</span>
                  <select
                    className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-sm"
                    value={row.kanal_email}
                    onChange={(e) => zmien(idx, "kanal_email", e.target.value as CzestotliwoscPowiadomienia)}
                  >
                    {OPCJE.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          );
        })}
      </div>

      {blad ? <p className="mt-3 text-sm text-red-800">{blad}</p> : null}
      {komunikat ? <p className="mt-3 text-sm text-green-800">{komunikat}</p> : null}

      <button type="button" disabled={czek} onClick={zapisz} className="btn-panel-primary mt-4">
        {czek ? "Zapisuję…" : "Zapisz preferencje"}
      </button>
    </section>
  );
}
