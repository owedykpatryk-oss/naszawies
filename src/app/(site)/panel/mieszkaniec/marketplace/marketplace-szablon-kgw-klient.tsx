"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { WyborKategoriiRynku } from "@/components/marketplace/wybor-kategorii-rynku";
import { SZABLON_KGW_KIERMASZ, SZABLON_KGW_MINI } from "@/lib/marketplace/szablon-kgw-festyn";
import { dodajPakietOgloszenKgw } from "./akcje";

type PozycjaForm = {
  title: string;
  equipmentCategory: string;
  listingType: "sprzedam";
  priceAmount: string;
};

function pozycjeZSablonu(
  szablon: readonly { title: string; equipmentCategory: string }[],
): PozycjaForm[] {
  return szablon.map((d) => ({
    title: d.title,
    equipmentCategory: d.equipmentCategory,
    listingType: "sprzedam",
    priceAmount: "",
  }));
}

export function MarketplaceSzablonKgwKlient({ wsie }: { wsie: { id: string; name: string }[] }) {
  const router = useRouter();
  const [blad, ustawBlad] = useState("");
  const [sukces, ustawSukces] = useState("");
  const [czek, startT] = useTransition();
  const [wies, ustawWies] = useState(wsie[0]?.id ?? "");
  const [pozycje, ustawPozycje] = useState<PozycjaForm[]>(() => pozycjeZSablonu(SZABLON_KGW_MINI));

  if (wsie.length === 0) return null;

  const wybranaWies = wsie.find((w) => w.id === wies);

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/50 via-white to-amber-50/30 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-serif text-lg text-green-950">Pakiet KGW / kiermasz</h2>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-stone-600">
            Dodaj do 20 produktów naraz — każde jako osobne ogłoszenie do akceptacji sołtysa. Na festynie wystaw kod QR do
            panelu lub wypełnij szablon kiermaszu poniżej.
          </p>
        </div>
        <Link
          href="/panel/mieszkaniec/marketplace"
          className="shrink-0 text-xs font-semibold text-green-800 underline"
        >
          QR / link do panelu →
        </Link>
      </div>

      {blad ? (
        <p className="mt-3 text-sm text-red-800" role="alert">
          {blad}
        </p>
      ) : null}
      {sukces ? (
        <p className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900" role="status">
          {sukces}
        </p>
      ) : null}

      <label className="mt-4 block text-sm">
        Wieś
        <select
          value={wies}
          onChange={(e) => ustawWies(e.target.value)}
          className="mt-1 block max-w-xs rounded-lg border border-stone-300 bg-white px-2 py-1.5"
        >
          {wsie.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-950 hover:bg-amber-100"
          onClick={() => {
            ustawPozycje(pozycjeZSablonu(SZABLON_KGW_KIERMASZ));
            ustawSukces("");
            ustawBlad("");
          }}
        >
          🌾 Szablon kiermasz (20 produktów)
        </button>
        <button
          type="button"
          className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
          onClick={() => {
            ustawPozycje(pozycjeZSablonu(SZABLON_KGW_MINI));
            ustawSukces("");
          }}
        >
          3 produkty (szybki start)
        </button>
        <button
          type="button"
          className="text-xs text-stone-600 underline"
          onClick={() =>
            pozycje.length < 20 &&
            ustawPozycje([
              ...pozycje,
              { title: "", equipmentCategory: "inne_jedzenie", listingType: "sprzedam", priceAmount: "" },
            ])
          }
          disabled={pozycje.length >= 20}
        >
          + pozycja ({pozycje.length}/20)
        </button>
      </div>

      <ul className="mt-4 max-h-[min(420px,55dvh)] space-y-2 overflow-y-auto pr-1">
        {pozycje.map((p, i) => (
          <li key={i} className="grid gap-2 rounded-lg border border-stone-100 bg-white p-2 sm:grid-cols-[1fr_140px_90px]">
            <input
              value={p.title}
              onChange={(e) => {
                const next = [...pozycje];
                next[i] = { ...next[i], title: e.target.value };
                ustawPozycje(next);
              }}
              className="rounded border border-stone-300 px-2 py-1 text-sm"
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
            <input
              value={p.priceAmount}
              onChange={(e) => {
                const next = [...pozycje];
                next[i] = { ...next[i], priceAmount: e.target.value };
                ustawPozycje(next);
              }}
              inputMode="decimal"
              className="rounded border border-stone-300 px-2 py-1 text-sm"
              placeholder="Cena zł"
            />
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={czek}
          className="rounded-lg bg-green-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-900 disabled:opacity-50"
          onClick={() => {
            ustawBlad("");
            ustawSukces("");
            const ok = pozycje.filter((p) => p.title.trim().length >= 3);
            if (ok.length === 0) {
              ustawBlad("Podaj co najmniej jeden tytuł (min. 3 znaki).");
              return;
            }
            if (ok.length > 20) {
              ustawBlad("Maksymalnie 20 pozycji w pakiecie.");
              return;
            }
            startT(async () => {
              const w = await dodajPakietOgloszenKgw({
                villageId: wies,
                pozycje: ok.map((p) => {
                  const cena = p.priceAmount.trim().replace(",", ".");
                  const kwota = cena ? Number.parseFloat(cena) : null;
                  return {
                    listingType: "sprzedam",
                    title: p.title.trim(),
                    equipmentCategory: p.equipmentCategory || null,
                    priceAmount: kwota != null && Number.isFinite(kwota) ? kwota : null,
                  };
                }),
              });
              if ("blad" in w) {
                ustawBlad(w.blad);
                return;
              }
              const n = w.dodano ?? ok.length;
              ustawSukces(
                `Wysłano ${n} ogłoszeń do moderacji sołtysa we wsi ${wybranaWies?.name ?? ""}. Po zatwierdzeniu pojawią się na rynku — uzupełnij opisy i zdjęcia w edycji.`,
              );
              router.refresh();
            });
          }}
        >
          {czek ? "Wysyłanie…" : `Wyślij pakiet (${pozycje.filter((p) => p.title.trim().length >= 3).length} poz.)`}
        </button>
        <p className="text-xs text-stone-500">Sołtys zatwierdza każde ogłoszenie — bez płatności w serwisie.</p>
      </div>
    </section>
  );
}
