"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  odrzucPoiAutomatyczny,
  zatwierdzPoiAutomatyczny,
  zatwierdzWszystkiePoiAutomatyczne,
} from "@/app/(site)/panel/soltys/akcje-mapa-poi";
import { etykietaKategoriiPoi } from "@/lib/mapa/kategorie-poi";
import type { PoiDoWeryfikacji } from "@/lib/mapa/pobierz-poi-do-weryfikacji-wsi";

type Props = {
  villageId: string;
  poczatkowe: PoiDoWeryfikacji[];
};

export function KolejkaWeryfikacjiPoi({ villageId, poczatkowe }: Props) {
  const [lista, ustawListe] = useState(poczatkowe);
  const [czek, start] = useTransition();
  const [blad, ustawBlad] = useState("");
  const [komunikat, ustawKomunikat] = useState("");

  if (poczatkowe.length === 0 && lista.length === 0) return null;

  function zatwierdz(poi: PoiDoWeryfikacji, name?: string) {
    ustawBlad("");
    ustawKomunikat("");
    start(async () => {
      const w = await zatwierdzPoiAutomatyczny({ poiId: poi.id, name });
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawListe((prev) => prev.filter((p) => p.id !== poi.id));
      ustawKomunikat(`Zatwierdzono: ${name?.trim() || poi.name}`);
    });
  }

  function odrzuc(poiId: string) {
    ustawBlad("");
    ustawKomunikat("");
    start(async () => {
      const w = await odrzucPoiAutomatyczny(poiId);
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawListe((prev) => prev.filter((p) => p.id !== poiId));
      ustawKomunikat("Usunięto błędny punkt z mapy.");
    });
  }

  function zatwierdzWszystkie() {
    if (!confirm(`Zatwierdzić wszystkie ${lista.length} punktów bez zmiany nazw?`)) return;
    ustawBlad("");
    ustawKomunikat("");
    start(async () => {
      const w = await zatwierdzWszystkiePoiAutomatyczne(villageId);
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawListe([]);
      ustawKomunikat(
        w.zatwierdzono === 0
          ? "Brak punktów do zatwierdzenia."
          : `Zatwierdzono ${w.zatwierdzono} punktów naraz.`,
      );
    });
  }

  if (lista.length === 0) {
    return (
      <section className="mt-4 rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-4">
        <p className="text-sm text-emerald-900" role="status">
          {komunikat || "Wszystkie automatyczne punkty zostały zweryfikowane."}
        </p>
      </section>
    );
  }

  return (
    <section className="mt-4 rounded-xl border border-sky-200/80 bg-sky-50/50 p-4" id="kolejka-weryfikacji-mapy">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-sky-950">
          Do weryfikacji ({lista.length}) — import automatyczny
        </h3>
        {lista.length > 1 ? (
          <button
            type="button"
            disabled={czek}
            onClick={zatwierdzWszystkie}
            className="rounded-lg bg-green-800 px-3 py-1 text-xs font-medium text-white hover:bg-green-900 disabled:opacity-60"
          >
            Zatwierdź wszystkie
          </button>
        ) : null}
      </div>
      <p className="mt-1 text-xs text-sky-900/90">
        Cron lub OSM dodały pinezki bez Twojej akceptacji. Zatwierdź poprawne miejsca albo usuń błędne — wtedy
        nie wrócą przy kolejnym syncu (zatwierdzone mają pierwszeństwo).
      </p>
      {blad ? (
        <p className="mt-2 text-sm text-red-800" role="alert">
          {blad}
        </p>
      ) : null}
      {komunikat ? (
        <p className="mt-2 text-sm text-emerald-800" role="status">
          {komunikat}
        </p>
      ) : null}
      <ul className="mt-3 space-y-2">
        {lista.map((p) => (
          <li key={p.id} className="rounded-lg border border-sky-100 bg-white/90 p-3 text-sm">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="font-medium text-stone-900">{p.name}</span>
              <span className="text-xs text-stone-500">{etykietaKategoriiPoi(p.category)}</span>
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600">
                {p.source === "geoportal" ? "Geoportal" : "OSM"}
              </span>
              <Link
                href={`/mapa/miejsce/${p.id}`}
                className="text-[10px] font-medium text-green-800 underline"
              >
                Podgląd →
              </Link>
            </div>
            {p.description ? (
              <p className="mt-1 line-clamp-2 text-xs text-stone-500">{p.description}</p>
            ) : null}
            <form
              className="mt-2 flex flex-wrap items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const name = String(fd.get("name") ?? "").trim();
                zatwierdz(p, name || undefined);
              }}
            >
              <label className="min-w-[12rem] flex-1 text-xs">
                Nazwa (opcj. popraw)
                <input
                  name="name"
                  type="text"
                  defaultValue={p.name}
                  maxLength={200}
                  className="mt-0.5 block w-full rounded border border-stone-300 px-2 py-1 text-sm"
                />
              </label>
              <button
                type="submit"
                disabled={czek}
                className="rounded-lg bg-green-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-900 disabled:opacity-60"
              >
                Zatwierdź
              </button>
              <button
                type="button"
                disabled={czek}
                onClick={() => odrzuc(p.id)}
                className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-800 hover:bg-red-50 disabled:opacity-60"
              >
                Usuń
              </button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}
