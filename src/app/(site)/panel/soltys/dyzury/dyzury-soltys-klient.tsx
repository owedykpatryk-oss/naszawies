"use client";

import { useState, useTransition } from "react";
import { dodajDyzurSoltysa } from "../moduly-spolecznosci/akcje";
import { NAZWY_DNI } from "@/lib/harmonogram-smieci/typy";
import type { DyżurSoltysa } from "@/components/wies/sekcja-dyzury-soltysa";

type Props = {
  wsie: { id: string; name: string }[];
  dyzury: DyżurSoltysa[];
};

export function DyzurySoltysKlient({ wsie, dyzury }: Props) {
  const [villageId, ustawVillageId] = useState(wsie[0]?.id ?? "");
  const [dayOfWeek, ustawDay] = useState(4);
  const [startTime, ustawStart] = useState("16:00");
  const [endTime, ustawKoniec] = useState("18:00");
  const [location, ustawLoc] = useState("Świetlica");
  const [phone, ustawTel] = useState("");
  const [blad, ustawBlad] = useState("");
  const [czek, startT] = useTransition();

  function zapisz(e: React.FormEvent) {
    e.preventDefault();
    startT(async () => {
      const w = await dodajDyzurSoltysa({
        villageId,
        dayOfWeek,
        startTime,
        endTime,
        location,
        phone: phone || undefined,
      });
      if ("blad" in w && w.blad) ustawBlad(w.blad);
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={zapisz} className="rounded-2xl border bg-white p-4">
        <h2 className="font-serif text-lg">Dodaj dyżur tygodniowy</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            Wieś
            <select className="mt-1 w-full rounded-lg border px-2 py-2" value={villageId} onChange={(e) => ustawVillageId(e.target.value)}>
              {wsie.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Dzień
            <select className="mt-1 w-full rounded-lg border px-2 py-2" value={dayOfWeek} onChange={(e) => ustawDay(Number(e.target.value))}>
              {Object.entries(NAZWY_DNI).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Od
            <input type="time" className="mt-1 w-full rounded-lg border px-2 py-2" value={startTime} onChange={(e) => ustawStart(e.target.value)} />
          </label>
          <label className="text-sm">
            Do
            <input type="time" className="mt-1 w-full rounded-lg border px-2 py-2" value={endTime} onChange={(e) => ustawKoniec(e.target.value)} />
          </label>
        </div>
        <label className="mt-3 block text-sm">
          Miejsce
          <input className="mt-1 w-full rounded-lg border px-3 py-2" value={location} onChange={(e) => ustawLoc(e.target.value)} />
        </label>
        <label className="mt-3 block text-sm">
          Telefon (opcjonalnie)
          <input className="mt-1 w-full rounded-lg border px-3 py-2" value={phone} onChange={(e) => ustawTel(e.target.value)} />
        </label>
        {blad ? <p className="mt-2 text-sm text-red-800">{blad}</p> : null}
        <button type="submit" disabled={czek} className="btn-panel-primary mt-4">Zapisz dyżur</button>
      </form>
      <ul className="space-y-2 text-sm">
        {dyzury.map((d) => (
          <li key={d.id} className="rounded-lg border px-3 py-2">
            {d.day_of_week != null ? NAZWY_DNI[d.day_of_week] : d.specific_date} · {d.start_time.slice(0, 5)}–{d.end_time.slice(0, 5)}
            {d.location ? ` · ${d.location}` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
