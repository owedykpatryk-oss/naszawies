"use client";

import { FormEvent, useState, useTransition } from "react";
import {
  dodajZajetoscKalendarzaSaliSoltysa,
  usunZajetoscKalendarzaSaliSoltysa,
} from "@/app/(site)/panel/soltys/akcje-kalendarz-sali-soltys";

export type WpisKalendarzaSoli = {
  id: string;
  start_at: string;
  end_at: string;
  event_title: string | null;
  event_type: string;
};

type Props = {
  hallId: string;
  wpisy: WpisKalendarzaSoli[];
};

function formatZakres(a: string, b: string) {
  const s = new Date(a).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });
  const e = new Date(b).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });
  return `${s} — ${e}`;
}

export function KalendarzZajetosciSoltysKlient({ hallId, wpisy }: Props) {
  const [blad, ustawBlad] = useState("");
  const [ok, ustawOk] = useState("");
  const [czek, startT] = useTransition();

  function dodaj(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    ustawBlad("");
    ustawOk("");
    const fd = new FormData(e.currentTarget);
    const data = String(fd.get("data") ?? "");
    const godzStart = String(fd.get("godz_start") ?? "");
    const godzKoniec = String(fd.get("godz_koniec") ?? "");
    if (!data || !godzStart || !godzKoniec) {
      ustawBlad("Wybierz datę i godziny.");
      return;
    }
    const startAt = new Date(`${data}T${godzStart}:00`);
    const endAt = new Date(`${data}T${godzKoniec}:00`);
    startT(async () => {
      const w = await dodajZajetoscKalendarzaSaliSoltysa({
        hallId,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        opis: String(fd.get("opis") ?? "") || null,
      });
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawOk("Dodano zajęty termin — widać na mapie i profilu wsi.");
      e.currentTarget.reset();
    });
  }

  function usun(bookingId: string) {
    if (!confirm("Usunąć ten termin z kalendarza?")) return;
    ustawBlad("");
    startT(async () => {
      const w = await usunZajetoscKalendarzaSaliSoltysa(bookingId, hallId);
      if ("blad" in w) ustawBlad(w.blad);
      else ustawOk("Usunięto termin.");
    });
  }

  const nadchodzace = wpisy
    .filter((w) => Date.parse(w.end_at) >= Date.now())
    .sort((a, b) => Date.parse(a.start_at) - Date.parse(b.start_at));

  return (
    <section id="kalendarz-zajetosci-sali" className="scroll-mt-24 mt-10 rounded-2xl border border-emerald-200/80 bg-emerald-50/30 p-5 sm:p-6">
      <h2 className="font-serif text-xl text-green-950">Kalendarz zajętości sali</h2>
      <p className="mt-1 text-sm text-stone-600">
        <strong>Tylko sołtys</strong> uzupełnia kalendarz — mieszkańcy widzą wolne/zajęte terminy, ale nie składają wniosków
        online. Wpisy od razu blokują salę na mapie i profilu wsi.
      </p>

      {blad ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {blad}
        </p>
      ) : null}
      {ok ? (
        <p className="mt-3 rounded-lg bg-emerald-100 px-3 py-2 text-sm text-emerald-950" role="status">
          {ok}
        </p>
      ) : null}

      <form onSubmit={dodaj} className="mt-4 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2">
        <p className="sm:col-span-2 text-sm font-medium text-stone-800">Dodaj zajęty termin</p>
        <label className="text-sm">
          Data
          <input name="data" type="date" required className="mt-1 block w-full rounded-lg border border-stone-300 px-2 py-1.5" />
        </label>
        <label className="text-sm">
          Opis (opcjonalnie)
          <input
            name="opis"
            maxLength={200}
            placeholder="np. zajęcia KGW, remont"
            className="mt-1 block w-full rounded-lg border border-stone-300 px-2 py-1.5"
          />
        </label>
        <label className="text-sm">
          Od
          <input name="godz_start" type="time" required className="mt-1 block w-full rounded-lg border border-stone-300 px-2 py-1.5" />
        </label>
        <label className="text-sm">
          Do
          <input name="godz_koniec" type="time" required className="mt-1 block w-full rounded-lg border border-stone-300 px-2 py-1.5" />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={czek}
            className="rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-50"
          >
            {czek ? "Zapisuję…" : "Dodaj do kalendarza"}
          </button>
        </div>
      </form>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-stone-800">Nadchodzące zajęcia ({nadchodzace.length})</h3>
        {nadchodzace.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">Brak wpisów — sala wyświetla się jako wolna.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {nadchodzace.map((w) => (
              <li
                key={w.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2"
              >
                <div>
                  <p className="font-medium text-stone-900">{formatZakres(w.start_at, w.end_at)}</p>
                  {w.event_title ? <p className="text-xs text-stone-600">{w.event_title}</p> : null}
                </div>
                <button
                  type="button"
                  onClick={() => usun(w.id)}
                  disabled={czek}
                  className="text-xs font-medium text-red-800 underline disabled:opacity-50"
                >
                  Usuń
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
