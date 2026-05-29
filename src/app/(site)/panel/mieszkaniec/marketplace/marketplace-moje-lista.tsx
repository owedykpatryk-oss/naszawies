"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { etykietaTypuOgloszenia } from "@/lib/marketplace/kategorie-ogloszen";
import {
  archiwizujOgloszenieMarketplaceMieszkanca,
  przedluzWaznoscOgloszeniaMarketplace,
} from "./akcje";

export type MojeOgloszenieWiersz = {
  id: string;
  title: string;
  status: string;
  listing_type: string;
  created_at: string;
  expires_at: string | null;
  moderation_note: string | null;
};

const ETYKIETA_STATUS: Record<string, string> = {
  pending: "Oczekuje na zatwierdzenie",
  approved: "Opublikowane",
  rejected: "Odrzucone",
  archived: "Zarchiwizowane",
  draft: "Szkic",
};

export function MarketplaceMojeLista({ ogloszenia }: { ogloszenia: MojeOgloszenieWiersz[] }) {
  const router = useRouter();
  const [blad, ustawBlad] = useState("");
  const [czek, startT] = useTransition();

  if (ogloszenia.length === 0) {
    return (
      <section className="mt-8 rounded-2xl border border-dashed border-orange-200/70 bg-orange-50/30 px-4 py-8 text-center">
        <p className="text-2xl" aria-hidden>
          🏷️
        </p>
        <h2 className="mt-2 font-serif text-xl text-green-950">Twoje ogłoszenia</h2>
        <p className="mt-2 text-sm text-stone-600">
          Nie masz jeszcze ogłoszeń. Wypełnij formularz poniżej — sołtys zatwierdzi publikację na profilu wsi.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-8">
      <h2 className="font-serif text-xl text-green-950">Twoje ogłoszenia</h2>
      {blad ? (
        <p className="mt-2 text-sm text-red-800" role="alert">
          {blad}
        </p>
      ) : null}
      <ul className="mt-3 divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white text-sm">
        {ogloszenia.map((o) => (
          <li key={o.id} className="px-4 py-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-stone-900">{o.title}</p>
                <p className="mt-1 text-xs text-stone-600">
                  {etykietaTypuOgloszenia(o.listing_type)} · {ETYKIETA_STATUS[o.status] ?? o.status}
                </p>
                {o.expires_at && o.status === "approved" ? (
                  <p className="mt-1 text-xs text-stone-500">
                    Ważne do {new Date(o.expires_at).toLocaleDateString("pl-PL")}
                  </p>
                ) : null}
                {o.status === "rejected" && o.moderation_note ? (
                  <p className="mt-2 rounded-lg bg-red-50 px-2 py-1 text-xs text-red-900">
                    Powód: {o.moderation_note}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {["pending", "approved", "rejected"].includes(o.status) ? (
                  <Link
                    href={`/panel/mieszkaniec/marketplace/${o.id}/edytuj`}
                    className="rounded-lg border border-stone-300 px-3 py-1 text-xs font-medium text-stone-800 hover:bg-stone-50"
                  >
                    Edytuj
                  </Link>
                ) : null}
                {o.status === "approved" ? (
                  <button
                    type="button"
                    disabled={!!czek}
                    className="rounded-lg border border-green-800 px-3 py-1 text-xs font-medium text-green-900 hover:bg-green-50 disabled:opacity-50"
                    onClick={() => {
                      ustawBlad("");
                      startT(async () => {
                        const w = await przedluzWaznoscOgloszeniaMarketplace(o.id, 30);
                        if ("blad" in w) {
                          ustawBlad(w.blad);
                          return;
                        }
                        router.refresh();
                      });
                    }}
                  >
                    +30 dni
                  </button>
                ) : null}
                {o.status !== "archived" ? (
                  <button
                    type="button"
                    disabled={!!czek}
                    className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-800 hover:bg-red-50 disabled:opacity-50"
                    onClick={() => {
                      if (!confirm("Zarchiwizować to ogłoszenie? Zniknie z profilu wsi.")) return;
                      ustawBlad("");
                      startT(async () => {
                        const w = await archiwizujOgloszenieMarketplaceMieszkanca(o.id);
                        if ("blad" in w) {
                          ustawBlad(w.blad);
                          return;
                        }
                        router.refresh();
                      });
                    }}
                  >
                    Usuń
                  </button>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
