"use client";

import Link from "next/link";
import { FormEvent, useState, useTransition } from "react";
import { dodajBrakujacePoiZOpenStreetMap, dodajPunktCzerpaniaWodyOsp } from "../akcje-mapa-poi";
import { zapiszProfilPublicznyWsi, zapiszBannerRynkuWsi } from "../akcje";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { LadneMiejsceFormularz } from "@/components/panel/ladne-miejsce-formularz";
import { CmentarzNaMapieFormularz } from "@/components/panel/cmentarz-na-mapie-formularz";
import {
  EdytorKontaktuPoiSoltys,
  type PoiDoEdycjiKontaktu,
  type SalaOpcja,
} from "@/components/panel/edytor-kontaktu-poi-soltys";
import { QrProfilWsiPanel } from "@/components/panel/qr-profil-wsi-panel";
import { SugestieAutomatyzacjiMapy } from "@/components/panel/sugestie-automatyzacji-mapy";
import { KolejkaWeryfikacjiPoi } from "@/components/panel/kolejka-weryfikacji-poi";
import { KolejkaPropozycjiPoi } from "@/components/panel/kolejka-propozycji-poi";
import { PasekKompletnosciMapy } from "@/components/panel/pasek-kompletnosci-mapy";
import type { SugestiaAutomatyzacjiMapy } from "@/lib/mapa/pobierz-sugestie-automatyzacji-wsi";
import type { PoiDoWeryfikacji } from "@/lib/mapa/pobierz-poi-do-weryfikacji-wsi";
import type { PropozycjaPoiDoReview } from "@/lib/mapa/pobierz-propozycje-poi-wsi";
import type { KompletnoscMapyWsi } from "@/lib/mapa/oblicz-kompletnosc-mapy-wsi";

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
  rynek_banner_text?: string | null;
  rynek_banner_until?: string | null;
};

