"use client";

import { useRef, useState } from "react";
import { wgrajOkladkeOrganizacji } from "@/lib/storage/wgraj-okladke-organizacji";

const MIME = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX = 3 * 1024 * 1024;

type Props = {
  prefix: string;
  villageId: string;
  okladkaUrl?: string | null;
  haslo?: string | null;
};

export function PolaOkladkiOrganizacji({ prefix, villageId, okladkaUrl, haslo }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, ustawUrl] = useState(okladkaUrl ?? "");
  const [laduje, ustawLaduje] = useState(false);
  const [blad, ustawBlad] = useState("");

  async function onPlik(plik: File | null) {
    if (!plik) return;
    ustawBlad("");
    if (!MIME.includes(plik.type as (typeof MIME)[number])) {
      ustawBlad("Dozwolone: JPEG, PNG, WebP.");
      return;
    }
    if (plik.size > MAX) {
      ustawBlad("Maks. 3 MB.");
      return;
    }

    ustawLaduje(true);
    try {
      const fd = new FormData();
      fd.set("villageId", villageId);
      fd.set("file", plik);
      const w = await wgrajOkladkeOrganizacji(fd);
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawUrl(w.publicUrl);
    } catch {
      ustawBlad("Nie udało się wgrać pliku.");
    } finally {
      ustawLaduje(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="grid gap-3 rounded-xl border border-stone-200 bg-stone-50/80 p-4 md:col-span-2">
      <p className="text-sm font-medium text-stone-800 md:col-span-2">Okładka mini-strony (opcjonalnie)</p>

      {url ? (
        <div className="organizacja-okladka-podglad relative aspect-[16/9] max-h-40 overflow-hidden rounded-xl border border-stone-200 md:col-span-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => ustawUrl("")}
            className="absolute right-2 top-2 rounded-lg bg-black/55 px-2 py-1 text-[10px] font-semibold text-white hover:bg-black/70"
          >
            Usuń
          </button>
        </div>
      ) : null}

      <div className="md:col-span-2">
        <span className="text-xs font-medium text-stone-600">
          Wgraj zdjęcie (16:9, max 3 MB — przycinane automatycznie po stronie serwera)
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={laduje}
          onChange={(e) => void onPlik(e.target.files?.[0] ?? null)}
          className="mt-1 w-full text-xs text-stone-600 file:mr-2 file:rounded-lg file:border-0 file:bg-green-800 file:px-3 file:py-2 file:text-xs file:text-white"
        />
        {laduje ? <p className="mt-1 text-xs text-stone-500">Wgrywanie i optymalizacja…</p> : null}
      </div>

      <label className="block text-sm md:col-span-2">
        <span className="font-medium text-stone-700">Adres URL okładki</span>
        <input
          name={`${prefix}_okladka_url`}
          type="url"
          value={url}
          onChange={(e) => ustawUrl(e.target.value)}
          placeholder="https://… lub wgraj plik powyżej"
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="block text-sm md:col-span-2">
        <span className="font-medium text-stone-700">Hasło / motto (krótkie)</span>
        <input
          name={`${prefix}_haslo`}
          defaultValue={haslo ?? ""}
          placeholder="np. Razem dla wsi"
          maxLength={120}
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />
      </label>

      {blad ? <p className="text-xs text-red-700 md:col-span-2">{blad}</p> : null}
    </div>
  );
}
