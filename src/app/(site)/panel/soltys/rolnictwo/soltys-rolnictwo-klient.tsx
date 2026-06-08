"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { czyProfilRolnictwaUzupelniony, parsujProfilRolnictwa } from "@/lib/rolnictwo/profil-rolnictwa";
import { zapiszProfilRolnictwaZFormularza } from "../akcje-rolnictwo-wsi";

export type ProfilRolnictwaWiersz = {
  villageId: string;
  profileData: unknown;
  isPublished: boolean;
};

type Props = {
  wsie: { id: string; name: string }[];
  profile: ProfilRolnictwaWiersz[];
  sciezkiPubliczne?: Record<string, string>;
};

function NaglowekGrupy({ tytul, opis }: { tytul: string; opis?: string }) {
  return (
    <div className="border-b border-lime-100 pb-3">
      <h3 className="font-medium text-lime-950">{tytul}</h3>
      {opis ? <p className="mt-0.5 text-xs text-stone-500">{opis}</p> : null}
    </div>
  );
}

export function SoltysRolnictwoKlient({ wsie, profile, sciezkiPubliczne = {} }: Props) {
  const [villageId, ustawVillageId] = useState(wsie[0]?.id ?? "");
  const [blad, ustawBlad] = useState("");
  const [komunikat, ustawKomunikat] = useState("");
  const [czek, startT] = useTransition();

  const profilWies = profile.find((p) => p.villageId === villageId);
  const profilJson = parsujProfilRolnictwa(profilWies?.profileData ?? null);
  const uzupelniony = czyProfilRolnictwaUzupelniony(profilJson);
  const opublikowany = profilWies?.isPublished ?? false;
  const podgladHref = sciezkiPubliczne[villageId] ? `${sciezkiPubliczne[villageId]}/rolnictwo` : null;

  const statusWies = useMemo(() => {
    return wsie.map((w) => {
      const p = profile.find((x) => x.villageId === w.id);
      const json = parsujProfilRolnictwa(p?.profileData ?? null);
      return {
        id: w.id,
        uzupelniony: czyProfilRolnictwaUzupelniony(json),
        opublikowany: p?.isPublished ?? false,
      };
    });
  }, [wsie, profile]);

  function onZapisz(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    ustawBlad("");
    const fd = new FormData(e.currentTarget);
    fd.set("village_id", villageId);
    startT(async () => {
      const w = await zapiszProfilRolnictwaZFormularza(fd);
      if ("blad" in w) ustawBlad(w.blad);
      else ustawKomunikat("Profil rolniczy zapisany.");
    });
  }

  if (wsie.length === 0) {
    return <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-950">Brak przypisanej wsi jako sołtys.</p>;
  }

  return (
    <div className="space-y-8">
      {komunikat ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950" role="status">
          {komunikat}
        </p>
      ) : null}
      {blad ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
          {blad}
        </p>
      ) : null}

      <section className="soltys-sekcja overflow-hidden border-lime-200/80 bg-gradient-to-br from-lime-50/40 via-white to-amber-50/20">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-lg text-lime-950">Profil rolnictwa wsi</h2>
            <p className="mt-1 max-w-prose text-sm text-stone-600">
              ARiMR, dopłaty, skup i ostrzeżenia — widoczne na stronie{" "}
              <code className="rounded bg-lime-100 px-1 text-xs">/rolnictwo</code> po publikacji. Ceny GUS ładują się automatycznie.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {uzupelniony ? (
              <span className="rounded-full bg-lime-100 px-2.5 py-1 text-xs font-medium text-lime-900">Profil uzupełniony</span>
            ) : (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900">Do uzupełnienia</span>
            )}
            {opublikowany ? (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-900">Opublikowany</span>
            ) : (
              <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600">Szkic</span>
            )}
            {podgladHref ? (
              <Link
                href={podgladHref}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-lime-300 bg-white px-3 py-1.5 text-xs font-medium text-lime-900 hover:bg-lime-50"
              >
                Podgląd ↗
              </Link>
            ) : null}
          </div>
        </div>

        <form key={villageId} onSubmit={onZapisz} className="forms-premium mt-6 space-y-8">
          <div>
            <label className="block text-sm font-medium text-stone-700">
              Wieś
              <select className="form-control mt-1 max-w-md" value={villageId} onChange={(e) => ustawVillageId(e.target.value)}>
                {wsie.map((w) => {
                  const s = statusWies.find((x) => x.id === w.id);
                  const etykieta = s?.opublikowany ? " · opublikowany" : s?.uzupelniony ? " · szkic" : "";
                  return (
                    <option key={w.id} value={w.id}>
                      {w.name}
                      {etykieta}
                    </option>
                  );
                })}
              </select>
            </label>
          </div>

          <fieldset className="space-y-4">
            <NaglowekGrupy tytul="Kontakt i instytucje" opis="ARiMR, ODR, biuro obsługi rolników" />
            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                ARiMR — kontakt / biuro
                <input name="rol_arimr" defaultValue={profilJson?.kontakt_arimr ?? ""} className="form-control mt-1" placeholder="Oddział, telefon, adres" />
              </label>
              <label>
                ODR / doradztwo
                <input name="rol_odr" defaultValue={profilJson?.kontakt_odr ?? ""} className="form-control mt-1" />
              </label>
              <label>
                Telefon
                <input name="rol_telefon" defaultValue={profilJson?.kontakt_telefon ?? ""} className="form-control mt-1" />
              </label>
              <label>
                E-mail
                <input name="rol_email" type="email" defaultValue={profilJson?.kontakt_email ?? ""} className="form-control mt-1" />
              </label>
            </div>
            <label className="block">
              Biuro obsługi rolników (gmina / powiat)
              <input name="rol_biuro" defaultValue={profilJson?.biuro_obslugi ?? ""} className="form-control mt-1" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                Link eWniosekPlus
                <input name="rol_ewniosek" type="url" defaultValue={profilJson?.link_ewniosekplus ?? ""} className="form-control mt-1" placeholder="https://ewniosekplus.arimr.gov.pl" />
              </label>
              <label>
                Link rejestr zwierząt
                <input name="rol_krap" type="url" defaultValue={profilJson?.link_krap ?? ""} className="form-control mt-1" />
              </label>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <NaglowekGrupy tytul="Dopłaty i skup" opis="Terminy WPR, odbiór płodów i mleka" />
            <label className="block">
              Terminy dopłat i WPR
              <textarea name="rol_doplaty" rows={3} className="form-control mt-1" defaultValue={profilJson?.terminy_doplaty ?? ""} placeholder="np. Składanie wniosków do 15 maja — eWniosekPlus" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                Skup zbóż i płodów
                <textarea name="rol_skup_zboz" rows={3} className="form-control mt-1" defaultValue={profilJson?.skup_zboz ?? ""} />
              </label>
              <label className="block">
                Skup mleka / zwierząt
                <textarea name="rol_skup_mleko" rows={3} className="form-control mt-1" defaultValue={profilJson?.skup_mleko ?? ""} />
              </label>
            </div>
            <label className="block">
              Odbiór opakowań po środkach ochrony roślin
              <textarea name="rol_opakowania" rows={2} className="form-control mt-1" defaultValue={profilJson?.odbior_opakowan ?? ""} />
            </label>
          </fieldset>

          <fieldset className="space-y-4">
            <NaglowekGrupy tytul="Ostrzeżenia sezonowe" opis="Susza, choroby zwierząt, inne uwagi" />
            <label className="block">
              Susza / nawodnienie
              <textarea name="rol_susza" rows={2} className="form-control mt-1" defaultValue={profilJson?.ostrzezenie_susza ?? ""} />
            </label>
            <label className="block">
              Choroby zwierząt (ASF, ptasia grypa…)
              <textarea name="rol_choroby" rows={2} className="form-control mt-1" defaultValue={profilJson?.choroby_zwierzat ?? ""} />
            </label>
            <label className="block">
              Uwagi sezonowe
              <textarea name="rol_uwagi" rows={2} className="form-control mt-1" defaultValue={profilJson?.uwagi_sezonowe ?? ""} />
            </label>
          </fieldset>

          <div className="flex flex-wrap items-center gap-4 border-t border-lime-100 pt-4">
            <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
              <input type="checkbox" name="opublikowany" value="1" defaultChecked={opublikowany} className="size-4 rounded border-lime-300" />
              Opublikuj na stronie wsi
            </label>
            <button type="submit" disabled={czek} className="btn-panel-primary">
              {czek ? "Zapisywanie…" : "Zapisz profil rolniczy"}
            </button>
          </div>
        </form>
      </section>

      <section className="soltys-sekcja">
        <h2 className="font-serif text-lg text-lime-950">Powiązane moduły</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Link
            href="/panel/soltys/spolecznosc?tryb=rolnicy"
            className="rounded-xl border border-lime-200 bg-white p-4 text-sm shadow-sm transition hover:border-lime-400 hover:shadow"
          >
            <span className="text-lg" aria-hidden>👥</span>
            <span className="mt-2 block font-medium text-lime-950">Koło rolników</span>
            <span className="mt-1 block text-xs text-stone-500">Profil organizacji, zebrania</span>
          </Link>
          <Link
            href="/panel/mieszkaniec/rolnictwo-ceny"
            className="rounded-xl border border-lime-200 bg-white p-4 text-sm shadow-sm transition hover:border-lime-400 hover:shadow"
          >
            <span className="text-lg" aria-hidden>💰</span>
            <span className="mt-2 block font-medium text-lime-950">Ceny sąsiedzkie</span>
            <span className="mt-1 block text-xs text-stone-500">Zgłoszenia mieszkańców</span>
          </Link>
          <Link
            href="/panel/soltys/moja-wies"
            className="rounded-xl border border-lime-200 bg-white p-4 text-sm shadow-sm transition hover:border-lime-400 hover:shadow"
          >
            <span className="text-lg" aria-hidden>⚙️</span>
            <span className="mt-2 block font-medium text-lime-950">Wygląd profilu</span>
            <span className="mt-1 block text-xs text-stone-500">Włącz moduł „Rolnictwo”</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
