"use client";

import { useState } from "react";
import { zbudujKodyEmbedWsi } from "@/lib/wies/kody-embed-wsi";

export function KodyEmbedWsiKlient({ villageId }: { villageId: string }) {
  const kody = zbudujKodyEmbedWsi(villageId);
  const [skopiowano, ustawSkopiowano] = useState<string | null>(null);

  async function kopiuj(klucz: string, tekst: string) {
    try {
      await navigator.clipboard.writeText(tekst);
      ustawSkopiowano(klucz);
      window.setTimeout(() => ustawSkopiowano(null), 2000);
    } catch {
      ustawSkopiowano("blad");
    }
  }

  return (
    <div className="space-y-4">
      {(
        [
          { klucz: "kalendarz", tytul: "Kalendarz świetlicy", dane: kody.kalendarz },
          { klucz: "rynek", tytul: "Rynek lokalny", dane: kody.rynek },
          { klucz: "szkola", tytul: "Tablica szkoły", dane: kody.szkola },
          { klucz: "historia", tytul: "Kronika wsi", dane: kody.historia },
          { klucz: "sport", tytul: "Terminarz sportowy", dane: kody.sport },
        ] as const
      ).map(({ klucz, tytul, dane }) => (
        <div key={klucz} className="rounded-xl border border-stone-200 bg-stone-50/80 p-4">
          <p className="text-sm font-medium text-stone-800">{tytul}</p>
          <p className="mt-1 break-all text-xs text-stone-600">{dane.url}</p>
          <textarea
            readOnly
            className="form-control form-control--textarea mt-2 w-full max-w-full min-w-0 font-mono text-[11px]"
            rows={3}
            value={dane.iframe}
            aria-label={`Kod iframe: ${tytul}`}
          />
          <button type="button" className="mt-2 text-xs font-medium text-green-800 underline" onClick={() => kopiuj(klucz, dane.iframe)}>
            {skopiowano === klucz ? "Skopiowano!" : "Kopiuj kod iframe"}
          </button>
        </div>
      ))}
      {skopiowano === "blad" ? <p className="text-xs text-red-700">Nie udało się skopiować — zaznacz kod ręcznie.</p> : null}
      <p className="text-xs text-stone-500">
        Wklej kod na stronie BIP gminy lub w CMS — widget działa bez logowania i nie ujawnia danych wynajmujących salę.
      </p>
    </div>
  );
}