export function ProfilWsiSoltysKlient({
  wies,
  sugestieMapy = {},
  poisByVillage = {},
  saleByVillage = {},
  poiDoWeryfikacji = {},
  propozycjePoi = {},
  kompletnoscMapy = {},
}: {
  wies: WiesDoEdycji[];
  sugestieMapy?: Record<string, SugestiaAutomatyzacjiMapy[]>;
  poisByVillage?: Record<string, PoiDoEdycjiKontaktu[]>;
  saleByVillage?: Record<string, SalaOpcja[]>;
  poiDoWeryfikacji?: Record<string, PoiDoWeryfikacji[]>;
  propozycjePoi?: Record<string, PropozycjaPoiDoReview[]>;
  kompletnoscMapy?: Record<string, KompletnoscMapyWsi>;
}) {
  const [czek, startT] = useTransition();
  const [czekOsm, startOsm] = useTransition();
  const [blad, ustawBlad] = useState<Record<string, string>>({});
  const [ok, ustawOk] = useState<Record<string, boolean>>({});
  const [bladOsm, ustawBladOsm] = useState<Record<string, string>>({});
  const [okOsm, ustawOkOsm] = useState<Record<string, string>>({});
  const [czekWoda, startWoda] = useTransition();
  const [bladWoda, ustawBladWoda] = useState<Record<string, string>>({});
  const [okWoda, ustawOkWoda] = useState<Record<string, string>>({});
  const [czekBanner, startBanner] = useTransition();
  const [bladBanner, ustawBladBanner] = useState<Record<string, string>>({});
  const [okBanner, ustawOkBanner] = useState<Record<string, boolean>>({});

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

  function dodajPunktWodyOsp(e: FormEvent<HTMLFormElement>, w: WiesDoEdycji) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    ustawBladWoda((b) => ({ ...b, [w.id]: "" }));
    ustawOkWoda((o) => ({ ...o, [w.id]: "" }));
    startWoda(async () => {
      const wynik = await dodajPunktCzerpaniaWodyOsp({
        villageId: w.id,
        name: String(fd.get("name") ?? ""),
        latitude: Number(fd.get("latitude")),
        longitude: Number(fd.get("longitude")),
        sourceType: String(fd.get("source_type") ?? "inne"),
        capacityLpm:
          String(fd.get("capacity_lpm") ?? "").trim() === "" ? null : Number(fd.get("capacity_lpm")),
        winterAccess: fd.get("winter_access") === "on",
        heavyTruckAccess: fd.get("heavy_truck_access") === "on",
        note: String(fd.get("note") ?? ""),
      });
      if ("blad" in wynik) {
        ustawBladWoda((b) => ({ ...b, [w.id]: wynik.blad }));
        return;
      }
      ustawOkWoda((o) => ({ ...o, [w.id]: "Dodano punkt czerpania wody OSP do mapy." }));
      e.currentTarget.reset();
    });
  }

  function wyslijBanner(e: FormEvent<HTMLFormElement>, w: WiesDoEdycji) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    ustawBladBanner((b) => ({ ...b, [w.id]: "" }));
    startBanner(async () => {
      const wynik = await zapiszBannerRynkuWsi({
        villageId: w.id,
        rynek_banner_text: String(fd.get("rynek_banner_text") ?? "") || null,
        rynek_banner_until: String(fd.get("rynek_banner_until") ?? "") || null,
      });
      if ("blad" in wynik) {
        ustawBladBanner((b) => ({ ...b, [w.id]: wynik.blad }));
        return;
      }
      ustawOkBanner((o) => ({ ...o, [w.id]: true }));
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
              {" · "}
              <a href="#qr-profil-wsi" className="text-green-800 underline">
                Kod QR dla tablicy
              </a>
            </p>
            <QrProfilWsiPanel nazwaWsi={w.name} sciezkaPubliczna={sciezka} villageId={w.id} />
            <SugestieAutomatyzacjiMapy
              villageId={w.id}
              nazwaWsi={w.name}
              sugestie={sugestieMapy[w.id] ?? []}
            />
            {kompletnoscMapy[w.id] ? (
              <PasekKompletnosciMapy nazwaWsi={w.name} kompletnosc={kompletnoscMapy[w.id]} />
            ) : null}
            <KolejkaWeryfikacjiPoi villageId={w.id} poczatkowe={poiDoWeryfikacji[w.id] ?? []} />
            <KolejkaPropozycjiPoi poczatkowe={propozycjePoi[w.id] ?? []} />
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
                  className="mt-1 w-full rounded border border-stone-300 px-2 py-1.5"
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
                  className="mt-1 w-full rounded border border-stone-300 px-2 py-1.5"
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
                  className="mt-1 w-full rounded border border-stone-300 px-2 py-1.5"
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

            <form onSubmit={(e) => wyslijBanner(e, w)} className="mt-6 space-y-3 rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 text-sm">
              <h3 className="font-serif text-base text-green-950">Banner na rynku lokalnym</h3>
              <p className="text-xs text-stone-600">
                Komunikat sezonowy widoczny na stronie <Link href={`${sciezka}/rynek`} className="text-green-800 underline">/rynek</Link> — np. kiermasz KGW, zbiory, festyn.
              </p>
              <div>
                <label className="font-medium" htmlFor={`rynek-banner-${w.id}`}>
                  Tekst bannera
                </label>
                <input
                  id={`rynek-banner-${w.id}`}
                  name="rynek_banner_text"
                  type="text"
                  defaultValue={w.rynek_banner_text ?? ""}
                  maxLength={500}
                  placeholder="np. Trwają zbiory · kiermasz KGW 15 czerwca na placu"
                  className="mt-1 w-full rounded border border-stone-300 px-2 py-1.5"
                />
              </div>
              <div>
                <label className="font-medium" htmlFor={`rynek-banner-do-${w.id}`}>
                  Pokaż do (opcjonalnie)
                </label>
                <input
                  id={`rynek-banner-do-${w.id}`}
                  name="rynek_banner_until"
                  type="date"
                  defaultValue={w.rynek_banner_until ?? ""}
                  className="mt-1 rounded border border-stone-300 px-2 py-1.5"
                />
              </div>
              {okBanner[w.id] ? (
                <p className="text-sm text-green-800" role="status">
                  Zapisano banner rynku.
                </p>
              ) : null}
              {bladBanner[w.id] ? (
                <p className="text-sm text-red-800" role="alert">
                  {bladBanner[w.id]}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={czekBanner}
                className="rounded-lg bg-amber-800 px-4 py-2 text-sm font-medium text-white hover:bg-amber-900 disabled:opacity-60"
              >
                {czekBanner ? "Zapisuję…" : "Zapisz banner rynku"}
              </button>
            </form>

            <div className="mt-8 border-t border-stone-200 pt-6">
              <h3 className="font-serif text-base text-green-950">Miejsca na mapie (szkoła, kościół, sklep…)</h3>
              <p className="mt-2 text-xs leading-relaxed text-stone-600">
                Publiczna mapa pokazuje pinezkę wsi według <strong>punktu GPS zapisanego przez administratora</strong>{" "}
                oraz osobne punkty z tabeli <code className="rounded bg-stone-100 px-1">pois</code>. Przykładowe
                „sztuczne” punkty z instalacji demo można zastąpić: możesz{" "}
                <strong>dopisać brakujące obiekty z OpenStreetMap</strong> w promieniu ok. 2,8 km od tego punktu (szkoła,
                przedszkole, boisko, urząd, apteka, poczta, przychodnia, stacja paliw, kult, świetlica, OSP, biblioteka,
                sklep, cmentarz, przystanki). Cron co kilka godzin też uzupełnia braki — zawsze sprawdź lokalnie, OSM bywa
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

              {maGps ? (
                <LadneMiejsceFormularz villageId={w.id} domyslnaLat={w.latitude} domyslnaLng={w.longitude} />
              ) : null}

              <CmentarzNaMapieFormularz
                villageId={w.id}
                nazwaWsi={w.name}
                domyslnaLat={w.latitude}
                domyslnaLng={w.longitude}
                maGps={maGps}
                istniejaceCmentarze={(poisByVillage[w.id] ?? [])
                  .filter((p) => p.category === "cmentarz")
                  .map((p) => ({ name: p.name }))}
              />

              <p className="mt-4 text-sm">
                <Link
                  href="/panel/soltys/cmentarz"
                  className="font-medium text-green-900 underline hover:text-green-950"
                >
                  Plan cmentarza (kwatery, rzędy, groby, QR przy bramie) →
                </Link>
              </p>

              <div className="mt-6 rounded-xl border border-emerald-200/80 bg-emerald-50/30 p-4">
                <h4 className="font-medium text-emerald-950">Telefon i godziny otwarcia (POI)</h4>
                <EdytorKontaktuPoiSoltys
                  villageId={w.id}
                  pois={poisByVillage[w.id] ?? []}
                  sale={saleByVillage[w.id] ?? []}
                />
              </div>

              <div className="mt-6 rounded-xl border border-blue-200/80 bg-blue-50/40 p-4">
                <h4 className="font-medium text-blue-950">OSP v1: punkt czerpania wody</h4>
                <p className="mt-1 text-xs text-stone-700">
                  Dodaj punkt operacyjny dla OSP: typ źródła, wydajność, dostęp zimą i dojazd ciężkim wozem.
                </p>
                {bladWoda[w.id] ? (
                  <p className="mt-2 text-sm text-red-800" role="alert">
                    {bladWoda[w.id]}
                  </p>
                ) : null}
                {okWoda[w.id] ? (
                  <p className="mt-2 text-sm text-green-800" role="status">
                    {okWoda[w.id]}
                  </p>
                ) : null}
                <form onSubmit={(e) => dodajPunktWodyOsp(e, w)} className="mt-3 grid gap-3 md:grid-cols-2">
                  <input
                    name="name"
                    required
                    placeholder="Nazwa punktu (np. Hydrant przy remizie)"
                    className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2"
                  />
                  <input
                    name="latitude"
                    type="number"
                    step="0.0000001"
                    required
                    defaultValue={w.latitude ?? ""}
                    placeholder="Szerokość geogr. (lat)"
                    className="rounded border border-stone-300 px-3 py-2 text-sm"
                  />
                  <input
                    name="longitude"
                    type="number"
                    step="0.0000001"
                    required
                    defaultValue={w.longitude ?? ""}
                    placeholder="Długość geogr. (lon)"
                    className="rounded border border-stone-300 px-3 py-2 text-sm"
                  />
                  <select name="source_type" className="rounded border border-stone-300 px-3 py-2 text-sm">
                    <option value="hydrant">Hydrant</option>
                    <option value="staw">Staw</option>
                    <option value="zbiornik">Zbiornik</option>
                    <option value="rzeka">Rzeka / ciek</option>
                    <option value="inne">Inne</option>
                  </select>
                  <input
                    name="capacity_lpm"
                    type="number"
                    min={0}
                    max={50000}
                    placeholder="Wydajność l/min (opcjonalnie)"
                    className="rounded border border-stone-300 px-3 py-2 text-sm"
                  />
                  <label className="inline-flex items-center gap-2 text-sm text-stone-700">
                    <input name="winter_access" type="checkbox" />
                    Dostęp zimą
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-stone-700">
                    <input name="heavy_truck_access" type="checkbox" />
                    Dojazd ciężkim wozem
                  </label>
                  <textarea
                    name="note"
                    rows={2}
                    placeholder="Uwagi operacyjne (opcjonalnie)"
                    className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2"
                  />
                  <button
                    type="submit"
                    disabled={czekWoda}
                    className="rounded-lg bg-blue-800 px-4 py-2 text-sm font-medium text-white hover:bg-blue-900 disabled:opacity-60 md:col-span-2"
                  >
                    {czekWoda ? "Dodaję punkt…" : "Dodaj punkt czerpania wody OSP"}
                  </button>
                </form>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
