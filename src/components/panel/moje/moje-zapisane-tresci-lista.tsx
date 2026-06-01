"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { ZapisanaTresc } from "@/lib/panel/pobierz-moje-powiazania";
import { usunZapisanaTresc } from "@/app/(site)/panel/moje/akcje";

export function MojeZapisaneTresciLista({ tresci }: { tresci: ZapisanaTresc[] }) {
  const router = useRouter();
  const [czek, startT] = useTransition();

  if (tresci.length === 0) {
    return (
      <p className="text-sm text-stone-600">
        Nie masz jeszcze zapisanych treści. Na profilu wsi użyj „Zapisz w ulubionych” przy ogłoszeniu, wydarzeniu,
        wpisie kroniki lub ofercie na rynku lokalnym.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {tresci.map((t) => (
        <li key={t.id} className="karta-wow flex flex-wrap items-start justify-between gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500">
              {t.content_type === "post"
                ? "Ogłoszenie"
                : t.content_type === "event"
                  ? "Wydarzenie"
                  : t.content_type === "history"
                    ? "Kronika"
                    : "Rynek lokalny"}{" "}
              · {t.nazwaWsi}
            </p>
            <Link href={t.href_cache} className="mt-1 block font-medium text-green-950 hover:underline">
              {t.title_cache}
            </Link>
            <p className="mt-1 text-xs text-stone-500">
              Zapisano {new Date(t.created_at).toLocaleDateString("pl-PL")}
              {t.content_type === "listing" && t.watch_price ? " · 🔔 obserwujesz cenę" : null}
            </p>
          </div>
          <button
            type="button"
            disabled={czek}
            onClick={() => {
              startT(async () => {
                await usunZapisanaTresc(t.id);
                router.refresh();
              });
            }}
            className="shrink-0 text-xs font-medium text-red-800 underline disabled:opacity-50"
          >
            Usuń
          </button>
        </li>
      ))}
    </ul>
  );
}
