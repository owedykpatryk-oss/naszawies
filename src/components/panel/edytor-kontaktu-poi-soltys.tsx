"use client";

import { FormEvent, useState, useTransition } from "react";
import { aktualizujKontaktPoiSoltysa } from "@/app/(site)/panel/soltys/akcje-poi-miejsca";
import { etykietaKategoriiPoi } from "@/lib/mapa/kategorie-poi";
import { godzinyOtwarciaDoTekstu } from "@/lib/mapa/edycja-godzin-poi";

export type PoiDoEdycjiKontaktu = {
  id: string;
  name: string;
  category: string;
  phone: string | null;
  opening_hours: unknown;
  linked_hall_id: string | null;
  source: string | null;
};

export type SalaOpcja = { id: string; name: string };

export function EdytorKontaktuPoiSoltys({
  pois,
  sale,
}: {
  villageId: string;
  pois: PoiDoEdycjiKontaktu[];
  sale: SalaOpcja[];
}) {
  const [blad, ustawBlad] = useState("");
  const [okId, ustawOkId] = useState<string | null>(null);
  const [czek, startT] = useTransition();

  const punkty = pois.filter((p) => p.category !== "ladne_miejsce");
  if (punkty.length === 0) {
    return (
      <p className="text-sm text-stone-600">
        Brak punktów na mapie — użyj importu z OpenStreetMap powyżej, potem uzupełnij telefon i godziny.
      </p>
    );
  }

  function zapisz(e: FormEvent<HTMLFormElement>, poi: PoiDoEdycjiKontaktu) {
    e.preventDefault();
    ustawBlad("");
    ustawOkId(null);
    const fd = new FormData(e.currentTarget);
    startT(async () => {
      const w = await aktualizujKontaktPoiSoltysa({
        poiId: poi.id,
        phone: String(fd.get("phone") ?? "") || null,
        openingHoursText: String(fd.get("opening_hours") ?? "") || null,
        linkedHallId: String(fd.get("linked_hall_id") ?? "") || null,
      });
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawOkId(poi.id);
    });
  }

  return (
    <div className="mt-4 space-y-4">
      <p className="text-sm text-stone-600">
        Uzupełnij <strong>telefon</strong> i <strong>godziny otwarcia</strong> — widać na mapie po kliknięciu pinezki.
        Import z OSM często tego nie ma. Przy świetlicy wybierz salę, żeby na mapie pokazać jej kalendarz zajętości.
      </p>
      {blad ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {blad}
        </p>
      ) : null}
      <ul className="space-y-3">
        {punkty.map((p) => {
          const kat = etykietaKategoriiPoi(p.category) ?? p.category;
          const domyslneGodziny = godzinyOtwarciaDoTekstu(p.opening_hours);
          return (
            <li key={p.id} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <p className="font-medium text-green-950">{p.name}</p>
                <span className="text-xs text-stone-500">{kat}</span>
                {p.source === "osm_auto" || p.source === "osm_manual" ? (
                  <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-900">OSM</span>
                ) : p.source === "geoportal" ? (
                  <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-900">
                    Geoportal
                  </span>
                ) : null}
                {okId === p.id ? (
                  <span className="text-xs font-medium text-emerald-800">Zapisano ✓</span>
                ) : null}
              </div>
              <form onSubmit={(e) => zapisz(e, p)} className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  Telefon
                  <input
                    name="phone"
                    type="tel"
                    defaultValue={p.phone ?? ""}
                    placeholder="+48 …"
                    maxLength={40}
                    className="mt-1 block w-full rounded-lg border border-stone-300 px-2 py-1.5"
                  />
                </label>
                <label className="text-sm sm:col-span-2">
                  Godziny otwarcia
                  <textarea
                    name="opening_hours"
                    rows={2}
                    maxLength={500}
                    defaultValue={domyslneGodziny}
                    placeholder="np. pn–pt 8:00–16:00, sob 9:00–12:00"
                    className="mt-1 block w-full rounded-lg border border-stone-300 px-2 py-1.5"
                  />
                </label>
                {p.category === "swietlica" && sale.length > 0 ? (
                  <label className="text-sm sm:col-span-2">
                    Powiązana sala (kalendarz na mapie)
                    <select
                      name="linked_hall_id"
                      defaultValue={p.linked_hall_id ?? ""}
                      className="mt-1 block w-full max-w-md rounded-lg border border-stone-300 px-2 py-1.5"
                    >
                      <option value="">— wszystkie sale wsi (domyślnie) —</option>
                      {sale.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={czek}
                    className="rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-50"
                  >
                    {czek ? "Zapisuję…" : "Zapisz kontakt"}
                  </button>
                </div>
              </form>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
