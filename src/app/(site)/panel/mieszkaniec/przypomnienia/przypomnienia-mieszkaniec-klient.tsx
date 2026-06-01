"use client";

import Link from "next/link";
import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ETYKIETY_RODZAJU_PRZYPOMNIENIA,
  type PreferencjePrzypomnien,
  type RodzajPrzypomnienia,
} from "@/lib/przypomnienia/rodzaje";
import { nazwaDniaTygodnia } from "@/lib/wies/teksty-dotacji";
import { zapiszPreferencjePrzypomnienMieszkanca } from "./akcje";

export type WiesPrzypomnien = {
  villageId: string;
  nazwa: string;
  sciezkaWsi: string | null;
  prefs: PreferencjePrzypomnien;
  reguly: {
    id: string;
    kind: RodzajPrzypomnienia;
    title: string;
    recurrence: string;
    day_of_week: number | null;
    day_of_month: number | null;
    month: number | null;
    days_before: number;
    nastepny: string | null;
  }[];
};

function opisReguly(r: WiesPrzypomnien["reguly"][0]): string {
  if (r.recurrence === "weekly" && r.day_of_week != null) {
    return `Co ${nazwaDniaTygodnia(r.day_of_week).toLowerCase()}`;
  }
  if (r.recurrence === "yearly" && r.month != null && r.day_of_month != null) {
    return `Co roku: ${r.day_of_month}.${r.month}`;
  }
  if (r.recurrence === "monthly" && r.day_of_month != null) {
    return `Co miesiąc: ${r.day_of_month}.`;
  }
  return "";
}

export function PrzypomnieniaMieszkaniecKlient({ wsie }: { wsie: WiesPrzypomnien[] }) {
  const router = useRouter();
  const [blad, ustawBlad] = useState("");
  const [komunikat, ustawKomunikat] = useState("");
  const [czek, startT] = useTransition();

  function onZapisz(e: FormEvent<HTMLFormElement>, villageId: string) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    ustawBlad("");
    ustawKomunikat("");
    startT(async () => {
      const w = await zapiszPreferencjePrzypomnienMieszkanca({
        villageId,
        notify_smieci: fd.get("notify_smieci") === "on",
        notify_podatek: fd.get("notify_podatek") === "on",
        notify_dzialka: fd.get("notify_dzialka") === "on",
        notify_pszok: fd.get("notify_pszok") === "on",
        notify_inne: fd.get("notify_inne") === "on",
      });
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawKomunikat("Zapisano preferencje powiadomień.");
      router.refresh();
    });
  }

  if (wsie.length === 0) {
    return (
      <div className="panel-karta mt-6 text-sm text-stone-700">
        <p>Nie masz jeszcze aktywnej roli mieszkańca w żadnej wsi.</p>
        <Link href="/panel/moje/wies" className="mt-3 inline-block font-medium text-green-800 underline">
          Dodaj lub obserwuj miejscowość →
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-8">
      <p className="text-sm text-stone-600">
        Powiadomienia wysyłane są automatycznie (cron co kilka godzin). Domyślnie wszystkie kategorie są włączone — możesz
        wyłączyć np. podatki, jeśli nie dotyczą Twojej sytuacji.
      </p>
      {komunikat ? (
        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900">{komunikat}</p>
      ) : null}
      {blad ? <p className="text-sm text-red-800">{blad}</p> : null}

      {wsie.map((w) => (
        <section key={w.villageId} className="panel-karta space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-serif text-lg text-green-950">{w.nazwa}</h2>
            {w.sciezkaWsi ? (
              <Link href={`${w.sciezkaWsi}#przewodnik-samorzadowy`} className="text-sm text-green-800 underline">
                Przewodnik wsi (śmieci, urząd) →
              </Link>
            ) : null}
          </div>

          {w.reguly.length === 0 ? (
            <p className="text-sm text-stone-600">
              Sołtys nie skonfigurował jeszcze automatycznych przypomnień dla tej wsi. Możesz poprosić o ustawienie w
              urzędzie wiejskim.
            </p>
          ) : (
            <ul className="space-y-2 text-sm text-stone-700">
              {w.reguly.map((r) => (
                <li key={r.id} className="rounded-lg border border-stone-100 bg-stone-50/80 px-3 py-2">
                  <span className="font-medium text-green-950">{r.title}</span>
                  <span className="text-stone-500"> — {ETYKIETY_RODZAJU_PRZYPOMNIENIA[r.kind]}</span>
                  {opisReguly(r) ? <span className="block text-xs text-stone-500">{opisReguly(r)}</span> : null}
                  {r.nastepny ? (
                    <span className="block text-xs font-medium text-teal-900">Następny termin: {r.nastepny}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={(e) => onZapisz(e, w.villageId)} className="space-y-3 border-t border-stone-100 pt-4">
            <p className="text-sm font-medium text-stone-800">Chcę dostawać powiadomienia o:</p>
            {(
              [
                ["notify_smieci", "smieci"],
                ["notify_podatek", "podatek"],
                ["notify_dzialka", "dzialka"],
                ["notify_pszok", "pszok"],
                ["notify_inne", "inne"],
              ] as const
            ).map(([pole, kind]) => (
              <label key={pole} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name={pole}
                  defaultChecked={w.prefs[pole]}
                  className="rounded border-stone-300"
                />
                {ETYKIETY_RODZAJU_PRZYPOMNIENIA[kind]}
              </label>
            ))}
            <button
              type="submit"
              disabled={czek}
              className="rounded-xl bg-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-green-900 disabled:opacity-50"
            >
              {czek ? "Zapisuję…" : "Zapisz dla tej wsi"}
            </button>
          </form>
        </section>
      ))}
    </div>
  );
}
