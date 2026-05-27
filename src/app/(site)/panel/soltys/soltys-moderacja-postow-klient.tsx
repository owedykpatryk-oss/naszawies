"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PasekMasowychAkcji } from "@/components/panel/pasek-masowych-akcji";
import { zatwierdzPostyMasowoSoltys } from "./akcje-masowe";
import { odrzucPostSoltysa, zatwierdzPostSoltysa, type WynikProsty } from "./akcje";

export type PostDoModeracjiWiersz = {
  id: string;
  title: string;
  wies: string;
  created_at: string;
  hrefWsi: string | null;
};

export function SoltysModeracjaPostowKlient({ posty }: { posty: PostDoModeracjiWiersz[] }) {
  const router = useRouter();
  const [blad, ustawBlad] = useState("");
  const [ladujeId, ustawLadujeId] = useState<string | null>(null);
  const [odrzucanieId, ustawOdrzucanieId] = useState<string | null>(null);
  const [notatka, ustawNotatke] = useState("");
  const [zaznaczone, ustawZaznaczone] = useState<Set<string>>(new Set());
  const [filtrWies, ustawFiltrWies] = useState("");
  const [najstarszeNajpierw, ustawNajstarszeNajpierw] = useState(true);

  const wiesOpcje = useMemo(() => Array.from(new Set(posty.map((p) => p.wies))).sort(), [posty]);

  const widoczne = useMemo(() => {
    const lista = filtrWies ? posty.filter((p) => p.wies === filtrWies) : [...posty];
    lista.sort((a, b) => {
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return najstarszeNajpierw ? ta - tb : tb - ta;
    });
    return lista;
  }, [posty, filtrWies, najstarszeNajpierw]);

  async function wykonaj(id: string, fn: (id: string) => Promise<WynikProsty>) {
    ustawBlad("");
    ustawLadujeId(id);
    try {
      const w = await fn(id);
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawOdrzucanieId(null);
      ustawNotatke("");
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

  async function potwierdzOdrzucenie(id: string) {
    ustawBlad("");
    ustawLadujeId(id);
    try {
      const w = await odrzucPostSoltysa(id, notatka);
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawOdrzucanieId(null);
      ustawNotatke("");
      router.refresh();
    } finally {
      ustawLadujeId(null);
    }
  }

  if (posty.length === 0) {
    return <p className="text-sm text-stone-600">Brak postów ze statusem „pending”.</p>;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
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
          onClick={() => ustawNajstarszeNajpierw((v) => !v)}
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50"
        >
          {najstarszeNajpierw ? "Najstarsze pierwsze" : "Najnowsze pierwsze"}
        </button>
        <button
          type="button"
          onClick={() => ustawZaznaczone(new Set(widoczne.map((p) => p.id)))}
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50"
        >
          Zaznacz widoczne
        </button>
      </div>

      {blad ? (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {blad}
        </p>
      ) : null}
      <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
        {widoczne.map((p) => (
          <li key={p.id} className="flex flex-col gap-3 px-4 py-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={zaznaczone.has(p.id)}
                onChange={() =>
                  ustawZaznaczone((prev) => {
                    const n = new Set(prev);
                    if (n.has(p.id)) n.delete(p.id);
                    else n.add(p.id);
                    return n;
                  })
                }
                className="mt-1 h-4 w-4 rounded border-stone-300"
              />
              <div>
                <p className="font-medium text-stone-900">
                  {p.hrefWsi ? (
                    <Link href={p.hrefWsi} className="text-green-900 underline hover:text-green-950">
                      {p.title}
                    </Link>
                  ) : (
                    p.title
                  )}
                </p>
                <p className="text-sm text-stone-600">
                  Wieś: <strong>{p.wies}</strong> · {new Date(p.created_at).toLocaleString("pl-PL")}
                </p>
              </div>
            </div>
            {odrzucanieId === p.id ? (
              <div className="ml-7 space-y-2 rounded-lg border border-stone-200 bg-stone-50 p-3">
                <label className="block text-xs font-medium text-stone-700" htmlFor={`not-${p.id}`}>
                  Powód odrzucenia (dla autora, 3–500 znaków)
                </label>
                <textarea
                  id={`not-${p.id}`}
                  value={notatka}
                  onChange={(e) => ustawNotatke(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="w-full rounded-md border border-stone-300 px-2 py-1.5 text-sm"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={ladujeId !== null}
                    onClick={() => void potwierdzOdrzucenie(p.id)}
                    className="rounded-lg bg-red-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-900 disabled:opacity-50"
                  >
                    {ladujeId === p.id ? "…" : "Potwierdź odrzucenie"}
                  </button>
                  <button
                    type="button"
                    disabled={ladujeId !== null}
                    onClick={() => {
                      ustawOdrzucanieId(null);
                      ustawNotatke("");
                      ustawBlad("");
                    }}
                    className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-800 hover:bg-stone-100 disabled:opacity-50"
                  >
                    Anuluj
                  </button>
                </div>
              </div>
            ) : (
              <div className="ml-7 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={ladujeId !== null}
                  onClick={() => void wykonaj(p.id, zatwierdzPostSoltysa)}
                  className="rounded-lg bg-green-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-50"
                >
                  {ladujeId === p.id ? "…" : "Zatwierdź"}
                </button>
                <button
                  type="button"
                  disabled={ladujeId !== null}
                  onClick={() => {
                    ustawBlad("");
                    ustawOdrzucanieId(p.id);
                    ustawNotatke("");
                  }}
                  className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-800 hover:bg-stone-50 disabled:opacity-50"
                >
                  Odrzuć…
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <PasekMasowychAkcji
        liczbaZaznaczonych={zaznaczone.size}
        etykietaAkcji="Zatwierdź zaznaczone posty"
        onZatwierdz={async () => {
          const w = await zatwierdzPostyMasowoSoltys(Array.from(zaznaczone));
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
