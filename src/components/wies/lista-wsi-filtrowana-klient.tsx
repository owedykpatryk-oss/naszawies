"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { WiesNaHubie } from "@/lib/wies/hub-administracyjny";
import { sciezkaGminy } from "@/lib/wies/sciezka-publiczna";

const NA_STRONE = 40;

function formatPopulacja(n: number | null): string {
  if (n == null) return "—";
  return n.toLocaleString("pl-PL");
}

type Props = {
  wies: WiesNaHubie[];
  grupujPoGminie?: boolean;
};

export function ListaWsiFiltrowanaKlient({ wies, grupujPoGminie = false }: Props) {
  const [filtr, ustawFiltr] = useState("");
  const [strona, ustawStrone] = useState(0);
  const [rozwinieteGminy, ustawRozwinieteGminy] = useState<Record<string, boolean>>({});

  const f = filtr.trim().toLowerCase();

  const przefiltrowane = useMemo(() => {
    if (!f) return wies;
    return wies.filter(
      (v) =>
        v.name.toLowerCase().includes(f) ||
        v.commune.toLowerCase().includes(f) ||
        v.slug.toLowerCase().includes(f),
    );
  }, [wies, f]);

  const strony = Math.max(1, Math.ceil(przefiltrowane.length / NA_STRONE));
  const biezaca = przefiltrowane.slice(strona * NA_STRONE, (strona + 1) * NA_STRONE);

  const poGminie = useMemo(() => {
    const acc: Record<string, WiesNaHubie[]> = {};
    for (const v of przefiltrowane) {
      if (!acc[v.commune]) acc[v.commune] = [];
      acc[v.commune]!.push(v);
    }
    return Object.entries(acc).sort(([a], [b]) => a.localeCompare(b, "pl"));
  }, [przefiltrowane]);

  if (!grupujPoGminie) {
    return (
      <div className="mt-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={filtr}
            onChange={(e) => {
              ustawFiltr(e.target.value);
              ustawStrone(0);
            }}
            placeholder="Szukaj miejscowości…"
            className="form-control max-w-xs flex-1 text-sm"
            aria-label="Filtruj miejscowości"
          />
          <p className="text-xs text-stone-500">
            {przefiltrowane.length} z {wies.length}
          </p>
        </div>
        <ul className="mt-3 divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white [content-visibility:auto]">
          {biezaca.map((v) => (
            <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div>
                <Link href={v.sciezka} className="font-medium text-green-900 hover:underline">
                  {v.name}
                </Link>
                {!v.is_active ? (
                  <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-900">
                    w przygotowaniu
                  </span>
                ) : null}
                <p className="text-xs text-stone-500">
                  {v.commune} · ok. {formatPopulacja(v.population)} mieszk.
                </p>
              </div>
              <Link href={v.sciezka} className="text-sm text-green-800 underline">
                Profil →
              </Link>
            </li>
          ))}
        </ul>
        {strony > 1 ? (
          <nav className="mt-3 flex flex-wrap items-center gap-2 text-sm" aria-label="Strony listy">
            <button
              type="button"
              disabled={strona === 0}
              onClick={() => ustawStrone((s) => Math.max(0, s - 1))}
              className="rounded-lg border border-stone-200 px-3 py-1.5 disabled:opacity-40"
            >
              ← Wstecz
            </button>
            <span className="text-stone-600">
              Strona {strona + 1} / {strony}
            </span>
            <button
              type="button"
              disabled={strona >= strony - 1}
              onClick={() => ustawStrone((s) => Math.min(strony - 1, s + 1))}
              className="rounded-lg border border-stone-200 px-3 py-1.5 disabled:opacity-40"
            >
              Dalej →
            </button>
          </nav>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-4">
      <input
        type="search"
        value={filtr}
        onChange={(e) => ustawFiltr(e.target.value)}
        placeholder="Szukaj gminy lub miejscowości…"
        className="form-control max-w-md text-sm"
        aria-label="Filtruj po powiecie"
      />
      <div className="mt-4 space-y-3 [content-visibility:auto]">
        {poGminie.map(([gmina, lista]) => {
          const otwarta = rozwinieteGminy[gmina] ?? lista.length <= 12;
          const pokaz = otwarta ? lista : lista.slice(0, 8);
          return (
            <section key={gmina} className="rounded-xl border border-stone-200 bg-white p-3">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 text-left"
                onClick={() => ustawRozwinieteGminy((r) => ({ ...r, [gmina]: !otwarta }))}
              >
                <span className="text-sm font-semibold text-green-950">
                  <Link
                    href={sciezkaGminy({
                      voivodeship: lista[0]!.voivodeship,
                      county: lista[0]!.county,
                      commune: gmina,
                    })}
                    className="hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {gmina}
                  </Link>
                  <span className="ml-2 font-normal text-stone-500">({lista.length})</span>
                </span>
                <span className="text-xs text-green-800">{otwarta ? "Zwiń" : "Rozwiń"}</span>
              </button>
              <ul className="mt-2 space-y-1">
                {pokaz.map((v) => (
                  <li key={v.id}>
                    <Link href={v.sciezka} className="block rounded-lg px-2 py-1.5 text-sm text-stone-800 hover:bg-green-50">
                      {v.name}
                      {!v.is_active ? (
                        <span className="ml-1 text-[10px] text-amber-800">· w przygotowaniu</span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
              {!otwarta && lista.length > 8 ? (
                <p className="mt-1 px-2 text-xs text-stone-500">+ {lista.length - 8} więcej — kliknij „Rozwiń”</p>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}
