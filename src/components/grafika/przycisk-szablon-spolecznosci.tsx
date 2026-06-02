"use client";

import { useState, useTransition } from "react";
import { opublikujSzablonSpolecznosci } from "@/app/(site)/panel/grafika/akcje";
import type { SzablonGrafiki } from "@/lib/grafika/typy";

type Props = {
  szablon: SzablonGrafiki;
  motywId: string;
  tytulProjektu: string;
  wartosci: Record<string, string>;
  logoDataUrl: string | null;
  backgroundDataUrl: string | null;
  backgroundOverlay: number;
  qrUrl: string;
  villageId: string | null;
  nazwaWsi: string;
  onKomunikat: (t: string) => void;
  onBlad: (t: string) => void;
  onOpublikowano?: () => void;
};

export function PrzyciskSzablonSpolecznosci({
  szablon,
  motywId,
  tytulProjektu,
  wartosci,
  logoDataUrl,
  backgroundDataUrl,
  backgroundOverlay,
  qrUrl,
  villageId,
  nazwaWsi,
  onKomunikat,
  onBlad,
  onOpublikowano,
}: Props) {
  const [opis, ustawOpis] = useState("");
  const [pokazFormularz, ustawPokazFormularz] = useState(false);
  const [oczekuje, startTransition] = useTransition();

  const opublikuj = () => {
    startTransition(async () => {
      const r = await opublikujSzablonSpolecznosci({
        tytul: tytulProjektu.trim() || szablon.tytul,
        opis: opis.trim() || undefined,
        villageId,
        villageName: nazwaWsi || undefined,
        templateId: szablon.id,
        motywId,
        wartosci,
        logoDataUrl,
        backgroundDataUrl,
        backgroundOverlay,
        qrUrl: qrUrl.trim() || null,
      });
      if ("blad" in r) {
        onBlad(r.blad);
        return;
      }
      onKomunikat("Szablon opublikowany — inni użytkownicy mogą go teraz użyć.");
      onBlad("");
      ustawPokazFormularz(false);
      onOpublikowano?.();
    });
  };

  return (
    <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50/50 p-4">
      <p className="text-sm font-semibold text-sky-950">Udostępnij jako publiczny szablon</p>
      <p className="mt-1 text-xs text-stone-600">
        Inni sołtysowie i mieszkańcy zobaczą Twój projekt w sekcji „Społeczność” i skopiują go jednym kliknięciem
        (bez Twojego logo i danych osobowych w nazwie pliku — treść szablonu zostaje).
      </p>

      {!pokazFormularz ? (
        <button
          type="button"
          onClick={() => ustawPokazFormularz(true)}
          className="mt-3 rounded-lg border border-sky-700 bg-white px-3 py-2 text-sm font-medium text-sky-900 hover:bg-sky-100"
        >
          Opublikuj szablon dla wszystkich
        </button>
      ) : (
        <div className="mt-3 space-y-2">
          <label className="block text-xs">
            <span className="font-medium text-stone-700">Krótki opis (opcjonalnie)</span>
            <input
              type="text"
              value={opis}
              onChange={(e) => ustawOpis(e.target.value)}
              placeholder="Np. Plakat na zebranie — sprawdzony w naszej wsi"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={oczekuje}
              onClick={opublikuj}
              className="rounded-lg bg-sky-800 px-3 py-2 text-sm font-medium text-white hover:bg-sky-900 disabled:opacity-60"
            >
              {oczekuje ? "Publikuję…" : "Potwierdź publikację"}
            </button>
            <button
              type="button"
              onClick={() => ustawPokazFormularz(false)}
              className="rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-600"
            >
              Anuluj
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
