"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ObrazR2 } from "@/components/media/obraz-r2";
import { skrotCzasWiadomosci, skrotPodgladuWiadomosci } from "@/lib/czat/formatuj-czas-wiadomosci";
import { etykietaPresetu } from "@/lib/czat/grupy-preset";

export type WierszKonwersacjiCzat = {
  id: string;
  tytul: string;
  wies: string;
  kind: string;
  preset: string | null;
  listing_id: string | null;
  listing_image_url: string | null;
  updated_at: string;
  ostatnia_wiadomosc: string | null;
  ostatnia_wiadomosc_at: string | null;
  ostatnia_od_mnie: boolean;
  nieprzeczytane: number;
};

type FiltrInbox = "wszystkie" | "nieprzeczytane" | "grupy" | "ogloszenia";

export function CzatListaKonwersacjiKlient({ konwersacje }: { konwersacje: WierszKonwersacjiCzat[] }) {
  const [fraza, ustawFraze] = useState("");
  const [filtr, ustawFiltr] = useState<FiltrInbox>("wszystkie");

  const widoczne = useMemo(() => {
    const q = fraza.trim().toLowerCase();
    return konwersacje.filter((k) => {
      if (filtr === "nieprzeczytane" && k.nieprzeczytane === 0) return false;
      if (filtr === "grupy" && k.kind !== "group") return false;
      if (filtr === "ogloszenia" && !k.listing_id) return false;
      if (!q) return true;
      const haystack = [k.tytul, k.wies, k.ostatnia_wiadomosc, k.preset ? etykietaPresetu(k.preset) : ""]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [konwersacje, fraza, filtr]);

  const filtry: { id: FiltrInbox; label: string }[] = [
    { id: "wszystkie", label: "Wszystkie" },
    { id: "nieprzeczytane", label: "Nieprzeczytane" },
    { id: "grupy", label: "Grupy" },
    { id: "ogloszenia", label: "Przy ogłoszeniach" },
  ];

  if (konwersacje.length === 0) {
    return (
      <p className="mt-8 rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-10 text-center text-sm text-stone-600">
        Brak rozmów — dołącz do grupy powyżej lub napisz z ogłoszenia na rynku lokalnym.
      </p>
    );
  }

  return (
    <section className="mt-6">
      <div className="rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 p-3 sm:p-4">
          <input
            value={fraza}
            onChange={(e) => ustawFraze(e.target.value)}
            placeholder="Szukaj rozmowy…"
            className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-sm focus:border-green-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-200"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {filtry.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => ustawFiltr(f.id)}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                  filtr === f.id
                    ? "border-green-800 bg-green-800 text-white"
                    : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-stone-500">
            {widoczne.length} {widoczne.length === 1 ? "rozmowa" : "rozmów"}
          </p>
        </div>

        {widoczne.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-stone-500">Brak rozmów dla wybranych filtrów.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {widoczne.map((k) => {
              const czas = k.ostatnia_wiadomosc_at ?? k.updated_at;
              const podglad = k.ostatnia_wiadomosc
                ? `${k.ostatnia_od_mnie ? "Ty: " : ""}${skrotPodgladuWiadomosci(k.ostatnia_wiadomosc)}`
                : "Brak wiadomości";

              return (
                <li key={k.id}>
                  <Link
                    href={`/panel/czat/${k.id}`}
                    className={`flex items-start gap-3 px-4 py-3 transition hover:bg-stone-50 ${
                      k.nieprzeczytane > 0 ? "bg-green-50/40" : ""
                    }`}
                  >
                    {k.listing_image_url ? (
                      <ObrazR2
                        src={k.listing_image_url}
                        preset="miniatura"
                        alt=""
                        className="mt-0.5 h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-orange-200/80"
                      />
                    ) : (
                      <div
                        className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                          k.kind === "group" ? "bg-violet-100 text-violet-900" : "bg-orange-100 text-orange-900"
                        }`}
                        aria-hidden
                      >
                        {k.kind === "group" ? "G" : "💬"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`truncate ${k.nieprzeczytane > 0 ? "font-semibold text-stone-900" : "font-medium text-stone-900"}`}>
                          {k.tytul}
                        </p>
                        <span className="shrink-0 text-[11px] text-stone-400">{skrotCzasWiadomosci(czas)}</span>
                      </div>
                      <p className="text-xs text-stone-500">
                        {k.wies}
                        {k.kind === "group" ? " · grupa" : k.listing_id ? " · ogłoszenie" : " · rozmowa"}
                      </p>
                      <p className={`mt-0.5 truncate text-sm ${k.nieprzeczytane > 0 ? "font-medium text-stone-800" : "text-stone-600"}`}>
                        {podglad}
                      </p>
                    </div>
                    {k.nieprzeczytane > 0 ? (
                      <span className="mt-1 shrink-0 rounded-full bg-green-800 px-2 py-0.5 text-[10px] font-bold text-white">
                        {k.nieprzeczytane > 99 ? "99+" : k.nieprzeczytane}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
