"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  grupaListyPowiadomien,
  etykietaGrupyPowiadomien,
  type GrupaListyPowiadomien,
} from "@/lib/powiadomienia/grupy-typow-powiadomien";
import { oznaczPowiadomienieJakoPrzeczytane } from "./akcje";

export type PowiadomienieWiersz = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link_url: string | null;
  is_read: boolean;
  created_at: string;
};

type FiltrPowiadomien =
  | "wszystkie"
  | "nieprzeczytane"
  | "przeczytane"
  | GrupaListyPowiadomien;

export function PowiadomieniaLista({ wpisy }: { wpisy: PowiadomienieWiersz[] }) {
  const router = useRouter();
  const [laduje, ustawLaduje] = useState<string | null>(null);
  const [filtr, ustawFiltr] = useState<FiltrPowiadomien>("wszystkie");

  const liczbaWnioski = useMemo(
    () => wpisy.filter((p) => grupaListyPowiadomien(p.type) === "wnioski_role").length,
    [wpisy],
  );
  const liczbaZgloszenia = useMemo(
    () => wpisy.filter((p) => grupaListyPowiadomien(p.type) === "zgloszenia").length,
    [wpisy],
  );
  const liczbaPozostale = useMemo(
    () => wpisy.filter((p) => grupaListyPowiadomien(p.type) === "pozostale").length,
    [wpisy],
  );

  const przefiltrowane = useMemo(() => {
    if (filtr === "nieprzeczytane") return wpisy.filter((p) => !p.is_read);
    if (filtr === "przeczytane") return wpisy.filter((p) => p.is_read);
    if (filtr === "wnioski_role" || filtr === "zgloszenia" || filtr === "pozostale") {
      return wpisy.filter((p) => grupaListyPowiadomien(p.type) === filtr);
    }
    return wpisy;
  }, [wpisy, filtr]);

  const liczbaNieprzeczytanych = useMemo(() => wpisy.filter((p) => !p.is_read).length, [wpisy]);

  async function oznacz(id: string) {
    ustawLaduje(id);
    try {
      await oznaczPowiadomienieJakoPrzeczytane(id);
      router.refresh();
    } finally {
      ustawLaduje(null);
    }
  }

  if (wpisy.length === 0) {
    return <p className="text-sm text-stone-600">Brak powiadomień.</p>;
  }

  const chip = (id: FiltrPowiadomien, label: string, liczba?: number) => (
    <button
      key={id}
      type="button"
      onClick={() => ustawFiltr(id)}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
        filtr === id
          ? "border-green-800 bg-green-900 text-white shadow-sm"
          : "border-stone-200 bg-white text-stone-700 hover:border-green-800/30 hover:bg-green-50/80"
      }`}
    >
      {label}
      {typeof liczba === "number" ? (
        <span className={filtr === id ? "ml-1 opacity-90" : "ml-1 text-stone-500"}>({liczba})</span>
      ) : null}
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Filtr powiadomień">
        {chip("wszystkie", "Wszystkie", wpisy.length)}
        {chip("nieprzeczytane", "Nieprzeczytane", liczbaNieprzeczytanych)}
        {chip("przeczytane", "Przeczytane", wpisy.length - liczbaNieprzeczytanych)}
        {liczbaWnioski > 0 ? chip("wnioski_role", etykietaGrupyPowiadomien("wnioski_role"), liczbaWnioski) : null}
        {liczbaZgloszenia > 0 ? chip("zgloszenia", etykietaGrupyPowiadomien("zgloszenia"), liczbaZgloszenia) : null}
        {liczbaPozostale > 0 ? chip("pozostale", etykietaGrupyPowiadomien("pozostale"), liczbaPozostale) : null}
      </div>
      {przefiltrowane.length === 0 ? (
        <p className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
          Brak wpisów w tym widoku — wybierz inny filtr.
        </p>
      ) : (
      <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
      {przefiltrowane.map((p) => (
        <li key={p.id} className={`px-4 py-4 ${p.is_read ? "opacity-70" : "bg-green-50/40"}`}>
          <p className="text-[11px] font-medium uppercase tracking-wide text-stone-500">
            {etykietaGrupyPowiadomien(grupaListyPowiadomien(p.type))}
          </p>
          <p className="mt-0.5 font-medium text-stone-900">{p.title}</p>
          {p.body ? <p className="mt-1 text-sm text-stone-700">{p.body}</p> : null}
          <p className="mt-2 text-xs text-stone-500">{new Date(p.created_at).toLocaleString("pl-PL")}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {p.link_url ? (
              <Link href={p.link_url} className="text-sm font-medium text-green-800 underline">
                Otwórz
              </Link>
            ) : null}
            {!p.is_read ? (
              <button
                type="button"
                disabled={laduje !== null}
                onClick={() => void oznacz(p.id)}
                className="text-sm text-stone-600 underline hover:text-stone-900 disabled:opacity-50"
              >
                {laduje === p.id ? "…" : "Oznacz jako przeczytane"}
              </button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
      )}
    </div>
  );
}
