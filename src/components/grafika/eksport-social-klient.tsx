"use client";

import { useState, useTransition } from "react";
import { PodgladSzablonuGrafiki } from "@/components/grafika/podglad-szablonu-grafiki";
import type { MotywGrafiki, SzablonGrafiki, WartosciPolGrafiki } from "@/lib/grafika/typy";
import {
  bezpiecznaNazwaPlikuPng,
  pobierzPngZElementuHtml,
  type FormatSocial,
  WYMIARY_SOCIAL,
} from "@/lib/grafika/eksport-social";

type Props = {
  szablon: SzablonGrafiki;
  motyw: MotywGrafiki;
  wartosci: WartosciPolGrafiki;
  logoDataUrl?: string | null;
  backgroundDataUrl?: string | null;
  qrUrl?: string | null;
  nazwaPliku: string;
};

export function EksportSocialKlient({
  szablon,
  motyw,
  wartosci,
  logoDataUrl,
  backgroundDataUrl,
  qrUrl,
  nazwaPliku,
}: Props) {
  const [blad, ustawBlad] = useState<string | null>(null);
  const [oczekuje, startTransition] = useTransition();

  const pobierz = (format: FormatSocial) => {
    ustawBlad(null);
    startTransition(async () => {
      const el = document.getElementById(`eksport-social-${format}`);
      if (!el) {
        ustawBlad("Nie znaleziono podglądu do eksportu.");
        return;
      }
      const wynik = await pobierzPngZElementuHtml(el, {
        format,
        nazwaPliku: bezpiecznaNazwaPlikuPng(nazwaPliku, format),
      });
      if (!wynik.ok) ustawBlad(wynik.komunikat);
    });
  };

  return (
    <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50/60 p-4">
      <p className="text-sm font-semibold text-sky-950">Social media (PNG)</p>
      <p className="mt-1 text-xs text-stone-600">
        Gotowe rozmiary pod Facebooka i Instagram — post kwadrat lub story pion.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {(["post", "story"] as FormatSocial[]).map((f) => (
          <button
            key={f}
            type="button"
            disabled={oczekuje}
            onClick={() => pobierz(f)}
            className="min-h-[44px] rounded-lg border border-sky-700 bg-white px-4 py-2 text-sm font-medium text-sky-950 hover:bg-sky-100 disabled:opacity-60"
          >
            {oczekuje ? "Generuję…" : WYMIARY_SOCIAL[f].etykieta}
          </button>
        ))}
      </div>
      {blad ? <p className="mt-2 text-xs text-red-700">{blad}</p> : null}

      {/* Ukryte podglądy w rozmiarach social — tylko do eksportu PNG */}
      <div className="pointer-events-none fixed left-[-9999px] top-0 opacity-0" aria-hidden>
        {(["post", "story"] as FormatSocial[]).map((f) => (
          <PodgladSzablonuGrafiki
            key={f}
            szablon={szablon}
            motyw={motyw}
            wartosci={wartosci}
            logoDataUrl={logoDataUrl}
            backgroundDataUrl={backgroundDataUrl}
            qrDataUrl={qrUrl}
            formatSocial={f}
            elementId={`eksport-social-${f}`}
          />
        ))}
      </div>
    </div>
  );
}
