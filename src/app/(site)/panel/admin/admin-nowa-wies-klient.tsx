"use client";

import Link from "next/link";
import { FormEvent, useState, useTransition } from "react";
import { adminUtworzWiesISoltysa } from "./akcje-wies";

export function AdminNowaWiesKlient() {
  const [blad, ustawBlad] = useState("");
  const [ok, ustawOk] = useState(false);
  const [czek, startT] = useTransition();

  function wyslij(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    ustawBlad("");
    ustawOk(false);
    const fd = new FormData(e.currentTarget);
    const obj = {
      terytId: String(fd.get("teryt_id") ?? "").trim(),
      nazwa: String(fd.get("nazwa") ?? "").trim(),
      wojewodztwo: String(fd.get("wojewodztwo") ?? "").trim(),
      powiat: String(fd.get("powiat") ?? "").trim(),
      gmina: String(fd.get("gmina") ?? "").trim(),
      typGminy: String(fd.get("typ_gminy") ?? "").trim() || undefined,
      emailSoltysa: String(fd.get("email_soltysa") ?? "").trim(),
      slugReczny: (String(fd.get("slug_reczny") ?? "").trim() || null) as string | null,
      latitude: (() => {
        const s = String(fd.get("lat") ?? "").trim();
        if (s === "") return null;
        const n = Number(s);
        return Number.isFinite(n) ? n : null;
      })(),
      longitude: (() => {
        const s = String(fd.get("lon") ?? "").trim();
        if (s === "") return null;
        const n = Number(s);
        return Number.isFinite(n) ? n : null;
      })(),
      population: (() => {
        const s = String(fd.get("populacja") ?? "").trim();
        if (s === "") return null;
        const n = parseInt(s, 10);
        return Number.isFinite(n) ? n : null;
      })(),
    };
    startT(async () => {
      const w = await adminUtworzWiesISoltysa(obj);
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawOk(true);
      (e.target as HTMLFormElement).reset();
    });
  }

  return (
    <div className="mt-10 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="font-serif text-xl text-green-950">Nowa wieś w serwisie (sołtys)</h2>
      <p className="mt-2 text-sm text-stone-600">
        Gdy miejscowości nie było w urzędowym katalogu, zrób jedną turę: wsi wpada do wyszukiwarki, a wskazane
        konto dostaje aktywnego sołtysa. Sołtys musi <strong>już mieć konto</strong> (ten sam adres e-mail co po
        rejestracji w serwisie). Opis, linki i zdjęcie — potem w{" "}
        <Link href="/panel/soltys/moja-wies" className="font-medium text-green-900 underline">
          panelu sołtysa → Profil wsi
        </Link>
        .
      </p>
      {ok ? (
        <p className="mt-3 text-sm text-green-900" role="status">
          Zapisano — wieś powinna być widoczna w wyszukiwarce po odświeżeniu.
        </p>
      ) : null}
      {blad ? (
        <p className="mt-3 text-sm text-red-800" role="alert">
          {blad}
        </p>
      ) : null}
      <form onSubmit={wyslij} className="mt-4 space-y-3 text-sm">
        <div>
          <label className="font-medium" htmlFor="adm-teryt">
            Kod miejscowości (7 znaków, urzędowy identyfikator miejscowości)
          </label>
          <input
            id="adm-teryt"
            name="teryt_id"
            required
            className="mt-1 w-full max-w-md rounded border border-stone-300 px-2 py-1.5"
            placeholder="np. 0088354"
            maxLength={20}
          />
        </div>
        <div>
          <label className="font-medium" htmlFor="adm-nazwa">
            Nazwa wsi
          </label>
          <input id="adm-nazwa" name="nazwa" required minLength={2} className="mt-1 w-full max-w-md rounded border border-stone-300 px-2 py-1.5" />
        </div>
        <div>
          <label className="font-medium" htmlFor="adm-woj">
            Województwo (slug w adresie strony, małymi literami)
          </label>
          <input
            id="adm-woj"
            name="wojewodztwo"
            required
            className="mt-1 w-full max-w-md rounded border border-stone-300 px-2 py-1.5"
            placeholder="kujawsko-pomorskie"
          />
        </div>
        <div>
          <label className="font-medium" htmlFor="adm-pow">
            Powiat
          </label>
          <input
            id="adm-pow"
            name="powiat"
            required
            className="mt-1 w-full max-w-md rounded border border-stone-300 px-2 py-1.5"
            placeholder="nakielski"
          />
        </div>
        <div>
          <label className="font-medium" htmlFor="adm-gm">
            Gmina
          </label>
          <input id="adm-gm" name="gmina" required className="mt-1 w-full max-w-md rounded border border-stone-300 px-2 py-1.5" placeholder="Kcynia" />
        </div>
        <div>
          <label className="font-medium" htmlFor="adm-typg">
            Rodzaj gminy
          </label>
          <select
            id="adm-typg"
            name="typ_gminy"
            className="mt-1 w-full max-w-md rounded border border-stone-300 px-2 py-1.5"
            defaultValue="gmina_miejsko_wiejska"
          >
            <option value="gmina_miejsko_wiejska">Gmina miejsko-wiejska</option>
            <option value="gmina_wiejska">Gmina wiejska</option>
            <option value="miasto">Miasto</option>
            <option value="gmina_miejska">Gmina miejska</option>
          </select>
        </div>
        <div>
          <label className="font-medium" htmlFor="adm-mail">
            E-mail sołtysa (konto w serwisie)
          </label>
          <input
            id="adm-mail"
            name="email_soltysa"
            type="email"
            required
            className="mt-1 w-full max-w-md rounded border border-stone-300 px-2 py-1.5"
          />
        </div>
        <div>
          <label className="font-medium" htmlFor="adm-slug">
            Własny skrót w URL (opcjonalnie, domyślnie z nazwy)
          </label>
          <input
            id="adm-slug"
            name="slug_reczny"
            className="mt-1 w-full max-w-md rounded border border-stone-300 px-2 py-1.5"
            placeholder="np. sipiory"
          />
        </div>
        <div className="flex max-w-md flex-col gap-2 sm:flex-row">
          <div className="flex-1">
            <label className="font-medium" htmlFor="adm-lat">
              Szer. geogr. (opcj.)
            </label>
            <input
              id="adm-lat"
              name="lat"
              type="text"
              inputMode="decimal"
              className="mt-1 w-full rounded border border-stone-300 px-2 py-1.5"
              placeholder="53.07"
            />
          </div>
          <div className="flex-1">
            <label className="font-medium" htmlFor="adm-lon">
              Dł. geogr. (opcj.)
            </label>
            <input
              id="adm-lon"
              name="lon"
              type="text"
              inputMode="decimal"
              className="mt-1 w-full rounded border border-stone-300 px-2 py-1.5"
              placeholder="17.51"
            />
          </div>
        </div>
        <div>
          <label className="font-medium" htmlFor="adm-pop">
            Ludność (opcj.)
          </label>
          <input id="adm-pop" name="populacja" type="number" min={0} className="mt-1 w-full max-w-sm rounded border border-stone-300 px-2 py-1.5" />
        </div>
        <button
          type="submit"
          disabled={czek}
          className="rounded-lg bg-green-800 px-4 py-2 font-medium text-white hover:bg-green-900 disabled:opacity-60"
        >
          {czek ? "Zapisuję…" : "Utwórz wieś i przypisz sołtysa"}
        </button>
      </form>
    </div>
  );
}
