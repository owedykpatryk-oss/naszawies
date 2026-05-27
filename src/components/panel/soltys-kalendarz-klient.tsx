"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  dodajWpisKalendarzaSoltys,
  oznaczWpisKalendarzaJakoGotowy,
  usunWpisKalendarzaSoltys,
} from "@/app/(site)/panel/soltys/akcje-kalendarz";
import { ETYKIETA_RODZAJU, KOLOR_RODZAJU, type RodzajWpisKalendarza, type WpisKalendarza } from "@/lib/kalendarz/typy-kalendarza";

const DNI_PL = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

type Props = {
  wpisy: WpisKalendarza[];
  wsie: { id: string; name: string }[];
  miesiac: string;
  gminaLabel: string | null;
  sciezkaMiesiaca: (ym: string) => string;
};

function kluczDnia(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function poczatekMiesiaca(ym: string): Date {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y!, m! - 1, 1);
}

function siatkaMiesiaca(ym: string): Date[] {
  const pierwszy = poczatekMiesiaca(ym);
  const start = new Date(pierwszy);
  const dzien = start.getDay();
  const offset = dzien === 0 ? 6 : dzien - 1;
  start.setDate(start.getDate() - offset);
  const komorki: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    komorki.push(d);
  }
  return komorki;
}

function formatujCzas(iso: string, calodniowe: boolean): string {
  if (calodniowe) return "cały dzień";
  return new Date(iso).toLocaleString("pl-PL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const WSZYSTKIE_RODZAJE: RodzajWpisKalendarza[] = [
  "wydarzenie",
  "rezerwacja",
  "harmonogram",
  "dotacja",
  "konkurs",
  "gmina",
  "zadanie",
  "ogloszenie",
  "lowiectwo",
];

function zakresTygodnia(dzienKlucz: string): string[] {
  const d = new Date(dzienKlucz + "T12:00:00");
  const pn = new Date(d);
  const day = pn.getDay();
  const offset = day === 0 ? 6 : day - 1;
  pn.setDate(pn.getDate() - offset);
  const dni: string[] = [];
  for (let i = 0; i < 7; i++) {
    const x = new Date(pn);
    x.setDate(pn.getDate() + i);
    dni.push(kluczDnia(x));
  }
  return dni;
}

export function SoltysKalendarzKlient({ wpisy, wsie, miesiac, gminaLabel, sciezkaMiesiaca }: Props) {
  const [widok, ustawWidok] = useState<"miesiac" | "tydzien">("miesiac");
  const [filtry, ustawFiltry] = useState<Set<RodzajWpisKalendarza>>(new Set(WSZYSTKIE_RODZAJE));
  const [wybranyDzien, ustawWybranyDzien] = useState<string | null>(kluczDnia(new Date()));
  const [blad, ustawBlad] = useState("");
  const [komunikat, ustawKomunikat] = useState("");
  const [czek, startT] = useTransition();

  const przefiltrowane = useMemo(
    () => wpisy.filter((w) => filtry.has(w.rodzaj)),
    [wpisy, filtry],
  );

  const poDniach = useMemo(() => {
    const mapa = new Map<string, WpisKalendarza[]>();
    for (const w of przefiltrowane) {
      const k = kluczDnia(new Date(w.start));
      const lista = mapa.get(k) ?? [];
      lista.push(w);
      mapa.set(k, lista);
    }
    return mapa;
  }, [przefiltrowane]);

  const komorki = useMemo(() => siatkaMiesiaca(miesiac), [miesiac]);
  const [rok, mies] = miesiac.split("-").map(Number);
  const etykietaMiesiaca = new Date(rok!, mies! - 1, 1).toLocaleDateString("pl-PL", {
    month: "long",
    year: "numeric",
  });

  const poprzedni = (() => {
    const d = new Date(rok!, mies! - 2, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  })();
  const nastepny = (() => {
    const d = new Date(rok!, mies!, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  })();

  const dzis = kluczDnia(new Date());
  const wpisyDnia = wybranyDzien ? (poDniach.get(wybranyDzien) ?? []) : [];
  const dniTygodnia = wybranyDzien ? zakresTygodnia(wybranyDzien) : [];

  function przelaczFiltr(r: RodzajWpisKalendarza) {
    ustawFiltry((prev) => {
      const next = new Set(prev);
      if (next.has(r)) next.delete(r);
      else next.add(r);
      if (next.size === 0) return new Set(WSZYSTKIE_RODZAJE);
      return next;
    });
  }

  function onDodajWpis(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    ustawBlad("");
    ustawKomunikat("");
    const fd = new FormData(e.currentTarget);
    startT(async () => {
      const w = await dodajWpisKalendarzaSoltys({
        villageId: String(fd.get("village_id")),
        entryKind: String(fd.get("entry_kind")) as "zadanie" | "termin" | "zebranie" | "notatka",
        title: String(fd.get("title")),
        description: String(fd.get("description") || "").trim() || null,
        startsAt: String(fd.get("starts_at")),
        endsAt: String(fd.get("ends_at") || "").trim() || null,
      });
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawKomunikat("Wpis dodany.");
      (e.target as HTMLFormElement).reset();
      window.location.reload();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href={sciezkaMiesiaca(poprzedni)} className="btn-panel-secondary px-3 py-2 text-sm">
            ←
          </Link>
          <h2 className="font-serif text-xl capitalize text-green-950">{etykietaMiesiaca}</h2>
          <Link href={sciezkaMiesiaca(nastepny)} className="btn-panel-secondary px-3 py-2 text-sm">
            →
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => ustawWidok("miesiac")}
            className={widok === "miesiac" ? "btn-panel-primary px-3 py-1.5" : "btn-panel-secondary px-3 py-1.5"}
          >
            Miesiąc
          </button>
          <button
            type="button"
            onClick={() => ustawWidok("tydzien")}
            className={widok === "tydzien" ? "btn-panel-primary px-3 py-1.5" : "btn-panel-secondary px-3 py-1.5"}
          >
            Tydzień
          </button>
          <button
            type="button"
            onClick={() => ustawWybranyDzien(dzis)}
            className="btn-panel-secondary px-3 py-1.5"
          >
            Dziś
          </button>
          <a
            href={`/api/panel/soltys/kalendarz/ical?miesiac=${miesiac}`}
            className="btn-panel-secondary px-3 py-1.5"
            download
          >
            Pobierz .ics
          </a>
          <button type="button" onClick={() => window.print()} className="btn-panel-secondary px-3 py-1.5 no-print">
            Drukuj
          </button>
          <span className="hidden text-stone-300 sm:inline">·</span>
          <Link href="/panel/soltys/spolecznosc" className="link-panel">
            + wydarzenie
          </Link>
        </div>
      </div>

      {gminaLabel ? (
        <p className="rounded-lg border border-sky-200/80 bg-sky-50/50 px-3 py-2 text-sm text-sky-950">
          Warstwa <strong>{gminaLabel}</strong> — nadchodzące imprezy z innych wsi w gminie (tylko do odczytu).
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {WSZYSTKIE_RODZAJE.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => przelaczFiltr(r)}
            className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
              filtry.has(r) ? KOLOR_RODZAJU[r] : "border-stone-200 bg-stone-50 text-stone-400"
            }`}
          >
            {ETYKIETA_RODZAJU[r]}
          </button>
        ))}
      </div>

      {widok === "miesiac" ? (
        <div className="overflow-x-auto rounded-2xl border border-stone-200/90 bg-white shadow-sm print:border-stone-300">
          <div className="grid min-w-[320px] grid-cols-7 border-b border-stone-100 bg-stone-50/80 text-center text-xs font-semibold text-stone-600">
            {DNI_PL.map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {komorki.map((d) => {
              const k = kluczDnia(d);
              const wMiesiacu = d.getMonth() === mies! - 1;
              const lista = poDniach.get(k) ?? [];
              const wybrany = wybranyDzien === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => ustawWybranyDzien(k)}
                  className={`min-h-[4.5rem] border-b border-r border-stone-100 p-1 text-left transition sm:min-h-[5.5rem] ${
                    wMiesiacu ? "bg-white" : "bg-stone-50/60 text-stone-400"
                  } ${k === dzis ? "ring-1 ring-inset ring-green-600/40" : ""} ${
                    wybrany ? "bg-green-50/50" : "hover:bg-stone-50"
                  }`}
                >
                  <span className={`text-xs font-medium ${k === dzis ? "text-green-800" : ""}`}>{d.getDate()}</span>
                  <div className="mt-0.5 space-y-0.5">
                    {lista.slice(0, 3).map((w) => (
                      <span
                        key={w.id}
                        className={`block truncate rounded border px-1 py-0.5 text-[10px] leading-tight ${KOLOR_RODZAJU[w.rodzaj]}`}
                      >
                        {w.tytul}
                      </span>
                    ))}
                    {lista.length > 3 ? (
                      <span className="text-[10px] text-stone-500">+{lista.length - 3}</span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-7">
          {dniTygodnia.map((k) => {
            const lista = poDniach.get(k) ?? [];
            const data = new Date(k + "T12:00:00");
            return (
              <div
                key={k}
                className={`min-h-[8rem] rounded-xl border p-2 ${k === wybranyDzien ? "border-green-400 bg-green-50/40" : "border-stone-200 bg-white"}`}
              >
                <button
                  type="button"
                  onClick={() => ustawWybranyDzien(k)}
                  className="w-full text-left text-xs font-semibold text-stone-700"
                >
                  {data.toLocaleDateString("pl-PL", { weekday: "short", day: "numeric", month: "short" })}
                </button>
                <ul className="mt-2 space-y-1">
                  {lista.map((w) => (
                    <li
                      key={w.id}
                      className={`rounded border px-1 py-0.5 text-[10px] leading-snug ${KOLOR_RODZAJU[w.rodzaj]}`}
                    >
                      {formatujCzas(w.start, w.calodniowe).split(", ").pop()} {w.tytul}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      <section className="soltys-sekcja">
        <h3 className="font-serif text-lg text-green-950">
          {wybranyDzien
            ? new Date(wybranyDzien).toLocaleDateString("pl-PL", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })
            : "Wybierz dzień w kalendarzu"}
        </h3>
        {wybranyDzien && wpisyDnia.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">Brak wpisów w tym dniu (przy aktualnych filtrach).</p>
        ) : null}
        <ul className="mt-3 space-y-2">
          {wpisyDnia.map((w) => (
            <li
              key={w.id}
              className={`rounded-xl border p-3 text-sm ${KOLOR_RODZAJU[w.rodzaj]}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{w.tytul}</p>
                  <p className="mt-0.5 text-xs opacity-80">
                    {ETYKIETA_RODZAJU[w.rodzaj]} · {w.wiesNazwa}
                    {w.zGminy ? " · okolice" : ""} · {formatujCzas(w.start, w.calodniowe)}
                    {w.status === "pending" ? " · do akceptacji" : ""}
                  </p>
                  {w.opis ? <p className="mt-1 text-xs opacity-90">{w.opis}</p> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {w.href ? (
                    <Link href={w.href} className="text-xs font-medium underline">
                      Otwórz
                    </Link>
                  ) : null}
                  {w.rodzaj === "zadanie" && w.id.startsWith("zadanie-") ? (
                    <>
                      <button
                        type="button"
                        className="text-xs font-medium underline"
                        disabled={czek}
                        onClick={() => {
                          const entryId = w.id.replace("zadanie-", "");
                          startT(async () => {
                            const res = await oznaczWpisKalendarzaJakoGotowy({ entryId });
                            if ("blad" in res) ustawBlad(res.blad);
                            else window.location.reload();
                          });
                        }}
                      >
                        Gotowe
                      </button>
                      <button
                        type="button"
                        className="text-xs font-medium text-red-800 underline"
                        disabled={czek}
                        onClick={() => {
                          if (!confirm("Usunąć ten wpis z kalendarza?")) return;
                          const entryId = w.id.replace("zadanie-", "");
                          startT(async () => {
                            const res = await usunWpisKalendarzaSoltys({ entryId });
                            if ("blad" in res) ustawBlad(res.blad);
                            else window.location.reload();
                          });
                        }}
                      >
                        Usuń
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="soltys-sekcja forms-premium">
        <h3 className="font-serif text-lg text-green-950">Dodaj termin / zadanie</h3>
        <p className="mt-1 text-sm text-stone-600">
          Np. termin w urzędzie, zebranie wiejskie do przygotowania, przypomnienie o sprawozdaniu.
        </p>
        {blad ? <p className="mt-2 text-sm text-red-800">{blad}</p> : null}
        {komunikat ? <p className="mt-2 text-sm text-green-900">{komunikat}</p> : null}
        <form onSubmit={onDodajWpis} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            Wieś
            <select name="village_id" required className="form-control mt-1">
              {wsie.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            Rodzaj
            <select name="entry_kind" className="form-control mt-1" defaultValue="zadanie">
              <option value="zadanie">Zadanie</option>
              <option value="termin">Termin urzędowy</option>
              <option value="zebranie">Zebranie (organizacja)</option>
              <option value="notatka">Notatka</option>
            </select>
          </label>
          <label className="block sm:col-span-2">
            Tytuł
            <input name="title" required maxLength={200} className="form-control mt-1" placeholder="np. Złożyć wniosek do gminy" />
          </label>
          <label className="block sm:col-span-2">
            Opis (opcjonalnie)
            <textarea name="description" rows={2} className="form-control mt-1" />
          </label>
          <label>
            Od (data i godzina)
            <input type="datetime-local" name="starts_at" required className="form-control mt-1" />
          </label>
          <label>
            Do (opcjonalnie)
            <input type="datetime-local" name="ends_at" className="form-control mt-1" />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" disabled={czek || wsie.length === 0} className="btn-panel-primary">
              Zapisz w kalendarzu
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
