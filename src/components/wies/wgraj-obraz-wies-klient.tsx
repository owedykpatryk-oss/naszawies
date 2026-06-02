"use client";

import { czyKlientUzywaMagazynuR2 } from "@/lib/storage/czy-magazyn-r2";
import { wgrajObrazDoMagazynuR2 } from "@/lib/storage/wgraj-obraz-r2";
import { useRef, useState } from "react";

const MIME = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX = 3 * 1024 * 1024;

type Props = {
  villageId: string;
  etykieta: string;
  aktualnyUrl: string;
  onUrl: (url: string) => void;
  podkatalog?: "branding" | "historia" | "organizacje";
};

export function WgrajObrazWiesKlient({
  villageId,
  etykieta,
  aktualnyUrl,
  onUrl,
  podkatalog = "branding",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
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
    if (!czyKlientUzywaMagazynuR2()) {
      ustawBlad("Upload wymaga magazynu R2 — wklej adres URL obrazu.");
      return;
    }
    ustawLaduje(true);
    try {
      const fd = new FormData();
      fd.set("typ", "village_photos");
      fd.set("villageId", villageId);
      fd.set("podkatalog", podkatalog);
      fd.set("file", plik);
      const w = await wgrajObrazDoMagazynuR2(fd);
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      onUrl(w.publicUrl);
    } catch {
      ustawBlad("Nie udało się wgrać pliku.");
    } finally {
      ustawLaduje(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <span className="text-xs font-medium text-stone-600">{etykieta}</span>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="w-full max-w-full text-xs text-stone-600 file:mr-2 file:max-w-[calc(100%-0.5rem)] file:rounded-lg file:border-0 file:bg-green-800 file:px-2 file:py-2 file:text-xs file:text-white"
          disabled={laduje}
          onChange={(e) => void onPlik(e.target.files?.[0] ?? null)}
        />
        {laduje ? <span className="text-xs text-stone-500">Wgrywanie…</span> : null}
      </div>
      {aktualnyUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={aktualnyUrl} alt="" className="mt-1 max-h-24 rounded-lg border border-stone-200 object-cover" />
      ) : null}
      {blad ? <p className="text-xs text-red-700">{blad}</p> : null}
    </div>
  );
}
