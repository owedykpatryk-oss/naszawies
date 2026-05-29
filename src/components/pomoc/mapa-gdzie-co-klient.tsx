"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MAPA_GDZIE_CO } from "@/lib/pomoc/mapa-gdzie-co";

type FiltrRoli = "wszystkie" | "mieszkaniec" | "soltys";

type Props = {
  domyslnyFiltr?: FiltrRoli;
  pokazFiltry?: boolean;
};

export function MapaGdzieCoKlient({ domyslnyFiltr = "wszystkie", pokazFiltry = true }: Props) {
  const [filtr, ustawFiltr] = useState<FiltrRoli>(domyslnyFiltr);

  const wpisy = useMemo(() => {
    if (filtr === "wszystkie") return MAPA_GDZIE_CO;
    return MAPA_GDZIE_CO.filter((w) => w.rola === filtr || w.rola === "wszystkie");
  }, [filtr]);

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="font-serif text-xl text-green-950">Gdzie co znajdę?</h2>
      <p className="mt-1 text-sm text-stone-600">
        Szybka mapa najczęstszych czynności — kliknij, żeby przejść od razu do właściwego miejsca.
      </p>

      {pokazFiltry ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              { id: "wszystkie" as const, label: "Wszystkie" },
              { id: "mieszkaniec" as const, label: "Mieszkaniec" },
              { id: "soltys" as const, label: "Sołtys" },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => ustawFiltr(f.id)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                filtr === f.id
                  ? "border-green-700 bg-green-800 text-white"
                  : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-4 overflow-x-auto rounded-xl border border-stone-100">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase text-stone-500">
            <tr>
              <th className="px-3 py-2.5 font-semibold">Chcę…</th>
              <th className="px-3 py-2.5 font-semibold">Idę do…</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {wpisy.map((w) => (
              <tr key={w.cel} className="hover:bg-emerald-50/40">
                <td className="px-3 py-2.5 text-stone-800">{w.cel}</td>
                <td className="px-3 py-2.5">
                  <Link href={w.href} className="font-medium text-green-800 underline decoration-green-300 underline-offset-2">
                    {w.sciezka}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
