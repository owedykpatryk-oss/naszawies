"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { EdytorObszaruPolowania } from "@/components/panel/edytor-obszaru-polowania";
import {
  RODZAJE_OSTRZEZENIA_LESNEGO,
  ETYKIETA_RODZAJU_OSTRZEZENIA,
  czyRodzajOstrzezeniaLesnego,
} from "@/lib/lesnictwo/kategorie-ostrzezen";
import { czyProfilLesnictwaUzupelniony, parsujProfilLesnictwa } from "@/lib/lesnictwo/profil-lesnictwa";
import { presetyTerminowLesnych } from "@/lib/lesnictwo/szybkie-terminy";
import type { GeoJsonPolygonPolowania } from "@/lib/lowiectwo/geojson-obszar";
import {
  dodajOstrzezenieLesneSoltys,
  zapiszProfilLesnictwaZFormularza,
  zmienStatusOstrzezeniaLesnego,
} from "../akcje-lesnictwo";

export type WierszOstrzezeniaLesnego = {
  id: string;
  villageId: string;
  wiesNazwa: string;
  noticeKind: string;
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

export type WiesGeoLesnictwo = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  boundaryGeojson: unknown | null;
};

export type ProfilLesnictwaWiersz = {
  villageId: string;
  profileData: unknown;
  isPublished: boolean;
};

type Props = {
  wsie: WiesGeoLesnictwo[];
  wiersze: WierszOstrzezeniaLesnego[];
  profile: ProfilLesnictwaWiersz[];
};

