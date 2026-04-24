"use client";

import Link from "next/link";
import { FormEvent, useState, useTransition } from "react";
import { zapiszProfilPublicznyWsi } from "../akcje";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

export type WiesDoEdycji = {
  id: string;
  name: string;
  voivodeship: string;
  county: string;
  commune: string;
  slug: string;
  description: string | null;
  website: string | null;
  cover_image_url: string | null;
};

export function ProfilWsiSoltysKlient({ wies }: { wies: WiesDoEdycji[] }) {
  const [czek, startT] = useTransition();
  const [blad, ustawBlad] = useState<Record<string, string>>({});
  const [ok, ustawOk] = useState<Record<string, boolean>>({});

  function wyslij(e: FormEvent<HTMLFormElement>, w: WiesDoEdycji) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    ustawBlad((b) => ({ ...b, [w.id]: "" }));
    startT(async () => {
      const wynik = await zapiszProfilPublicznyWsi({
        villageId: w.id,
        description: String(fd.get("description") ?? ""),
        website: String(fd.get("website") ?? "") || null,
        cover_image_url: String(fd.get("cover_image_url") ?? "") || null,
      });
      if ("blad" in wynik) {
        ustawBlad((b) => ({ ...b, [w.id]: wynik.blad }));
        return;
      }
      ustawOk((o) => ({ ...o, [w.id]: true }));
    });
  }

  return (
    <ul className="mt-6 space-y-8">
      {wies.map((w) => {
        const sciezka = sciezkaProfiluWsi(w);
        return (
          <li key={w.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="font-serif text-lg text-green-950">{w.name}</h2>
            <p className="text-xs text-stone-500">
              {w.voivodeship} · {w.county} · {w.commune}
            </p>
            <p className="mt-1 text-sm">
              <Link href={sciezka} className="text-green-800 underline">
                Podgląd strony publicznej
              </Link>
            </p>
            {ok[w.id] ? (
              <p className="mt-2 text-sm text-green-800" role="status">
                Zapisano.
              </p>
            ) : null}
            {blad[w.id] ? (
              <p className="mt-2 text-sm text-red-800" role="alert">
                {blad[w.id]}
              </p>
            ) : null}
            <form onSubmit={(e) => wyslij(e, w)} className="mt-4 space-y-3 text-sm">
              <div>
                <label className="font-medium" htmlFor={`opis-${w.id}`}>
                  Opis miejscowości (widać na stronie wsi)
                </label>
                <textarea
                  id={`opis-${w.id}`}
                  name="description"
                  rows={6}
                  defaultValue={w.description ?? ""}
                  className="mt-1 w-full max-w-2xl rounded border border-stone-300 px-2 py-1.5"
                  maxLength={20000}
                />
              </div>
              <div>
                <label className="font-medium" htmlFor={`www-${w.id}`}>
                  Strona www (np. BIP, Facebook sołectwa) — pełny adres z https://
                </label>
                <input
                  id={`www-${w.id}`}
                  name="website"
                  type="url"
                  defaultValue={w.website ?? ""}
                  className="mt-1 w-full max-w-2xl rounded border border-stone-300 px-2 py-1.5"
                  placeholder="https://"
                />
              </div>
              <div>
                <label className="font-medium" htmlFor={`cover-${w.id}`}>
                  Adres obrazu banera (opcj.) — publiczny URL (https), zdjęcie nagłówka strony
                </label>
                <input
                  id={`cover-${w.id}`}
                  name="cover_image_url"
                  type="url"
                  defaultValue={w.cover_image_url ?? ""}
                  className="mt-1 w-full max-w-2xl rounded border border-stone-300 px-2 py-1.5"
                  placeholder="https://"
                />
              </div>
              <button
                type="submit"
                disabled={czek}
                className="rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-60"
              >
                {czek ? "Zapisuję…" : "Zapisz dane wsi"}
              </button>
            </form>
          </li>
        );
      })}
    </ul>
  );
}
