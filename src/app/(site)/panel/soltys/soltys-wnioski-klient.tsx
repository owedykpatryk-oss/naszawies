"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { etykietaRoliWsi } from "@/lib/panel/role-definicje";
import { odrzucWniosekMieszkanca, zatwierdzWniosekMieszkanca, type WynikProsty } from "./akcje";

export type WniosekWiersz = {
  id: string;
  created_at: string;
  wies: string;
  mieszkaniec: string;
  rola: string;
};

export function SoltysWnioskiKlient({ wnioski }: { wnioski: WniosekWiersz[] }) {
  const router = useRouter();
  const [blad, ustawBlad] = useState("");
  const [ladujeId, ustawLadujeId] = useState<string | null>(null);

  async function wykonaj(id: string, fn: (id: string) => Promise<WynikProsty>) {
    ustawBlad("");
    ustawLadujeId(id);
    try {
      const w = await fn(id);
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      router.refresh();
    } finally {
      ustawLadujeId(null);
    }
  }

  if (wnioski.length === 0) {
    return <p className="text-sm text-stone-600">Brak oczekujących wniosków o role (mieszkaniec, OSP, KGW, rada).</p>;
  }

  return (
    <div>
      {blad ? (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {blad}
        </p>
      ) : null}
      <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
        {wnioski.map((w) => (
          <li key={w.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-stone-900">{w.mieszkaniec}</p>
              <p className="text-sm text-stone-600">
                Wieś: <strong>{w.wies}</strong> · Wniosek: <strong>{etykietaRoliWsi(w.rola)}</strong>
              </p>
              <p className="text-xs text-stone-500">{new Date(w.created_at).toLocaleString("pl-PL")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={ladujeId !== null}
                onClick={() => void wykonaj(w.id, zatwierdzWniosekMieszkanca)}
                className="rounded-lg bg-green-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-50"
              >
                {ladujeId === w.id ? "…" : "Akceptuj"}
              </button>
              <button
                type="button"
                disabled={ladujeId !== null}
                onClick={() => void wykonaj(w.id, odrzucWniosekMieszkanca)}
                className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-800 hover:bg-stone-50 disabled:opacity-50"
              >
                Odrzuć
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
