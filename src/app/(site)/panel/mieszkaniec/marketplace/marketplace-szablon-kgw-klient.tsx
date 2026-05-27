"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { WyborKategoriiRynku } from "@/components/marketplace/wybor-kategorii-rynku";
import { dodajPakietOgloszenKgw } from "./akcje";

const DOMYSLNE = [
  { title: "Miód z pasieki", equipmentCategory: "miod" },
  { title: "Jaja wiejskie", equipmentCategory: "sery_nabial" },
  { title: "Warzywa sezonowe", equipmentCategory: "warzywa_owoce" },
];

export function MarketplaceSzablonKgwKlient({ wsie }: { wsie: { id: string; name: string }[] }) {
  const router = useRouter();
  const [blad, ustawBlad] = useState("");
  const [czek, startT] = useTransition();
  const [wies, ustawWies] = useState(wsie[0]?.id ?? "");
  const [pozycje, ustawPozycje] = useState(
    DOMYSLNE.map((d) => ({ ...d, listingType: "sprzedam" as const, priceAmount: "" })),
  );

  if (wsie.length === 0) return null;

  return (
    <section className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/30 p-4">
      <h2 className="font-serif text-lg text-green-950">Szablon KGW / gospodarstwo</h2>
      <p className="mt-1 text-xs text-stone-600">
        Szybko dodaj kilka produktów naraz (każde jako osobne ogłoszenie do akceptacji sołtysa). Potem uzupełnij opisy w
        edycji.
      </p>
      {blad ? <p className="mt-2 text-sm text-red-800">{blad}</p> : null}
      <label className="mt-3 block text-sm">
        Wieś
        <select
          value={wies}
          onChange={(e) => ustawWies(e.target.value)}
          className="mt-1 block max-w-xs rounded border border-stone-300 bg-white px-2 py-1.5"
        >
          {wsie.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </label>
      <ul className="mt-3 space-y-2">
        {pozycje.map((p, i) => (
          <li key={i} className="grid gap-2 rounded-lg bg-white p-2 sm:grid-cols-3">
            <input
              value={p.title}
              onChange={(e) => {
                const next = [...pozycje];
                next[i] = { ...next[i], title: e.target.value };
                ustawPozycje(next);
              }}
              className="rounded border border-stone-300 px-2 py-1 text-sm sm:col-span-2"
              placeholder="Tytuł produktu"
            />
            <WyborKategoriiRynku
              value={p.equipmentCategory}
              onChange={(v) => {
                const next = [...pozycje];
                next[i] = { ...next[i], equipmentCategory: v };
                ustawPozycje(next);
              }}
              pokazPustaOpcje={false}
            />
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="text-xs text-green-800 underline"
          onClick={() =>
            ustawPozycje([...pozycje, { title: "", equipmentCategory: "inne_jedzenie", listingType: "sprzedam", priceAmount: "" }])
          }
        >
          + kolejna pozycja
        </button>
        <button
          type="button"
          disabled={czek}
          className="rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-50"
          onClick={() => {
            ustawBlad("");
            const ok = pozycje.filter((p) => p.title.trim().length >= 3);
            if (ok.length === 0) {
              ustawBlad("Podaj co najmniej jeden tytuł (min. 3 znaki).");
              return;
            }
            startT(async () => {
              const w = await dodajPakietOgloszenKgw({
                villageId: wies,
                pozycje: ok.map((p) => ({
                  listingType: "sprzedam",
                  title: p.title.trim(),
                  equipmentCategory: p.equipmentCategory || null,
                  priceAmount: null,
                })),
              });
              if ("blad" in w) {
                ustawBlad(w.blad);
                return;
              }
              router.refresh();
            });
          }}
        >
          {czek ? "Wysyłanie…" : "Wyślij pakiet ogłoszeń"}
        </button>
      </div>
    </section>
  );
}
