"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PasekMasowychAkcji } from "@/components/panel/pasek-masowych-akcji";
import { etykietaRoliWsi } from "@/lib/panel/role-definicje";
import { zatwierdzWnioskiMasowoSoltys } from "./akcje-masowe";
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
  const [zaznaczone, ustawZaznaczone] = useState<Set<string>>(new Set());
  const [filtrWies, ustawFiltrWies] = useState("");
  const [szukaj, ustawSzukaj] = useState("");

  const wiesOpcje = useMemo(() => Array.from(new Set(wnioski.map((w) => w.wies))).sort(), [wnioski]);

  const widoczne = useMemo(() => {
    const q = szukaj.trim().toLowerCase();
    return wnioski.filter((w) => {
      if (filtrWies && w.wies !== filtrWies) return false;
      if (!q) return true;
      return (
        w.mieszkaniec.toLowerCase().includes(q) ||
        w.wies.toLowerCase().includes(q) ||
        etykietaRoliWsi(w.rola).toLowerCase().includes(q)
      );
    });
  }, [wnioski, filtrWies, szukaj]);

  async function wykonaj(id: string, fn: (id: string) => Promise<WynikProsty>) {
    ustawBlad("");
    ustawLadujeId(id);
    try {
      const w = await fn(id);
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawZaznaczone((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
      router.refresh();
    } finally {
      ustawLadujeId(null);
    }
  }

  function przelacz(id: string) {
    ustawZaznaczone((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function zaznaczWszystkieWidoczne() {
    ustawZaznaczone(new Set(widoczne.map((w) => w.id)));
  }

  if (wnioski.length === 0) {
    return <p className="text-sm text-stone-600">Brak oczekujących wniosków o role (mieszkaniec, OSP, KGW, rada).</p>;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <input
          type="search"
          value={szukaj}
          onChange={(e) => ustawSzukaj(e.target.value)}
          placeholder="Szukaj po imieniu, wsi, roli…"
          className="min-w-[12rem] flex-1 rounded-lg border border-stone-300 px-3 py-1.5 text-sm"
        />
        <select
          value={filtrWies}
          onChange={(e) => ustawFiltrWies(e.target.value)}
          className="rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
        >
          <option value="">Wszystkie wsie</option>
          {wiesOpcje.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={zaznaczWszystkieWidoczne}
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50"
        >
          Zaznacz widoczne
        </button>
        <button
          type="button"
          onClick={() => ustawZaznaczone(new Set())}
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50"
        >
          Odznacz
        </button>
      </div>

      {blad ? (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {blad}
        </p>
      ) : null}

      <ul className="soltys-lista-moderacji divide-y divide-stone-200">
        {widoczne.map((w) => (
          <li key={w.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <input
                type="checkbox"
                checked={zaznaczone.has(w.id)}
                onChange={() => przelacz(w.id)}
                className="mt-1 h-4 w-4 rounded border-stone-300"
                aria-label={`Zaznacz wniosek ${w.mieszkaniec}`}
              />
              <div>
                <p className="font-medium text-stone-900">{w.mieszkaniec}</p>
                <p className="text-sm text-stone-600">
                  Wieś: <strong>{w.wies}</strong> · Wniosek: <strong>{etykietaRoliWsi(w.rola)}</strong>
                </p>
                <p className="text-xs text-stone-500">{new Date(w.created_at).toLocaleString("pl-PL")}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pl-7 sm:pl-0">
              <button
                type="button"
                disabled={ladujeId !== null}
                onClick={() => void wykonaj(w.id, zatwierdzWniosekMieszkanca)}
                className="btn-panel-primary !min-h-0 px-3 py-1.5 text-sm"
              >
                {ladujeId === w.id ? "…" : "Akceptuj"}
              </button>
              <button
                type="button"
                disabled={ladujeId !== null}
                onClick={() => void wykonaj(w.id, odrzucWniosekMieszkanca)}
                className="btn-panel-secondary !min-h-0 px-3 py-1.5 text-sm"
              >
                Odrzuć
              </button>
            </div>
          </li>
        ))}
      </ul>

      {widoczne.length === 0 ? (
        <p className="mt-3 text-sm text-stone-500">Brak wniosków pasujących do filtrów.</p>
      ) : null}

      <PasekMasowychAkcji
        liczbaZaznaczonych={zaznaczone.size}
        etykietaAkcji="Akceptuj zaznaczone wnioski"
        onZatwierdz={async () => {
          const w = await zatwierdzWnioskiMasowoSoltys(Array.from(zaznaczone));
          if ("blad" in w) return { blad: w.blad };
          return { zatwierdzono: w.zatwierdzono, pominieto: w.pominieto };
        }}
        onPoSukcesie={() => {
          ustawZaznaczone(new Set());
          router.refresh();
        }}
      />
    </div>
  );
}
