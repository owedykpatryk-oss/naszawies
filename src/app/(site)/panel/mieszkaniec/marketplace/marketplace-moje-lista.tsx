"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ObrazR2 } from "@/components/media/obraz-r2";
import { DNI_WAZNOSCI_OGLOSZENIA_RYNEK } from "@/lib/marketplace/waznosc-ogloszenia";
import { etykietaTypuOgloszenia } from "@/lib/marketplace/kategorie-ogloszen";
import {
  aktywujPonownieOgloszenieMarketplace,
  archiwizujOgloszenieMarketplaceMieszkanca,
} from "./akcje";

export type MojeOgloszenieWiersz = {
  id: string;
  title: string;
  status: string;
  listing_type: string;
  created_at: string;
  expires_at: string | null;
  moderation_note: string | null;
  image_url?: string | null;
  hrefPubliczny?: string | null;
};

const MS_W_TYGODNIU = 7 * 24 * 60 * 60 * 1000;

function dniDoWygasniecia(expiresAt: string): number {
  return Math.ceil((Date.parse(expiresAt) - Date.now()) / (24 * 60 * 60 * 1000));
}

const ETYKIETA_STATUS: Record<string, string> = {
  pending: "Oczekuje na zatwierdzenie",
  approved: "Opublikowane",
  rejected: "Odrzucone",
  archived: "Wygasłe / zarchiwizowane",
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
          Nie masz jeszcze ogłoszeń. Wypełnij formularz poniżej — sołtys zatwierdzi publikację na profilu wsi (
          {DNI_WAZNOSCI_OGLOSZENIA_RYNEK} dni widoczności).
        </p>
      </section>
    );
  }

  return (
    <section className="mt-8">
      <h2 className="font-serif text-xl text-green-950">Twoje ogłoszenia</h2>
      <p className="mt-1 text-xs text-stone-600">
        Każde ogłoszenie jest widoczne {DNI_WAZNOSCI_OGLOSZENIA_RYNEK} dni. Po wygaśnięciu użyj „Aktywuj ponownie” —
        bez przedłużania w trakcie trwania.
      </p>
      {blad ? (
        <p className="mt-2 text-sm text-red-800" role="alert">
          {blad}
        </p>
      ) : null}
      <ul className="mt-3 divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white text-sm">
        {ogloszenia.map((o) => {
          const wygasaWkrotce =
            o.status === "approved" &&
            o.expires_at != null &&
            Date.parse(o.expires_at) - Date.now() < MS_W_TYGODNIU &&
            Date.parse(o.expires_at) > Date.now();
          const dni = o.expires_at ? dniDoWygasniecia(o.expires_at) : null;
          const wygaslo =
            o.status === "archived" ||
            (o.status === "approved" && o.expires_at != null && Date.parse(o.expires_at) <= Date.now());

          return (
            <li key={o.id} className="px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-3">
                  {o.image_url ? (
                    <ObrazR2
                      src={o.image_url}
                      preset="miniatura"
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-lg object-cover ring-1 ring-stone-200"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-dashed border-orange-200 bg-orange-50/50 text-lg text-stone-400">
                      🏷️
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-stone-900">{o.title}</p>
                    <p className="mt-1 text-xs text-stone-600">
                      {etykietaTypuOgloszenia(o.listing_type)} · {ETYKIETA_STATUS[o.status] ?? o.status}
                    </p>
                    {o.expires_at && o.status === "approved" ? (
                      <p className={`mt-1 text-xs ${wygasaWkrotce ? "font-semibold text-amber-800" : "text-stone-500"}`}>
                        {wygasaWkrotce && dni != null
                          ? `Wygasa za ${dni} ${dni === 1 ? "dzień" : "dni"} (${new Date(o.expires_at).toLocaleDateString("pl-PL")})`
                          : `Widoczne do ${new Date(o.expires_at).toLocaleDateString("pl-PL")}`}
                      </p>
                    ) : null}
                    {wygasaWkrotce ? (
                      <p className="mt-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-950">
                        Po wygaśnięciu ogłoszenie zniknie z rynku. Aktywuj je ponownie, jeśli nadal aktualne.
                      </p>
                    ) : null}
                    {o.status === "archived" ? (
                      <p className="mt-1 text-xs text-stone-500">
                        Nie jest widoczne na rynku. Aktywacja przywraca widoczność na kolejne {DNI_WAZNOSCI_OGLOSZENIA_RYNEK}{" "}
                        dni.
                      </p>
                    ) : null}
                    {o.status === "rejected" && o.moderation_note ? (
                      <p className="mt-2 rounded-lg bg-red-50 px-2 py-1 text-xs text-red-900">
                        Powód: {o.moderation_note}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {o.hrefPubliczny && o.status === "approved" && !wygaslo ? (
                    <Link
                      href={o.hrefPubliczny}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-950 hover:bg-orange-100"
                    >
                      Zobacz na rynku
                    </Link>
                  ) : null}
                  {["pending", "approved", "rejected"].includes(o.status) ? (
                    <Link
                      href={`/panel/mieszkaniec/marketplace/${o.id}/edytuj`}
                      className="rounded-lg border border-stone-300 px-3 py-1 text-xs font-medium text-stone-800 hover:bg-stone-50"
                    >
                      Edytuj
                    </Link>
                  ) : null}
                  {o.status === "archived" ? (
                    <button
                      type="button"
                      disabled={!!czek}
                      className="rounded-lg border border-green-800 bg-green-50 px-3 py-1 text-xs font-medium text-green-900 hover:bg-green-100 disabled:opacity-50"
                      onClick={() => {
                        if (
                          !confirm(
                            `Aktywować ogłoszenie na kolejne ${DNI_WAZNOSCI_OGLOSZENIA_RYNEK} dni? Będzie znów widoczne na rynku wsi.`,
                          )
                        ) {
                          return;
                        }
                        ustawBlad("");
                        startT(async () => {
                          const w = await aktywujPonownieOgloszenieMarketplace(o.id);
                          if ("blad" in w) {
                            ustawBlad(w.blad);
                            return;
                          }
                          router.refresh();
                        });
                      }}
                    >
                      Aktywuj ponownie
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
          );
        })}
      </ul>
    </section>
  );
}
