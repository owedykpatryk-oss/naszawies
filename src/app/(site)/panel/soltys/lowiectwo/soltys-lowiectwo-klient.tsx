"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { EdytorObszaruPolowania } from "@/components/panel/edytor-obszaru-polowania";
import type { GeoJsonPolygonPolowania } from "@/lib/lowiectwo/geojson-obszar";
import { presetyTerminowPolowania } from "@/lib/lowiectwo/szybkie-terminy";
import {
  aktualizujObszarOstrzezeniaLowieckiego,
  dodajOstrzezenieLowieckieSoltys,
  zmienStatusOstrzezeniaLowieckiego,
} from "../akcje-lowiectwo";

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
  maObszarMapy: boolean;
};

export type WiesGeoLowiectwo = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  boundaryGeojson: unknown | null;
};

type Props = { wsie: WiesGeoLowiectwo[]; wiersze: WierszOstrzezenia[] };

function UzupelnijObszarPolowania({
  noticeId,
  wies,
  onZapisano,
}: {
  noticeId: string;
  wies: WiesGeoLowiectwo;
  onZapisano: () => void;
}) {
  const [obszar, ustawObszar] = useState<GeoJsonPolygonPolowania | null>(null);
  const [blad, ustawBlad] = useState("");
  const [czek, startT] = useTransition();

  return (
    <div className="mt-3 rounded-xl border border-amber-300/70 bg-amber-50/60 p-3">
      <p className="text-xs font-medium text-amber-950">Brak obszaru na mapie — uzupełnij teraz</p>
      <div className="mt-2">
        <EdytorObszaruPolowania
          key={`uzup-${noticeId}`}
          srodekLat={wies.lat}
          srodekLng={wies.lon}
          boundaryGeojson={wies.boundaryGeojson}
          value={obszar}
          onChange={ustawObszar}
        />
      </div>
      {blad ? <p className="mt-2 text-xs text-red-800">{blad}</p> : null}
      <button
        type="button"
        disabled={!obszar || czek}
        className="btn-panel-primary mt-2 text-xs"
        onClick={() => {
          if (!obszar) return;
          startT(async () => {
            const res = await aktualizujObszarOstrzezeniaLowieckiego({ noticeId, areaGeojson: obszar });
            if ("blad" in res) ustawBlad(res.blad);
            else onZapisano();
          });
        }}
      >
        Zapisz obszar na mapie
      </button>
    </div>
  );
}

