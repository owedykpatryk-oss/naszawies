"use client";

import Link from "next/link";
import { FormEvent, useState, useTransition } from "react";
import { dodajBrakujacePoiZOpenStreetMap } from "../akcje-mapa-poi";
import { zapiszProfilPublicznyWsi } from "../akcje";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

export type WiesDoEdycji = {
  id: string;
  name: string;
  voivodeship: string;
  county: string;
  commune: string;
  slug: string;
  description: string | null;
  website: string | null;
  cover_image_url: string | null;
  latitude: number | null;
  longitude: number | null;
};

export function ProfilWsiSoltysKlient({ wies }: { wies: WiesDoEdycji[] }) {
  const [czek, startT] = useTransition();
  const [czekOsm, startOsm] = useTransition();
  const [blad, ustawBlad] = useState<Record<string, string>>({});
  const [ok, ustawOk] = useState<Record<string, boolean>>({});
  const [bladOsm, ustawBladOsm] = useState<Record<string, string>>({});
  const [okOsm, ustawOkOsm] = useState<Record<string, string>>({});

  function wyslij(e: FormEvent<HTMLFormElement>, w: WiesDoEdycji) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    ustawBlad((b) => ({ ...b, [w.id]: "" }));
    startT(async () => {
      const wynik = await zapiszProfilPublicznyWsi({
        villageId: w.id,
        description: String(fd.get("description") ?? ""),
        website: String(fd.get("website") ?? "") || null,
        cover_image_url: String(fd.get("cover_image_url") ?? "") || null,
      });
      if ("blad" in wynik) {
        ustawBlad((b) => ({ ...b, [w.id]: wynik.blad }));
        return;
      }
      ustawOk((o) => ({ ...o, [w.id]: true }));
    });
  }

  function pobierzOsm(wId: string) {
    ustawBladOsm((b) => ({ ...b, [wId]: "" }));
    ustawOkOsm((o) => ({ ...o, [wId]: "" }));
    startOsm(async () => {
      const wynik = await dodajBrakujacePoiZOpenStreetMap({ villageId: wId, promienM: 2800 });
      if ("blad" in wynik) {
        ustawBladOsm((b) => ({ ...b, [wId]: wynik.blad }));
        return;
      }
      const czesci: string[] = [];
      if (wynik.dodano > 0) {
        czesci.push(`Dodano ${wynik.dodano} punktów z OSM.`);
      } else {
        czesci.push("Nie dodano nowych punktów (albo brak obiektów w bazie OSM w zasięgu, albo są już zapisane).");
      }
      if (wynik.pominietoDuplikaty > 0) {
        czesci.push(`Pominięto ${wynik.pominietoDuplikaty} jako zbyt bliskie istniejącym.`);
      }
      if (wynik.odrzuconoBladZapisu > 0) {
        czesci.push(`Część zapisów nie powiodła się (${wynik.odrzuconoBladZapisu}) — spróbuj ponownie lub zgłoś administratorowi.`);
      }
      ustawOkOsm((o) => ({ ...o, [wId]: czesci.join(" ") }));
    });
  }

  return (
    <ul className="mt-6 space-y-8">
      {wies.map((w) => {
        const sciezka = sciezkaProfiluWsi(w);
        const maGps = w.latitude != null && w.longitude != null;
        return (
          <li key={w.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="font-serif text-lg text-green-950">{w.name}</h2>
            <p className="text-xs text-stone-500">
              {w.voivodeship} · {w.county} · {w.commune}
            </p>
            <p className="mt-1 text-sm">
              <Link href={sciezka} className="text-green-800 underline">
                Podgląd strony publicznej
              </Link>
              {" · "}
              <Link href="/mapa" className="text-green-800 underline">
                Mapa wszystkich wsi
              </Link>
            </p>
            {ok[w.id] ? (
              <p className="mt-2 text-sm text-green-800" role="status">
                Zapisano.
              </p>
            ) : null}
            {blad[w.id] ? (
              <p className="mt-2 text-sm text-red-800" role="alert">
                {blad[w.id]}
              </p>
            ) : null}
            <form onSubmit={(e) => wyslij(e, w)} className="mt-4 space-y-3 text-sm">
              <div>
                <label className="font-medium" htmlFor={`opis-${w.id}`}>
                  Opis miejscowości (widać na stronie wsi)
                </label>
                <textarea
                  id={`opis-${w.id}`}
                  name="description"
                  rows={6}
                  defaultValue={w.description ?? ""}
                  className="mt-1 w-full max-w-2xl rounded border border-stone-300 px-2 py-1.5"
                  maxLength={20000}
                />
              </div>
              <div>
                <label className="font-medium" htmlFor={`www-${w.id}`}>
                  Strona www (np. BIP, Facebook sołectwa) — pełny adres z https://
                </label>
                <input
                  id={`www-${w.id}`}
                  name="website"
                  type="url"
                  defaultValue={w.website ?? ""}
                  className="mt-1 w-full max-w-2xl rounded border border-stone-300 px-2 py-1.5"
                  placeholder="https://"
                />
              </div>
              <div>
                <label className="font-medium" htmlFor={`cover-${w.id}`}>
                  Adres obrazu banera (opcj.) — publiczny URL (https), zdjęcie nagłówka strony
                </label>
                <input
                  id={`cover-${w.id}`}
                  name="cover_image_url"
                  type="url"
                  defaultValue={w.cover_image_url ?? ""}
                  className="mt-1 w-full max-w-2xl rounded border border-stone-300 px-2 py-1.5"
                  placeholder="https://"
                />
              </div>
              <button
                type="submit"
                disabled={czek}
                className="rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-60"
              >
                {czek ? "Zapisuję…" : "Zapisz dane wsi"}
              </button>
            </form>

            <div className="mt-8 border-t border-stone-200 pt-6">
              <h3 className="font-serif text-base text-green-950">Miejsca na mapie (szkoła, kościół, sklep…)</h3>
              <p className="mt-2 text-xs leading-relaxed text-stone-600">
                Publiczna mapa pokazuje pinezkę wsi według <strong>punktu GPS zapisanego przez administratora</strong>{" "}
                oraz osobne punkty z tabeli <code className="rounded bg-stone-100 px-1">pois</code>. Przykładowe
                „sztuczne” punkty z instalacji demo można zastąpić: możesz{" "}
                <strong>dopisać brakujące obiekty z OpenStreetMap</strong> w promieniu ok. 2,8 km od tego punktu (szkoła,
                przedszkole, kult, świetlica, OSP, biblioteka, sklep, cmentarz). Zawsze sprawdź lokalnie — OSM bywa
                niepełny.
              </p>
              {!maGps ? (
                <p className="mt-2 text-xs text-amber-900">
                  Dla tej wsi nie ma jeszcze szerokości / długości w bazie — import z OSM jest niedostępny. Poproś
                  administratora platformy o uzupełnienie współrzędnych wsi.
                </p>
              ) : null}
              {bladOsm[w.id] ? (
                <p className="mt-2 text-sm text-red-800" role="alert">
                  {bladOsm[w.id]}
                </p>
              ) : null}
              {okOsm[w.id] ? (
                <p className="mt-2 text-sm text-green-800" role="status">
                  {okOsm[w.id]}
                </p>
              ) : null}
              <button
                type="button"
                disabled={czekOsm || !maGps}
                onClick={() => pobierzOsm(w.id)}
                className="mt-3 rounded-lg border border-green-800/40 bg-emerald-50/80 px-4 py-2 text-sm font-medium text-green-950 shadow-sm transition hover:bg-emerald-100 disabled:opacity-50"
              >
                {czekOsm ? "Pobieram z OpenStreetMap…" : "Dopisz brakujące POI z OpenStreetMap"}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
