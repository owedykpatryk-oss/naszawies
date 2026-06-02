"use client";

import { useCallback, useMemo, useState } from "react";
import { RynekHubOstatnieSiatka } from "@/components/wies/rynek-hub-ostatnie-siatka";
import { RynekHubPaczki } from "@/components/wies/rynek-hub-paczki";
import { RynekHubWyszukiwarka } from "@/components/wies/rynek-hub-wyszukiwarka";
import { filtrujOstatnieHub } from "@/lib/marketplace/filtruj-ostatnie-hub";
import type { HubRynkuDane } from "@/lib/marketplace/pobierz-hub-rynku";

export function RynekHubKlient({ hub }: { hub: HubRynkuDane }) {
  const [fraza, ustawFraze] = useState("");

  const onWyborPaczki = useCallback((nowa: string) => {
    ustawFraze(nowa);
  }, []);

  const ostatniePrzefiltrowane = useMemo(
    () => filtrujOstatnieHub(hub.ostatnie, fraza),
    [hub.ostatnie, fraza],
  );

  const aktywnyFiltr = fraza.trim().length > 0;

  return (
    <>
      <section className="mt-10">
        <h2 className="font-serif text-xl text-green-950">Wybierz wieś</h2>
        <p className="mt-1 text-sm text-stone-600">
          Każda wieś ma własny rynek — jak tablica ogłoszeń, tylko z mapą, czatem i powiadomieniami o nowym miodzie czy
          serniku.
        </p>
        <RynekHubPaczki aktywnaFraza={fraza} onWybor={onWyborPaczki} />
        <div className="mt-4">
          <RynekHubWyszukiwarka wsie={hub.wsie} fraza={fraza} onFrazaChange={ustawFraze} />
        </div>
      </section>

      {hub.ostatnie.length > 0 ? (
        <section className="wow-wejscie mt-10 rounded-2xl border border-orange-200/70 bg-gradient-to-br from-orange-50/50 via-white to-emerald-50/30 p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-orange-800/80">Świeże ogłoszenia</p>
              <h2 className="font-serif text-xl text-green-950">Ostatnio na rynkach</h2>
              <p className="mt-1 text-sm text-stone-600">
                {aktywnyFiltr
                  ? `Filtrowane: „${fraza.trim()}” — ogłoszenia z całej Polski.`
                  : "Z całej Polski — każde we własnej wsi."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {aktywnyFiltr ? (
                <button
                  type="button"
                  onClick={() => ustawFraze("")}
                  className="rounded-full border border-orange-300/80 bg-white px-3 py-1 text-xs font-semibold text-orange-950 shadow-sm hover:bg-orange-50"
                >
                  Wyczyść filtr
                </button>
              ) : null}
              <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-stone-600 shadow-sm ring-1 ring-orange-200/60">
                {ostatniePrzefiltrowane.length}
                {aktywnyFiltr ? ` / ${hub.ostatnie.length}` : ""} najnowszych
              </span>
            </div>
          </div>
          {ostatniePrzefiltrowane.length > 0 ? (
            <RynekHubOstatnieSiatka ostatnie={ostatniePrzefiltrowane} />
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-orange-200/80 bg-white/60 px-4 py-8 text-center text-sm text-stone-600">
              Brak ogłoszeń w tej kategorii — spróbuj innej paczki albo{" "}
              <button type="button" onClick={() => ustawFraze("")} className="font-semibold text-green-800 underline">
                pokaż wszystkie
              </button>
              .
            </p>
          )}
        </section>
      ) : null}
    </>
  );
}
