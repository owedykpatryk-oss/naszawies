"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { WyborKategoriiRynku } from "@/components/marketplace/wybor-kategorii-rynku";
import { etykietaKategoriiOgloszenia } from "@/lib/marketplace/kategorie-ogloszen";
import { dodajSubskrypcjeKategoriiRynku, usunSubskrypcjeKategoriiRynku } from "./akcje-subskrypcje";

export type SubskrypcjaWiersz = {
  id: string;
  village_id: string;
  equipment_category: string | null;
  nazwaWsi: string;
};

export function MarketplaceSubskrypcjeKlient({
  wsie,
  subskrypcje,
}: {
  wsie: { id: string; name: string }[];
  subskrypcje: SubskrypcjaWiersz[];
}) {
  const router = useRouter();
  const [blad, ustawBlad] = useState("");
  const [czek, startT] = useTransition();
  const [wies, ustawWies] = useState(wsie[0]?.id ?? "");
  const [kat, ustawKat] = useState("");
  const [wszystkie, ustawWszystkie] = useState(true);

  if (wsie.length === 0) return null;

  return (
    <section className="mt-8 rounded-xl border border-sky-200 bg-sky-50/40 p-4">
      <h2 className="font-serif text-lg text-green-950">Powiadomienia o rynku</h2>
      <p className="mt-1 text-xs text-stone-600">
        Dostaniesz alert w aplikacji, gdy sołtys zatwierdzi nowe ogłoszenie (np. „nowy ciągnik” albo „nowy miód”).
      </p>
      {blad ? <p className="mt-2 text-sm text-red-800">{blad}</p> : null}
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="text-sm">
          Wieś
          <select
            value={wies}
            onChange={(e) => ustawWies(e.target.value)}
            className="mt-1 block rounded border border-stone-300 bg-white px-2 py-1.5 text-sm"
          >
            {wsie.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={wszystkie}
            onChange={(e) => ustawWszystkie(e.target.checked)}
            className="accent-green-800"
          />
          Wszystkie kategorie
        </label>
        {!wszystkie ? (
          <div className="min-w-[200px]">
            <span className="mb-1 block text-xs text-stone-600">Kategoria</span>
            <WyborKategoriiRynku value={kat} onChange={ustawKat} pokazPustaOpcje={false} />
          </div>
        ) : null}
        <button
          type="button"
          disabled={czek}
          className="rounded-lg bg-green-800 px-3 py-2 text-xs font-medium text-white hover:bg-green-900 disabled:opacity-50"
          onClick={() => {
            ustawBlad("");
            startT(async () => {
              const w = await dodajSubskrypcjeKategoriiRynku(wies, wszystkie ? null : kat || null);
              if ("blad" in w) {
                ustawBlad(w.blad);
                return;
              }
              router.refresh();
            });
          }}
        >
          Dodaj alert
        </button>
      </div>
      {subskrypcje.length > 0 ? (
        <ul className="mt-4 space-y-1 text-sm">
          {subskrypcje.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2">
              <span>
                {s.nazwaWsi} · {s.equipment_category ? etykietaKategoriiOgloszenia(s.equipment_category) : "wszystkie ogłoszenia"}
              </span>
              <button
                type="button"
                disabled={czek}
                className="text-xs text-red-800 underline disabled:opacity-50"
                onClick={() => {
                  startT(async () => {
                    await usunSubskrypcjeKategoriiRynku(s.id);
                    router.refresh();
                  });
                }}
              >
                Usuń
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-stone-500">Brak subskrypcji — dodaj alert powyżej.</p>
      )}
    </section>
  );
}
