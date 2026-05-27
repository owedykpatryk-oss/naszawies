"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { PasekMasowychAkcji } from "@/components/panel/pasek-masowych-akcji";
import { zatwierdzRynekMasowoSoltys } from "./akcje-masowe";
import {
  odrzucMarketplaceOferteMieszkanca,
  odrzucOfertePomocySasiedzkiej,
  zatwierdzMarketplaceOferteMieszkanca,
  zatwierdzOfertePomocySasiedzkiej,
} from "./akcje";
import { etykietaKategoriiSprzetu, etykietaTypuOgloszenia } from "@/lib/marketplace/kategorie-ogloszen";

type Wiersz = {
  id: string;
  title: string;
  typ: "marketplace" | "pomoc";
  wies: string;
  listing_type?: string | null;
  equipment_category?: string | null;
  description?: string | null;
  image_urls?: string[] | null;
};

export function SoltysModeracjaRynekKlient({ wiersze }: { wiersze: Wiersz[] }) {
  const router = useRouter();
  const [blad, ustawBlad] = useState("");
  const [czek, startT] = useTransition();
  const [odrzucId, ustawOdrzucId] = useState<string | null>(null);
  const [notatka, ustawNotatka] = useState("");
  const [zaznaczoneRynek, ustawZaznaczoneRynek] = useState<Set<string>>(new Set());
  const [filtrTyp, ustawFiltrTyp] = useState<"" | "marketplace" | "pomoc">("");
  const [filtrWies, ustawFiltrWies] = useState("");

  const wiesOpcje = useMemo(() => Array.from(new Set(wiersze.map((w) => w.wies))).sort(), [wiersze]);

  const widoczne = useMemo(() => {
    return wiersze.filter((w) => {
      if (filtrTyp && w.typ !== filtrTyp) return false;
      if (filtrWies && w.wies !== filtrWies) return false;
      return true;
    });
  }, [wiersze, filtrTyp, filtrWies]);

  if (wiersze.length === 0) return null;

  return (
    <section className="mt-8 rounded-xl border border-orange-200 bg-orange-50/40 p-4">
      <h2 className="font-serif text-lg text-green-950">Do moderacji (mieszkańcy)</h2>
      <p className="mt-1 text-xs text-stone-600">
        Rynek lokalny i pomoc sąsiedzka. Przy odrzuceniu autor dostaje powiadomienie z krótką notatką.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <select
          value={filtrTyp}
          onChange={(e) => ustawFiltrTyp(e.target.value as "" | "marketplace" | "pomoc")}
          className="rounded-lg border border-stone-300 px-2 py-1.5 text-xs"
        >
          <option value="">Wszystkie typy</option>
          <option value="marketplace">Rynek</option>
          <option value="pomoc">Pomoc sąsiedzka</option>
        </select>
        <select
          value={filtrWies}
          onChange={(e) => ustawFiltrWies(e.target.value)}
          className="rounded-lg border border-stone-300 px-2 py-1.5 text-xs"
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
          onClick={() =>
            ustawZaznaczoneRynek(new Set(widoczne.filter((w) => w.typ === "marketplace").map((w) => w.id)))
          }
          className="rounded-lg border border-stone-300 px-2 py-1 text-xs hover:bg-white"
        >
          Zaznacz ogłoszenia rynku
        </button>
      </div>

      {blad ? (
        <p className="mt-2 text-sm text-red-800" role="alert">
          {blad}
        </p>
      ) : null}
      <ul className="mt-3 space-y-3">
        {widoczne.map((w) => (
          <li key={`${w.typ}-${w.id}`} className="rounded-lg bg-white px-3 py-3 text-sm shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex min-w-0 items-start gap-2">
                {w.typ === "marketplace" ? (
                  <input
                    type="checkbox"
                    checked={zaznaczoneRynek.has(w.id)}
                    onChange={() =>
                      ustawZaznaczoneRynek((prev) => {
                        const n = new Set(prev);
                        if (n.has(w.id)) n.delete(w.id);
                        else n.add(w.id);
                        return n;
                      })
                    }
                    className="mt-1 h-4 w-4 rounded border-stone-300"
                  />
                ) : null}
                <div className="min-w-0">
                  <span className="text-xs uppercase text-stone-500">{w.typ === "marketplace" ? "Rynek" : "Pomoc"}</span>
                  <p className="font-medium text-stone-900">{w.title}</p>
                  <p className="text-xs text-stone-500">{w.wies}</p>
                  {w.typ === "marketplace" && w.listing_type ? (
                    <p className="mt-1 text-xs text-stone-600">
                      {etykietaTypuOgloszenia(w.listing_type)}
                      {w.equipment_category ? ` · ${etykietaKategoriiSprzetu(w.equipment_category)}` : ""}
                    </p>
                  ) : null}
                  {w.description ? (
                    <p className="mt-2 line-clamp-3 text-xs text-stone-700">{w.description}</p>
                  ) : null}
                  {(w.image_urls ?? []).length > 0 ? (
                    <div className="mt-2 flex gap-1">
                      {(w.image_urls ?? []).slice(0, 3).map((url) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={url} src={url} alt="" className="h-12 w-12 rounded object-cover" />
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!!czek}
                  className="rounded-lg bg-green-800 px-3 py-1 text-xs font-medium text-white hover:bg-green-900 disabled:opacity-50"
                  onClick={() => {
                    ustawBlad("");
                    startT(async () => {
                      const wynik =
                        w.typ === "marketplace"
                          ? await zatwierdzMarketplaceOferteMieszkanca(w.id)
                          : await zatwierdzOfertePomocySasiedzkiej(w.id);
                      if ("blad" in wynik) {
                        ustawBlad(wynik.blad);
                        return;
                      }
                      router.refresh();
                    });
                  }}
                >
                  Zatwierdź
                </button>
                <button
                  type="button"
                  disabled={!!czek}
                  className="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-800 hover:bg-red-50 disabled:opacity-50"
                  onClick={() => {
                    ustawOdrzucId(w.id);
                    ustawNotatka("");
                  }}
                >
                  Odrzuć
                </button>
              </div>
            </div>
            {odrzucId === w.id ? (
              <div className="mt-3 border-t border-stone-100 pt-3">
                <label className="mb-1 block text-xs font-medium text-stone-700">Powód odrzucenia</label>
                <textarea
                  value={notatka}
                  onChange={(e) => ustawNotatka(e.target.value)}
                  rows={2}
                  className="w-full rounded border border-stone-300 px-2 py-1 text-sm"
                  placeholder="Np. brak opisu, nieczytelne zdjęcie…"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    disabled={!!czek}
                    className="rounded-lg bg-red-800 px-3 py-1 text-xs text-white disabled:opacity-50"
                    onClick={() => {
                      ustawBlad("");
                      startT(async () => {
                        const wynik =
                          w.typ === "marketplace"
                            ? await odrzucMarketplaceOferteMieszkanca(w.id, notatka)
                            : await odrzucOfertePomocySasiedzkiej(w.id, notatka);
                        if ("blad" in wynik) {
                          ustawBlad(wynik.blad);
                          return;
                        }
                        ustawOdrzucId(null);
                        router.refresh();
                      });
                    }}
                  >
                    Potwierdź odrzucenie
                  </button>
                  <button
                    type="button"
                    className="text-xs text-stone-600 underline"
                    onClick={() => ustawOdrzucId(null)}
                  >
                    Anuluj
                  </button>
                </div>
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      <PasekMasowychAkcji
        liczbaZaznaczonych={zaznaczoneRynek.size}
        etykietaAkcji="Zatwierdź zaznaczone ogłoszenia"
        onZatwierdz={async () => {
          const w = await zatwierdzRynekMasowoSoltys(Array.from(zaznaczoneRynek));
          if ("blad" in w) return { blad: w.blad };
          return { zatwierdzono: w.zatwierdzono, pominieto: w.pominieto };
        }}
        onPoSukcesie={() => {
          ustawZaznaczoneRynek(new Set());
          router.refresh();
        }}
      />
    </section>
  );
}
