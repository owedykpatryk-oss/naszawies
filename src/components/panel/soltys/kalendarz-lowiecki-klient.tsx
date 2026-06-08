"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import {
  dodajWpisKalendarzaLowieckiego,
  usunWpisKalendarzaLowieckiego,
} from "@/app/(site)/panel/soltys/akcje-lowiectwo-kalendarz";
import type { AmbonaNaLiscie } from "@/lib/lowiectwo/pobierz-ambony-wsi";
import {
  domyslnyTytulWpisu,
  ETYKIETA_RODZAJU_KALENDARZA,
  KOLOR_RODZAJU_KALENDARZA,
  RODZAJE_KALENDARZA_LOWIECKIEGO,
  type RodzajWpisuKalendarzaLowieckiego,
  type WpisKalendarzaLowieckiego,
} from "@/lib/lowiectwo/kalendarz-lowiecki";

const DNI_PL = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

type Props = {
  wpisy: WpisKalendarzaLowieckiego[];
  wsie: { id: string; name: string }[];
  ambonyPoWsi: Record<string, AmbonaNaLiscie[]>;
  ostrzezenia: { id: string; villageId: string; title: string; startsAt: string }[];
  miesiac: string;
  sciezkaMiesiaca: (ym: string) => string;
  poczatkoweOstrzezenieId?: string;
  poczatkowaWiesId?: string;
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

function miesiacPoprzedni(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y!, m! - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function miesiacNastepny(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y!, m!, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatujCzas(iso: string): string {
  return new Date(iso).toLocaleString("pl-PL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function doDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function KalendarzLowieckiKlient({
  wpisy,
  wsie,
  ambonyPoWsi,
  ostrzezenia,
  miesiac,
  sciezkaMiesiaca,
  poczatkoweOstrzezenieId,
  poczatkowaWiesId,
}: Props) {
  const [wybranyDzien, ustawWybranyDzien] = useState(() => kluczDnia(new Date()));
  const [villageId, ustawVillageId] = useState(wsie[0]?.id ?? "");
  const [entryKind, ustawEntryKind] = useState<RodzajWpisuKalendarzaLowieckiego>("obowiazek_ambony");
  const [poiId, ustawPoiId] = useState("");
  const [standLabel, ustawStandLabel] = useState("");
  const [hunterName, ustawHunterName] = useState("");
  const [hunterPhone, ustawHunterPhone] = useState("");
  const [title, ustawTitle] = useState("");
  const [startsAt, ustawStartsAt] = useState("");
  const [endsAt, ustawEndsAt] = useState("");
  const [notes, ustawNotes] = useState("");
  const [huntingNoticeId, ustawHuntingNoticeId] = useState("");
  const [blad, ustawBlad] = useState("");
  const [komunikat, ustawKomunikat] = useState("");
  const [czek, startT] = useTransition();

  const komorki = useMemo(() => siatkaMiesiaca(miesiac), [miesiac]);
  const ymLabel = useMemo(() => {
    const d = poczatekMiesiaca(miesiac);
    return d.toLocaleDateString("pl-PL", { month: "long", year: "numeric" });
  }, [miesiac]);

  const wpisyPoDniu = useMemo(() => {
    const map = new Map<string, WpisKalendarzaLowieckiego[]>();
    for (const w of wpisy) {
      const k = kluczDnia(new Date(w.startsAt));
      const arr = map.get(k) ?? [];
      arr.push(w);
      map.set(k, arr);
    }
    return map;
  }, [wpisy]);

  const wpisyDnia = wpisyPoDniu.get(wybranyDzien) ?? [];
  const obsadaDnia = wpisyDnia.filter((w) => w.entryKind === "obowiazek_ambony");

  const ambony = ambonyPoWsi[villageId] ?? [];
  const wybranaAmbona = ambony.find((a) => a.id === poiId);

  const ostrzezeniaWsi = ostrzezenia.filter((o) => o.villageId === villageId);

  useEffect(() => {
    if (!poczatkowaWiesId || !wsie.some((w) => w.id === poczatkowaWiesId)) return;
    ustawVillageId(poczatkowaWiesId);
    if (!poczatkoweOstrzezenieId) return;
    const o = ostrzezenia.find((x) => x.id === poczatkoweOstrzezenieId);
    if (!o) return;
    ustawHuntingNoticeId(o.id);
    ustawEntryKind("polowanie_zbiorowe");
    ustawTitle(o.title);
    const s = new Date(o.startsAt);
    const e = new Date(o.startsAt);
    e.setHours(s.getHours() + 6, s.getMinutes(), 0, 0);
    if (e <= s) e.setTime(s.getTime() + 6 * 60 * 60 * 1000);
    ustawStartsAt(doDatetimeLocal(s));
    ustawEndsAt(doDatetimeLocal(e));
    ustawWybranyDzien(kluczDnia(s));
  }, [poczatkowaWiesId, poczatkoweOstrzezenieId, ostrzezenia, wsie]);

  function ustawTerminDnia(dzienKlucz: string, godzStart = 6, godzKoniec = 18) {
    const d = new Date(dzienKlucz + "T12:00:00");
    const s = new Date(d);
    s.setHours(godzStart, 0, 0, 0);
    const e = new Date(d);
    e.setHours(godzKoniec, 0, 0, 0);
    ustawStartsAt(doDatetimeLocal(s));
    ustawEndsAt(doDatetimeLocal(e));
  }

  function onDodaj(e: FormEvent) {
    e.preventDefault();
    ustawBlad("");
    const tytul =
      title.trim() ||
      domyslnyTytulWpisu(entryKind, wybranaAmbona?.name ?? standLabel, hunterName);
    startT(async () => {
      const w = await dodajWpisKalendarzaLowieckiego({
        villageId,
        entryKind,
        title: tytul,
        startsAt,
        endsAt,
        poiId: poiId || null,
        standLabel: standLabel.trim() || null,
        hunterName: hunterName.trim() || null,
        hunterPhone: hunterPhone.trim() || null,
        notes: notes.trim() || null,
        huntingNoticeId: huntingNoticeId || null,
      });
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawKomunikat("Zapisano wpis w kalendarzu.");
      ustawHunterName("");
      ustawHunterPhone("");
      ustawNotes("");
      ustawTitle("");
    });
  }

  function usun(id: string, vId: string) {
    if (!window.confirm("Usunąć ten wpis z kalendarza?")) return;
    startT(async () => {
      const w = await usunWpisKalendarzaLowieckiego(id, vId);
      if ("blad" in w) ustawBlad(w.blad);
      else ustawKomunikat("Usunięto wpis.");
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200/80 bg-amber-50/50 p-4">
        <div>
          <p className="text-sm font-semibold text-amber-950">Kalendarz łowiecki</p>
          <p className="mt-1 max-w-prose text-xs text-stone-600">
            Plan polowań, zebrań i <strong>obsady ambony</strong> — kto i gdzie. Mieszkańcy wsi (po zalogowaniu)
            widzą harmonogram na profilu #mysliwi; goście nie widzą imion.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={sciezkaMiesiaca(miesiacPoprzedni(miesiac))} className="btn-panel-secondary text-xs">
            ←
          </Link>
          <span className="rounded-lg border border-amber-300/60 bg-white px-3 py-2 text-sm font-medium capitalize text-amber-950">
            {ymLabel}
          </span>
          <Link href={sciezkaMiesiaca(miesiacNastepny(miesiac))} className="btn-panel-secondary text-xs">
            →
          </Link>
          <Link href="/panel/soltys/lowiectwo" className="btn-panel-secondary text-xs">
            Ostrzeżenia polowań
          </Link>
          <Link href="/panel/soltys/mapa" className="btn-panel-secondary text-xs">
            Ambony na mapie POI
          </Link>
        </div>
      </div>

      {komunikat ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status">
          {komunikat}
        </p>
      ) : null}
      {blad ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {blad}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 rounded-2xl border border-stone-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase text-stone-500">
            {DNI_PL.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {komorki.map((d) => {
              const k = kluczDnia(d);
              const wMiesiacu = d.getMonth() === poczatekMiesiaca(miesiac).getMonth();
              const lista = wpisyPoDniu.get(k) ?? [];
              const obsada = lista.filter((x) => x.entryKind === "obowiazek_ambony").length;
              const aktywny = k === wybranyDzien;
              return (
                <button
                  key={k + d.getTime()}
                  type="button"
                  onClick={() => {
                    ustawWybranyDzien(k);
                    ustawTerminDnia(k);
                  }}
                  className={`min-h-[52px] rounded-lg border p-1 text-left text-[10px] transition ${
                    aktywny
                      ? "border-amber-500 bg-amber-50 ring-1 ring-amber-400"
                      : "border-stone-100 hover:border-amber-200 hover:bg-amber-50/40"
                  } ${wMiesiacu ? "text-stone-800" : "text-stone-300"}`}
                >
                  <span className="font-semibold">{d.getDate()}</span>
                  {lista.length > 0 ? (
                    <span className="mt-0.5 block truncate text-amber-900">
                      {lista.length} wp.
                      {obsada > 0 ? ` · ${obsada}🎯` : ""}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={onDodaj} className="space-y-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/30 p-4">
          <h3 className="text-sm font-semibold text-emerald-950">Nowy wpis — {wybranyDzien}</h3>
          <label className="block text-xs">
            <span className="font-medium">Wieś</span>
            <select
              value={villageId}
              onChange={(e) => {
                ustawVillageId(e.target.value);
                ustawPoiId("");
              }}
              className="mt-1 w-full rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
            >
              {wsie.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs">
            <span className="font-medium">Rodzaj</span>
            <select
              value={entryKind}
              onChange={(e) => ustawEntryKind(e.target.value as RodzajWpisuKalendarzaLowieckiego)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
            >
              {RODZAJE_KALENDARZA_LOWIECKIEGO.map((k) => (
                <option key={k} value={k}>
                  {ETYKIETA_RODZAJU_KALENDARZA[k]}
                </option>
              ))}
            </select>
          </label>
          {entryKind === "obowiazek_ambony" ? (
            <>
              <label className="block text-xs">
                <span className="font-medium">Ambona z mapy POI</span>
                <select
                  value={poiId}
                  onChange={(e) => ustawPoiId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
                >
                  <option value="">— wybierz lub wpisz poniżej —</option>
                  {ambony.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
                {ambony.length === 0 ? (
                  <p className="mt-1 text-[10px] text-amber-800">
                    Brak ambony w POI —{" "}
                    <Link href="/panel/soltys/mapa" className="underline">
                      dodaj na mapie
                    </Link>
                    .
                  </p>
                ) : null}
              </label>
              <label className="block text-xs">
                <span className="font-medium">Lub nazwa stanowiska</span>
                <input
                  value={standLabel}
                  onChange={(e) => ustawStandLabel(e.target.value)}
                  placeholder="np. Ambona północna"
                  className="mt-1 w-full rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
                />
              </label>
              <label className="block text-xs">
                <span className="font-medium">Myśliwy na ambony *</span>
                <input
                  required
                  value={hunterName}
                  onChange={(e) => ustawHunterName(e.target.value)}
                  placeholder="Imię i nazwisko"
                  className="mt-1 w-full rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
                />
              </label>
              <label className="block text-xs">
                <span className="font-medium">Telefon (opcjonalnie)</span>
                <input
                  type="tel"
                  value={hunterPhone}
                  onChange={(e) => ustawHunterPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
                />
              </label>
            </>
          ) : (
            <label className="block text-xs">
              <span className="font-medium">Odpowiedzialny (opcjonalnie)</span>
              <input
                value={hunterName}
                onChange={(e) => ustawHunterName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
              />
            </label>
          )}
          <label className="block text-xs">
            <span className="font-medium">Tytuł (opcjonalnie)</span>
            <input
              value={title}
              onChange={(e) => ustawTitle(e.target.value)}
              placeholder={domyslnyTytulWpisu(entryKind, wybranaAmbona?.name, hunterName)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs">
              <span className="font-medium">Od</span>
              <input
                type="datetime-local"
                required
                value={startsAt}
                onChange={(e) => ustawStartsAt(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="block text-xs">
              <span className="font-medium">Do</span>
              <input
                type="datetime-local"
                required
                value={endsAt}
                onChange={(e) => ustawEndsAt(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
              />
            </label>
          </div>
          {ostrzezeniaWsi.length > 0 ? (
            <label className="block text-xs">
              <span className="font-medium">Powiązane ostrzeżenie polowania</span>
              <select
                value={huntingNoticeId}
                onChange={(e) => ustawHuntingNoticeId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
              >
                <option value="">— brak —</option>
                {ostrzezeniaWsi.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.title} ({formatujCzas(o.startsAt)})
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="block text-xs">
            <span className="font-medium">Uwagi</span>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => ustawNotes(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
            />
          </label>
          <button type="submit" disabled={czek} className="btn-panel-primary w-full text-sm">
            {czek ? "Zapisuję…" : "Dodaj do kalendarza"}
          </button>
        </form>
      </div>

      <section className="rounded-2xl border border-amber-200/90 bg-white p-4 shadow-sm">
        <h3 className="font-serif text-lg text-amber-950">
          Plan na {new Date(wybranyDzien + "T12:00:00").toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" })}
        </h3>
        {obsadaDnia.length > 0 ? (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-amber-100 text-xs uppercase text-stone-500">
                  <th className="py-2 pr-3">Ambona / stanowisko</th>
                  <th className="py-2 pr-3">Myśliwy</th>
                  <th className="py-2 pr-3">Godziny</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {obsadaDnia.map((w) => (
                  <tr key={w.id} className="border-b border-stone-100">
                    <td className="py-2.5 pr-3 font-medium text-stone-900">
                      {w.ambonaNazwa ?? "—"}
                    </td>
                    <td className="py-2.5 pr-3">
                      {w.hunterName}
                      {w.hunterPhone ? (
                        <span className="block text-xs text-stone-500">{w.hunterPhone}</span>
                      ) : null}
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-stone-600">
                      {formatujCzas(w.startsAt)} – {new Date(w.endsAt).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        type="button"
                        disabled={czek}
                        onClick={() => usun(w.id, w.villageId)}
                        className="text-xs text-red-800 underline hover:text-red-950 disabled:opacity-50"
                      >
                        Usuń
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 text-sm text-stone-500">Brak przydzielonych ambony na ten dzień.</p>
        )}

        {wpisyDnia.filter((w) => w.entryKind !== "obowiazek_ambony").length > 0 ? (
          <ul className="mt-4 space-y-2 border-t border-stone-100 pt-4">
            <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Pozostałe wpisy dnia</p>
            {wpisyDnia
              .filter((w) => w.entryKind !== "obowiazek_ambony")
              .map((w) => (
                <li
                  key={w.id}
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 ${KOLOR_RODZAJU_KALENDARZA[w.entryKind]}`}
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase">
                      {ETYKIETA_RODZAJU_KALENDARZA[w.entryKind]}
                    </span>
                    <p className="font-medium">{w.title}</p>
                    <p className="text-xs opacity-80">
                      {formatujCzas(w.startsAt)}
                      {w.hunterName ? ` · ${w.hunterName}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={czek}
                    onClick={() => usun(w.id, w.villageId)}
                    className="text-xs underline opacity-80"
                  >
                    Usuń
                  </button>
                </li>
              ))}
          </ul>
        ) : null}
      </section>

      <section>
        <h3 className="text-sm font-semibold text-stone-800">Wszystkie wpisy w miesiącu ({wpisy.length})</h3>
        <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto rounded-xl border border-stone-200 bg-stone-50/50 p-2">
          {wpisy.length === 0 ? (
            <li className="px-2 py-3 text-sm text-stone-500">Pusty miesiąc — dodaj pierwszy wpis.</li>
          ) : (
            wpisy.map((w) => (
              <li key={w.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-white px-2 py-1.5 text-xs">
                <span className={`rounded border px-1.5 py-0.5 font-medium ${KOLOR_RODZAJU_KALENDARZA[w.entryKind]}`}>
                  {ETYKIETA_RODZAJU_KALENDARZA[w.entryKind]}
                </span>
                <span className="font-medium text-stone-900">{w.title}</span>
                <span className="text-stone-500">{formatujCzas(w.startsAt)}</span>
                <span className="text-stone-400">{w.wiesNazwa}</span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
