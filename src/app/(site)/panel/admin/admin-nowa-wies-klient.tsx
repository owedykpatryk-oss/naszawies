"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState, useTransition } from "react";
import { adminAktywujWiesZKatalogu, adminUtworzWiesISoltysa } from "./akcje-wies";

type WynikSzukaj = {
  id: string;
  nazwa: string;
  gmina: string;
  powiat: string;
  wojewodztwo: string;
  terytId: string;
};

export function AdminNowaWiesKlient() {
  const [blad, ustawBlad] = useState("");
  const [ok, ustawOk] = useState(false);
  const [czek, startT] = useTransition();

  const [bladKat, ustawBladKat] = useState("");
  const [okKat, ustawOkKat] = useState(false);
  const [czekKat, startKat] = useTransition();
  const [frazaKat, ustawFrazaKat] = useState("");
  const [wynikiKat, ustawWynikiKat] = useState<WynikSzukaj[]>([]);
  const [wybranaKat, ustawWybranaKat] = useState<WynikSzukaj | null>(null);

  useEffect(() => {
    const q = frazaKat.trim();
    if (q.length < 2) {
      ustawWynikiKat([]);
      return;
    }
    const t = window.setTimeout(() => {
      fetch(`/api/wies/szukaj?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((j: { wyniki?: WynikSzukaj[]; blad?: string }) => {
          if (j.blad) return;
          ustawWynikiKat(j.wyniki ?? []);
        })
        .catch(() => {});
    }, 280);
    return () => window.clearTimeout(t);
  }, [frazaKat]);

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

  function aktywujZKatalogu(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    ustawBladKat("");
    ustawOkKat(false);
    if (!wybranaKat) {
      ustawBladKat("Wybierz miejscowość z listy wyników.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    startKat(async () => {
      const w = await adminAktywujWiesZKatalogu({
        villageId: wybranaKat.id,
        emailSoltysa: String(fd.get("email_soltysa_kat") ?? "").trim(),
      });
      if ("blad" in w) {
        ustawBladKat(w.blad);
        return;
      }
      ustawOkKat(true);
      ustawWybranaKat(null);
      ustawFrazaKat("");
      (e.target as HTMLFormElement).reset();
    });
  }

  return (
    <div className="mt-10 space-y-8">
      <section className="rounded-2xl border border-emerald-200/80 bg-emerald-50/30 p-5 shadow-sm">
        <h2 className="font-serif text-xl text-green-950">Aktywuj wieś z katalogu (najczęściej)</h2>
        <p className="mt-2 text-sm text-stone-600">
          W bazie jest już tysiące miejscowości z importu TERYT — <strong>nie ma limitu 2 wsi</strong>. Wyszukaj
          nazwę, wybierz z listy i przypisz sołtysa (konto musi istnieć). Profil staje się aktywny na mapie i w
          panelu.
        </p>
        {okKat ? (
          <p className="mt-3 text-sm text-green-900" role="status">
            Aktywowano — odśwież mapę lub panel sołtysa.
          </p>
        ) : null}
        {bladKat ? (
          <p className="mt-3 text-sm text-red-800" role="alert">
            {bladKat}
          </p>
        ) : null}
        <form onSubmit={aktywujZKatalogu} className="mt-4 space-y-3 text-sm">
          <div>
            <label className="font-medium" htmlFor="adm-kat-szukaj">
              Szukaj w katalogu (min. 2 znaki)
            </label>
            <input
              id="adm-kat-szukaj"
              value={frazaKat}
              onChange={(ev) => {
                ustawFrazaKat(ev.target.value);
                ustawWybranaKat(null);
              }}
              className="mt-1 w-full max-w-lg rounded border border-stone-300 px-2 py-1.5"
              placeholder="np. Sipiory, Studzienki…"
              autoComplete="off"
            />
            {wynikiKat.length > 0 && !wybranaKat ? (
              <ul className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-stone-200 bg-white shadow-sm">
                {wynikiKat.map((w) => (
                  <li key={w.id}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left hover:bg-stone-50"
                      onClick={() => {
                        ustawWybranaKat(w);
                        ustawFrazaKat(`${w.nazwa}, ${w.gmina}`);
                      }}
                    >
                      <span className="font-medium text-green-950">{w.nazwa}</span>
                      <span className="text-stone-600">
                        {" "}
                        — {w.gmina}, {w.powiat} · {w.terytId}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {wybranaKat ? (
              <p className="mt-2 text-xs text-stone-600">
                Wybrano: <strong>{wybranaKat.nazwa}</strong> ({wybranaKat.terytId})
                <button type="button" className="ml-2 text-green-800 underline" onClick={() => ustawWybranaKat(null)}>
                  zmień
                </button>
              </p>
            ) : null}
          </div>
          <div>
            <label className="font-medium" htmlFor="adm-kat-mail">
              E-mail sołtysa (konto w serwisie)
            </label>
            <input
              id="adm-kat-mail"
              name="email_soltysa_kat"
              type="email"
              required
              className="mt-1 w-full max-w-md rounded border border-stone-300 px-2 py-1.5"
            />
          </div>
          <button
            type="submit"
            disabled={czekKat || !wybranaKat}
            className="rounded-lg bg-emerald-800 px-4 py-2 font-medium text-white hover:bg-emerald-900 disabled:opacity-60"
          >
            {czekKat ? "Aktywuję…" : "Aktywuj wieś i przypisz sołtysa"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="font-serif text-xl text-green-950">Nowa wieś spoza katalogu (rzadko)</h2>
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
      </section>
    </div>
  );
}
