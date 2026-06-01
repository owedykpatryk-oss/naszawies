"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { nazwaDniaTygodnia } from "@/lib/wies/teksty-dotacji";
import {
  dodajDomyslneRegulyPrzypomnienWsi,
  dodajRegulePrzypomnieniaMieszkancow,
  usunRegulePrzypomnieniaMieszkancow,
} from "../przypomnienia-mieszkancow-akcje";
import { ETYKIETY_RODZAJU_PRZYPOMNIENIA, RODZAJE_PRZYPOMNIENIA } from "@/lib/przypomnienia/rodzaje";

export type RegulaPrzypomnieniaWiersz = {
  id: string;
  village_id: string;
  kind: string;
  title: string;
  body: string | null;
  recurrence: string;
  day_of_week: number | null;
  day_of_month: number | null;
  month: number | null;
  days_before: number;
  is_active: boolean;
};

function opisHarmonogramu(r: RegulaPrzypomnieniaWiersz): string {
  if (r.recurrence === "weekly" && r.day_of_week != null) {
    return `co ${nazwaDniaTygodnia(r.day_of_week).toLowerCase()}, przypomnienie ${r.days_before} dni wcześniej`;
  }
  if (r.recurrence === "monthly" && r.day_of_month != null) {
    return `co miesiąc (${r.day_of_month}.), ${r.days_before} dni wcześniej`;
  }
  if (r.recurrence === "yearly" && r.month != null && r.day_of_month != null) {
    return `rocznie ${r.day_of_month}.${r.month}, ${r.days_before} dni wcześniej`;
  }
  return r.recurrence;
}