export function SoltysLowiectwoKlient({ wsie, wiersze: poczatkowe }: Props) {
  const [wiersze, ustawWiersze] = useState(poczatkowe);
  const [blad, ustawBlad] = useState("");
  const [komunikat, ustawKomunikat] = useState("");
  const [czek, startT] = useTransition();

  const pierwszaWies = wsie[0]?.id ?? "";
  const [villageId, ustawVillageId] = useState(pierwszaWies);
  const [obszar, ustawObszar] = useState<GeoJsonPolygonPolowania | null>(null);
  const [startsAt, ustawStartsAt] = useState("");
  const [endsAt, ustawEndsAt] = useState("");

  const presety = useMemo(() => presetyTerminowPolowania(), []);
  const wybranaWies = wsie.find((w) => w.id === villageId) ?? wsie[0];

  function onDodaj(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    ustawBlad("");
    if (!obszar) {
      ustawBlad("Zaznacz obszar na mapie i kliknij „Zamknij obszar”.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    startT(async () => {
      const w = await dodajOstrzezenieLowieckieSoltys({
        villageId: String(fd.get("village_id") || villageId),
        title: String(fd.get("title")),
        areaDescription: String(fd.get("area_description")),
        safetyNote: String(fd.get("safety_note") || "").trim() || null,
        contactPhone: String(fd.get("contact_phone") || "").trim() || null,
        contactName: String(fd.get("contact_name") || "").trim() || null,
        startsAt: startsAt || String(fd.get("starts_at")),
        endsAt: endsAt || String(fd.get("ends_at")),
        areaGeojson: obszar,
      });
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawKomunikat("Ostrzeżenie opublikowane — obszar widać na mapie i profilu wsi.");
      window.location.reload();
    });
  }

  if (wsie.length === 0) {
    return (
      <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-950">
        Brak przypisanej wsi jako sołtys — nie możesz dodać ostrzeżenia.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {komunikat ? <p className="rounded-lg bg-green-50 p-3 text-sm text-green-950">{komunikat}</p> : null}
      {blad ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-900">{blad}</p> : null}

      <section className="soltys-sekcja forms-premium">
        <h2 className="font-serif text-lg text-green-950">Nowe polowanie — szybko</h2>
        <p className="mt-1 text-sm text-stone-600">
          Zaznacz rejon na mapie, wybierz termin jednym kliknięciem i opublikuj. Mieszkańcy zobaczą obszar na{" "}
          <Link href="/mapa" className="link-panel">
            mapie
          </Link>{" "}
          i na profilu wsi.
        </p>

        <form onSubmit={onDodaj} className="mt-5 space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              Wieś
              <select
                name="village_id"
                required
                className="form-control mt-1"
                value={villageId}
                onChange={(e) => {
                  ustawVillageId(e.target.value);
                  ustawObszar(null);
                }}
              >
                {wsie.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block sm:col-span-2">
              Tytuł
              <input
                name="title"
                required
                maxLength={160}
                className="form-control mt-1"
                placeholder="np. Polowanie redukcyjne — las przy drodze gminnej"
              />
            </label>
          </div>

          {wybranaWies ? (
            <div>
              <h3 className="text-sm font-semibold text-green-950">Obszar na mapie</h3>
              <div className="mt-2">
                <EdytorObszaruPolowania
                  key={wybranaWies.id}
                  srodekLat={wybranaWies.lat}
                  srodekLng={wybranaWies.lon}
                  boundaryGeojson={wybranaWies.boundaryGeojson}
                  value={obszar}
                  onChange={ustawObszar}
                />
              </div>
            </div>
          ) : null}

          <div>
            <h3 className="text-sm font-semibold text-green-950">Kiedy</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {presety.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-800 shadow-sm transition hover:border-emerald-600 hover:bg-emerald-50"
                  onClick={() => {
                    ustawStartsAt(p.startsAt);
                    ustawEndsAt(p.endsAt);
                  }}
                >
                  {p.etykieta}
                </button>
              ))}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label>
                Od
                <input
                  type="datetime-local"
                  name="starts_at"
                  required
                  className="form-control mt-1"
                  value={startsAt}
                  onChange={(e) => ustawStartsAt(e.target.value)}
                />
              </label>
              <label>
                Do
                <input
                  type="datetime-local"
                  name="ends_at"
                  required
                  className="form-control mt-1"
                  value={endsAt}
                  onChange={(e) => ustawEndsAt(e.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              Opis rejonu (dla osób bez mapy)
              <textarea
                name="area_description"
                required
                rows={2}
                className="form-control mt-1"
                placeholder="np. Las między drogą gminną a rzeką — od znaku „zakaz wstępu”"
              />
            </label>
            <label className="block sm:col-span-2">
              Uwaga bezpieczeństwa (opcjonalnie)
              <textarea
                name="safety_note"
                rows={2}
                className="form-control mt-1"
                placeholder="np. Prosimy o nie wchodzenie z psami bez smyczy."
              />
            </label>
            <label>
              Kontakt — osoba
              <input name="contact_name" maxLength={120} className="form-control mt-1" placeholder="Łowczy" />
            </label>
            <label>
              Telefon
              <input name="contact_phone" maxLength={40} className="form-control mt-1" />
            </label>
          </div>

          <button type="submit" disabled={czek || !obszar} className="btn-panel-primary">
            Opublikuj na mapie i profilu wsi
          </button>
        </form>

        <p className="mt-3 text-xs text-stone-500">
          <Link href="/panel/soltys/spolecznosc?tryb=mysliwi" className="link-panel">
            Profil koła łowieckiego
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
                  {r.maObszarMapy ? " · obszar na mapie" : ""}
                </p>
                {!r.maObszarMapy && wsie.find((w) => w.id === r.villageId) ? (
                  <UzupelnijObszarPolowania
                    noticeId={r.id}
                    wies={wsie.find((w) => w.id === r.villageId)!}
                    onZapisano={() => window.location.reload()}
                  />
                ) : null}
                <div className="mt-2 flex flex-wrap gap-2">
                  {r.aktywne && r.maObszarMapy ? (
                    <Link href={`/mapa?polowanie=${encodeURIComponent(r.id)}`} className="btn-panel-secondary text-xs">
                      Podgląd na mapie
                    </Link>
                  ) : null}
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
                            ustawWiersze((prev) =>
                              prev.map((x) => (x.id === r.id ? { ...x, status: "archived", aktywne: false } : x)),
                            );
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
