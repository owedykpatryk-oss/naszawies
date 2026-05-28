"use client";

import { FormEvent, useState, useTransition } from "react";
import Link from "next/link";
import { dodajOstrzezenieLowieckieSoltys, zmienStatusOstrzezeniaLowieckiego } from "../akcje-lowiectwo";

export type WierszOstrzezenia = {
  id: string;
  villageId: string;
  wiesNazwa: string;
  title: string;
  areaDescription: string;
  safetyNote: string | null;
  contactPhone: string | null;
  contactName: string | null;
  startsAt: string;
  endsAt: string;
  status: string;
  aktywne: boolean;
};

type Props = { wsie: { id: string; name: string }[]; wiersze: WierszOstrzezenia[] };

export function SoltysLowiectwoKlient({ wsie, wiersze: poczatkowe }: Props) {
  const [wiersze, ustawWiersze] = useState(poczatkowe);
  const [blad, ustawBlad] = useState("");
  const [komunikat, ustawKomunikat] = useState("");
  const [czek, startT] = useTransition();

  function onDodaj(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    ustawBlad("");
    const fd = new FormData(e.currentTarget);
    startT(async () => {
      const w = await dodajOstrzezenieLowieckieSoltys({
        villageId: String(fd.get("village_id")),
        title: String(fd.get("title")),
        areaDescription: String(fd.get("area_description")),
        safetyNote: String(fd.get("safety_note") || "").trim() || null,
        contactPhone: String(fd.get("contact_phone") || "").trim() || null,
        contactName: String(fd.get("contact_name") || "").trim() || null,
        startsAt: String(fd.get("starts_at")),
        endsAt: String(fd.get("ends_at")),
      });
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawKomunikat("Ostrzeżenie opublikowane na profilu wsi.");
      window.location.reload();
    });
  }

  return (
    <div className="space-y-8">
      {komunikat ? <p className="rounded-lg bg-green-50 p-3 text-sm text-green-950">{komunikat}</p> : null}
      {blad ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-900">{blad}</p> : null}

      <section className="soltys-sekcja forms-premium">
        <h2 className="font-serif text-lg text-green-950">Nowe ostrzeżenie polowania</h2>
        <p className="mt-1 text-sm text-stone-600">
          Pojawi się na profilu publicznym wsi jako wyraźny baner. Podaj rejon i dokładny termin.
        </p>
        <form onSubmit={onDodaj} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            Wieś
            <select name="village_id" required className="form-control mt-1">
              {wsie.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-2">
            Tytuł
            <input name="title" required maxLength={160} className="form-control mt-1" placeholder="np. Polowanie redukcyjne — rejon lasu" />
          </label>
          <label className="block sm:col-span-2">
            Rejon (gdzie nie wchodzić)
            <textarea name="area_description" required rows={3} className="form-control mt-1" placeholder="Opisz teren: lasy, pola, drogi graniczne…" />
          </label>
          <label className="block sm:col-span-2">
            Dodatkowa uwaga bezpieczeństwa
            <textarea name="safety_note" rows={2} className="form-control mt-1" placeholder="np. Prosimy o nie wchodzenie z psami bez smyczy." />
          </label>
          <label>
            Od
            <input type="datetime-local" name="starts_at" required className="form-control mt-1" />
          </label>
          <label>
            Do
            <input type="datetime-local" name="ends_at" required className="form-control mt-1" />
          </label>
          <label>
            Kontakt — osoba
            <input name="contact_name" maxLength={120} className="form-control mt-1" placeholder="Łowczy / prezes koła" />
          </label>
          <label>
            Telefon
            <input name="contact_phone" maxLength={40} className="form-control mt-1" />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" disabled={czek} className="btn-panel-primary">
              Opublikuj ostrzeżenie
            </button>
          </div>
        </form>
        <p className="mt-3 text-xs text-stone-500">
          <Link href="/panel/soltys/spolecznosc?tryb=mysliwi" className="link-panel">
            Profil koła łowieckiego (Społeczność)
          </Link>
          {" · "}
          <Link href="/pomoc?rola=mysliwi" className="link-panel">
            Przewodnik dla myśliwych
          </Link>
          {" · "}
          <Link href="/panel/soltys/grafika" className="link-panel">
            Plakat w kreatorze
          </Link>
        </p>
      </section>

      <section className="soltys-sekcja">
        <h2 className="font-serif text-lg text-green-950">Aktywne i archiwalne</h2>
        {wiersze.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">Brak ostrzeżeń.</p>
        ) : (
          <ul className="soltys-lista-moderacji mt-4">
            {wiersze.map((r) => (
              <li key={r.id} className="p-4">
                <p className="text-xs text-stone-500">{r.wiesNazwa}</p>
                <p className="font-medium text-stone-900">{r.title}</p>
                <p className="mt-1 text-sm text-stone-700">{r.areaDescription}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {new Date(r.startsAt).toLocaleString("pl-PL")} – {new Date(r.endsAt).toLocaleString("pl-PL")}
                  {r.aktywne ? " · teraz aktywne" : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {r.status === "approved" && r.aktywne ? (
                    <button
                      type="button"
                      className="btn-panel-secondary text-xs"
                      disabled={czek}
                      onClick={() => {
                        startT(async () => {
                          const res = await zmienStatusOstrzezeniaLowieckiego({ noticeId: r.id, status: "archived" });
                          if ("blad" in res) ustawBlad(res.blad);
                          else {
                            ustawWiersze((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: "archived", aktywne: false } : x)));
                          }
                        });
                      }}
                    >
                      Zakończ / archiwizuj
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