export function PrzypomnieniaMieszkancowSoltysKlient({
  wsie,
  reguly,
}: {
  wsie: { id: string; name: string }[];
  reguly: RegulaPrzypomnieniaWiersz[];
}) {
  const router = useRouter();
  const [villageId, setVillageId] = useState(wsie[0]?.id ?? "");
  const [recurrence, setRecurrence] = useState<"weekly" | "monthly" | "yearly">("weekly");
  const [komunikat, setKomunikat] = useState("");
  const [blad, setBlad] = useState("");
  const [czek, startT] = useTransition();

  const regulyWsi = useMemo(
    () => reguly.filter((r) => r.village_id === villageId),
    [reguly, villageId],
  );

  function onDodaj(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBlad("");
    setKomunikat("");
    startT(async () => {
      const w = await dodajRegulePrzypomnieniaMieszkancow({
        villageId,
        kind: String(fd.get("kind")) as "smieci",
        title: String(fd.get("title")),
        body: String(fd.get("body") || "") || null,
        recurrence,
        day_of_week: recurrence === "weekly" ? Number(fd.get("day_of_week")) : null,
        day_of_month:
          recurrence === "monthly" || recurrence === "yearly" ? Number(fd.get("day_of_month")) : null,
        month: recurrence === "yearly" ? Number(fd.get("month")) : null,
        days_before: Number(fd.get("days_before") || 1),
        link_url: String(fd.get("link_url") || "") || null,
      });
      if ("blad" in w) {
        setBlad(w.blad);
        return;
      }
      setKomunikat("Dodano przypomnienie — mieszkańcy z włączonymi powiadomieniami dostaną je automatycznie.");
      router.refresh();
    });
  }

  function szablony() {
    setBlad("");
    setKomunikat("");
    startT(async () => {
      const w = await dodajDomyslneRegulyPrzypomnienWsi(villageId);
      if ("blad" in w) {
        setBlad(w.blad);
        return;
      }
      setKomunikat(`Dodano ${w.dodano ?? 0} typowych przypomnień — dopasuj dni wywozu do harmonogramu gminy.`);
      router.refresh();
    });
  }

  function usun(id: string) {
    if (!confirm("Usunąć to przypomnienie?")) return;
    startT(async () => {
      const w = await usunRegulePrzypomnieniaMieszkancow(id);
      if ("blad" in w) setBlad(w.blad);
      else router.refresh();
    });
  }

  return (
    <section className="mt-10 space-y-6 border-t border-stone-200 pt-8">
      <div>
        <h2 className="font-serif text-xl text-green-950">Automatyczne przypomnienia dla mieszkańców</h2>
        <p className="mt-2 text-sm text-stone-600">
          System sam wyśle powiadomienie w panelu (i push, jeśli włączony) — np. dzień przed wywozem śmieci lub dwa
          tygodnie przed terminem podatku. Mieszkaniec może wyłączyć kategorie w{" "}
          <strong>Panel → Moja wieś → Przypomnienia</strong>.
        </p>
      </div>

      <div className="panel-karta">
        <label htmlFor="wies-przypomnienia">Wieś</label>
        <select
          id="wies-przypomnienia"
          className="mt-2 max-w-sm"
          value={villageId}
          onChange={(e) => setVillageId(e.target.value)}
        >
          {wsie.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        {komunikat ? (
          <p className="mt-3 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900">{komunikat}</p>
        ) : null}
        {blad ? <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">{blad}</p> : null}
      </div>

      {regulyWsi.length === 0 ? (
        <div className="panel-karta">
          <p className="text-sm text-stone-700">Brak reguł dla tej wsi.</p>
          <button
            type="button"
            disabled={czek || !villageId}
            onClick={szablony}
            className="btn-panel-primary mt-4"
          >
            {czek ? "Dodawanie…" : "Dodaj typowe (śmieci, podatki, działka, PSZOK)"}
          </button>
        </div>
      ) : (
        <ul className="space-y-2">
          {regulyWsi.map((r) => (
            <li key={r.id} className="panel-karta flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-teal-900">
                  {ETYKIETY_RODZAJU_PRZYPOMNIENIA[r.kind as keyof typeof ETYKIETY_RODZAJU_PRZYPOMNIENIA] ?? r.kind}
                </p>
                <p className="font-medium text-green-950">{r.title}</p>
                <p className="mt-1 text-xs text-stone-600">{opisHarmonogramu(r)}</p>
              </div>
              <button
                type="button"
                disabled={czek}
                onClick={() => usun(r.id)}
                className="text-sm text-red-800 underline"
              >
                Usuń
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={onDodaj} className="panel-karta space-y-4">
        <h3 className="font-medium text-green-950">Nowe przypomnienie</h3>
        <label className="block text-sm">
          Kategoria
          <select name="kind" required className="mt-1 block w-full max-w-md">
            {RODZAJE_PRZYPOMNIENIA.map((k) => (
              <option key={k} value={k}>
                {ETYKIETY_RODZAJU_PRZYPOMNIENIA[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Tytuł powiadomienia
          <input name="title" required minLength={2} className="mt-1 block w-full" placeholder="Wywóz śmieci zmieszanych" />
        </label>
        <label className="block text-sm">
          Treść (opcjonalnie)
          <textarea name="body" rows={2} className="mt-1 block w-full" placeholder="Jutro wywóz — wystaw pojemniki…" />
        </label>
        <label className="block text-sm">
          Powtarzanie
          <select
            name="recurrence"
            className="mt-1 block w-full max-w-xs"
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value as typeof recurrence)}
          >
            <option value="weekly">Co tydzień (np. śmieci)</option>
            <option value="monthly">Co miesiąc</option>
            <option value="yearly">Co roku (np. podatek)</option>
          </select>
        </label>
        {recurrence === "weekly" ? (
          <label className="block text-sm">
            Dzień wywozu / terminu
            <select name="day_of_week" defaultValue={4} className="mt-1 block w-full max-w-xs">
              {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                <option key={d} value={d}>
                  {nazwaDniaTygodnia(d)}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {recurrence === "monthly" ? (
          <label className="block text-sm">
            Dzień miesiąca
            <input name="day_of_month" type="number" min={1} max={31} defaultValue={10} className="mt-1 block w-24" />
          </label>
        ) : null}
        {recurrence === "yearly" ? (
          <div className="flex flex-wrap gap-4">
            <label className="text-sm">
              Miesiąc
              <input name="month" type="number" min={1} max={12} defaultValue={4} className="mt-1 block w-20" />
            </label>
            <label className="text-sm">
              Dzień
              <input name="day_of_month" type="number" min={1} max={31} defaultValue={30} className="mt-1 block w-20" />
            </label>
          </div>
        ) : null}
        <label className="block text-sm">
          Przypomnij ile dni wcześniej
          <input name="days_before" type="number" min={0} max={60} defaultValue={1} className="mt-1 block w-24" />
        </label>
        <label className="block text-sm">
          Link (opcjonalnie, np. BIP gminy)
          <input name="link_url" type="url" className="mt-1 block w-full" placeholder="https://…" />
        </label>
        <button type="submit" disabled={czek || !villageId} className="btn-panel-primary">
          {czek ? "Zapisuję…" : "Dodaj przypomnienie"}
        </button>
      </form>
    </section>
  );
}