export function SoltysLesnictwoKlient({ wsie, wiersze: poczatkowe, profile }: Props) {
  const [wiersze, ustawWiersze] = useState(poczatkowe);
  const [blad, ustawBlad] = useState("");
  const [komunikat, ustawKomunikat] = useState("");
  const [czek, startT] = useTransition();

  const pierwszaWies = wsie[0]?.id ?? "";
  const [villageId, ustawVillageId] = useState(pierwszaWies);
  const [obszar, ustawObszar] = useState<GeoJsonPolygonPolowania | null>(null);
  const [startsAt, ustawStartsAt] = useState("");
  const [endsAt, ustawEndsAt] = useState("");
  const [noticeKind, ustawNoticeKind] = useState<string>("zakaz_wejscia");

  const presety = useMemo(() => presetyTerminowLesnych(), []);
  const wybranaWies = wsie.find((w) => w.id === villageId) ?? wsie[0];
  const profilWies = profile.find((p) => p.villageId === villageId);
  const profilJson = parsujProfilLesnictwa(profilWies?.profileData ?? null);

  function onZapiszProfil(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    ustawBlad("");
    const fd = new FormData(e.currentTarget);
    fd.set("village_id", villageId);
    startT(async () => {
      const w = await zapiszProfilLesnictwaZFormularza(fd);
      if ("blad" in w) ustawBlad(w.blad);
      else ustawKomunikat("Profil leśny zapisany.");
    });
  }

  function onDodaj(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    ustawBlad("");
    const fd = new FormData(e.currentTarget);
    startT(async () => {
      const w = await dodajOstrzezenieLesneSoltys({
        villageId: String(fd.get("village_id") || villageId),
        noticeKind: String(fd.get("notice_kind") || noticeKind),
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
      ustawKomunikat("Ostrzeżenie leśne opublikowane.");
      window.location.reload();
    });
  }

  if (wsie.length === 0) {
    return (
      <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-950">
        Brak przypisanej wsi jako sołtys.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {komunikat ? <p className="rounded-lg bg-green-50 p-3 text-sm text-green-950">{komunikat}</p> : null}
      {blad ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-900">{blad}</p> : null}

      <section className="soltys-sekcja forms-premium">
        <h2 className="font-serif text-lg text-green-950">Profil leśnictwa wsi</h2>
        <p className="mt-1 text-sm text-stone-600">
          Stałe informacje: nadleśnictwo, choinki, drewno, zasady pobytu w lesie. Widoczne na{" "}
          <code className="text-xs">/wies/…/lesnictwo</code> po zaznaczeniu „Opublikuj”.
        </p>
        <form onSubmit={onZapiszProfil} className="mt-5 space-y-4">
          <label className="block">
            Wieś
            <select
              className="form-control mt-1"
              value={villageId}
              onChange={(e) => ustawVillageId(e.target.value)}
            >
              {wsie.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                  {czyProfilLesnictwaUzupelniony(parsujProfilLesnictwa(profile.find((p) => p.villageId === w.id)?.profileData ?? null))
                    ? " ✓"
                    : ""}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              Nadleśnictwo
              <input name="les_nadlesnictwo" defaultValue={profilJson?.nadlesnictwo ?? ""} className="form-control mt-1" />
            </label>
            <label>
              Leśnictwo
              <input name="les_lesnictwo" defaultValue={profilJson?.lesnictwo ?? ""} className="form-control mt-1" />
            </label>
            <label>
              Telefon
              <input name="les_telefon" defaultValue={profilJson?.kontakt_telefon ?? ""} className="form-control mt-1" />
            </label>
            <label>
              E-mail
              <input name="les_email" type="email" defaultValue={profilJson?.kontakt_email ?? ""} className="form-control mt-1" />
            </label>
          </div>
          <label className="block">
            Godziny leśniczówki
            <textarea name="les_godziny" rows={2} className="form-control mt-1" defaultValue={profilJson?.godziny_lesniczowki ?? ""} />
          </label>
          <label className="block">
            Sezon choinek / pozyskanie drzewek
            <textarea name="les_choinki" rows={3} className="form-control mt-1" defaultValue={profilJson?.sezon_choinek ?? ""} placeholder="Gdzie kupić choinkę, terminy, pozwolenia LP…" />
          </label>
          <label className="block">
            Link (iLas / nadleśnictwo)
            <input name="les_link_choinki" type="url" className="form-control mt-1" defaultValue={profilJson?.link_choinki ?? ""} />
          </label>
          <label className="block">
            Drewno opałowe — gdzie kupić / uwagi
            <textarea name="les_drewno" rows={2} className="form-control mt-1" defaultValue={profilJson?.drewno_opal ?? ""} />
          </label>
          <label className="block">
            Zasady pobytu w lesie (grzyby, psy, ogniska…)
            <textarea name="les_zasady" rows={3} className="form-control mt-1" defaultValue={profilJson?.zasady_pobytu ?? ""} />
          </label>
          <label className="block">
            Uwagi sezonowe
            <textarea name="les_uwagi" rows={2} className="form-control mt-1" defaultValue={profilJson?.uwagi_sezonowe ?? ""} />
          </label>
          <label className="block">
            Link do strony nadleśnictwa
            <input name="les_link_lp" type="url" className="form-control mt-1" defaultValue={profilJson?.link_nadlesnictwo ?? ""} placeholder="https://…" />
          </label>
          <label className="block">
            Zagrożenie pożarowe (susza, zakaz wstępu do lasu)
            <textarea name="les_pozar" rows={2} className="form-control mt-1" defaultValue={profilJson?.zagrozenie_pozarowe ?? ""} placeholder="np. Stopień zagrożenia pożarowego — informacja LP…" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="opublikowany" value="1" defaultChecked={profilWies?.isPublished ?? false} />
            Opublikuj profil na stronie wsi
          </label>
          <button type="submit" disabled={czek} className="btn-panel-primary">
            Zapisz profil leśny
          </button>
        </form>
      </section>

      <section className="soltys-sekcja forms-premium">
        <h2 className="font-serif text-lg text-green-950">Nowe ostrzeżenie leśne</h2>
        <p className="mt-1 text-sm text-stone-600">
          Zakaz wstępu, wycinka, pożar, silny wiatr — z opcjonalnym obszarem na mapie.
        </p>
        <form onSubmit={onDodaj} className="mt-5 space-y-6">
          <input type="hidden" name="village_id" value={villageId} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              Rodzaj
              <select
                name="notice_kind"
                className="form-control mt-1"
                value={noticeKind}
                onChange={(e) => ustawNoticeKind(e.target.value)}
              >
                {RODZAJE_OSTRZEZENIA_LESNEGO.map((k) => (
                  <option key={k} value={k}>
                    {ETYKIETA_RODZAJU_OSTRZEZENIA[k]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block sm:col-span-2">
              Tytuł
              <input name="title" required maxLength={160} className="form-control mt-1" placeholder="np. Wycinka drzew przy leśnej drodze" />
            </label>
          </div>

          {wybranaWies ? (
            <div>
              <h3 className="text-sm font-semibold text-green-950">Obszar na mapie (opcjonalnie)</h3>
              <p className="text-xs text-stone-500">Bez obszaru — ostrzeżenie pojawi się tylko na profilu wsi.</p>
              <div className="mt-2">
                <EdytorObszaruPolowania
                  key={`les-${wybranaWies.id}`}
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
            <h3 className="text-sm font-semibold text-green-950">Termin</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {presety.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-800 shadow-sm hover:border-emerald-600 hover:bg-emerald-50"
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
                <input type="datetime-local" name="starts_at" required className="form-control mt-1" value={startsAt} onChange={(e) => ustawStartsAt(e.target.value)} />
              </label>
              <label>
                Do
                <input type="datetime-local" name="ends_at" required className="form-control mt-1" value={endsAt} onChange={(e) => ustawEndsAt(e.target.value)} />
              </label>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              Opis rejonu
              <textarea name="area_description" required rows={2} className="form-control mt-1" placeholder="np. Las od mostu do polany — wstęp wzbroniony" />
            </label>
            <label className="block sm:col-span-2">
              Uwaga / zalecenia
              <textarea name="safety_note" rows={2} className="form-control mt-1" placeholder="np. Omijajcie szlak leśny między godz. 7 a 16." />
            </label>
            <label>
              Kontakt
              <input name="contact_name" maxLength={120} className="form-control mt-1" placeholder="Leśniczy" />
            </label>
            <label>
              Telefon
              <input name="contact_phone" maxLength={40} className="form-control mt-1" />
            </label>
          </div>

          <button type="submit" disabled={czek} className="btn-panel-primary">
            Opublikuj ostrzeżenie
          </button>
        </form>
      </section>

      <section className="soltys-sekcja">
        <h2 className="font-serif text-lg text-green-950">Lista ostrzeżeń</h2>
        {wiersze.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">Brak ostrzeżeń.</p>
        ) : (
          <ul className="soltys-lista-moderacji mt-4">
            {wiersze.map((r) => (
              <li key={r.id} className="p-4">
                <p className="text-xs text-stone-500">{r.wiesNazwa}</p>
                <p className="text-xs font-semibold text-emerald-800">
                  {czyRodzajOstrzezeniaLesnego(r.noticeKind)
                    ? ETYKIETA_RODZAJU_OSTRZEZENIA[r.noticeKind]
                    : r.noticeKind}
                </p>
                <p className="font-medium text-stone-900">{r.title}</p>
                <p className="mt-1 text-sm text-stone-700">{r.areaDescription}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {new Date(r.startsAt).toLocaleString("pl-PL")} – {new Date(r.endsAt).toLocaleString("pl-PL")}
                  {r.aktywne ? " · aktywne" : ""}
                  {r.maObszarMapy ? " · mapa" : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {r.maObszarMapy ? (
                    <Link href={`/mapa?les=${encodeURIComponent(r.id)}`} className="btn-panel-secondary text-xs">
                      Mapa
                    </Link>
                  ) : null}
                  {r.status === "approved" ? (
                    <button
                      type="button"
                      className="btn-panel-secondary text-xs"
                      disabled={czek}
                      onClick={() =>
                        startT(async () => {
                          await zmienStatusOstrzezeniaLesnego({ noticeId: r.id, status: "archived" });
                          ustawWiersze((prev) => prev.filter((x) => x.id !== r.id));
                        })
                      }
                    >
                      Zakończ
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
