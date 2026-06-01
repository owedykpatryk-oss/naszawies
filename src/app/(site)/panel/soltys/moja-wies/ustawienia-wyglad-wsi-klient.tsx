"use client";

import Link from "next/link";
import { FormEvent, useState, useTransition } from "react";
import { zapiszUstawieniaWygladuWsi } from "../akcje";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import {
  ETYKIETY_SEKCJI_WSI,
  KLUCZE_SEKCJI_WSI,
  MOTYWY_GRAFIKI,
  type KluczSekcjiWsi,
  type UstawieniaWsiPubliczne,
} from "@/lib/wies/ustawienia-wsi";

export type WiesWygladDoEdycji = {
  id: string;
  name: string;
  voivodeship: string;
  county: string;
  commune: string;
  slug: string;
  ustawienia: UstawieniaWsiPubliczne;
};

export function UstawieniaWygladWsiKlient({ wsie }: { wsie: WiesWygladDoEdycji[] }) {
  const [villageId, ustawVillageId] = useState(wsie[0]?.id ?? "");
  const wies = wsie.find((w) => w.id === villageId) ?? wsie[0];
  const [themeId, ustawThemeId] = useState(wies?.ustawienia.theme_id ?? "zielony-wies");
  const [logoUrl, ustawLogoUrl] = useState(wies?.ustawienia.logo_url ?? "");
  const [heroPodtytul, ustawHeroPodtytul] = useState(wies?.ustawienia.hero_podtytul ?? "");
  const [moduly, ustawModuly] = useState<Record<KluczSekcjiWsi, boolean>>(
    wies?.ustawienia.moduly ?? Object.fromEntries(KLUCZE_SEKCJI_WSI.map((k) => [k, true])) as Record<KluczSekcjiWsi, boolean>,
  );
  const [kolejnosc, ustawKolejnosc] = useState<KluczSekcjiWsi[]>(
    wies?.ustawienia.kolejnosc_sekcji ?? [...KLUCZE_SEKCJI_WSI],
  );
  const [czek, startT] = useTransition();
  const [blad, ustawBlad] = useState("");
  const [ok, ustawOk] = useState(false);

  function wybierzWies(id: string) {
    const w = wsie.find((x) => x.id === id);
    if (!w) return;
    ustawVillageId(id);
    ustawThemeId(w.ustawienia.theme_id);
    ustawLogoUrl(w.ustawienia.logo_url ?? "");
    ustawHeroPodtytul(w.ustawienia.hero_podtytul ?? "");
    ustawModuly({ ...w.ustawienia.moduly });
    ustawKolejnosc([...w.ustawienia.kolejnosc_sekcji]);
    ustawBlad("");
    ustawOk(false);
  }

  function przesun(klucz: KluczSekcjiWsi, kierunek: -1 | 1) {
    ustawKolejnosc((prev) => {
      const idx = prev.indexOf(klucz);
      if (idx < 0) return prev;
      const next = idx + kierunek;
      if (next < 0 || next >= prev.length) return prev;
      const kopia = [...prev];
      [kopia[idx], kopia[next]] = [kopia[next], kopia[idx]];
      return kopia;
    });
  }

  function wyslij(e: FormEvent) {
    e.preventDefault();
    if (!wies) return;
    ustawBlad("");
    ustawOk(false);
    startT(async () => {
      const wynik = await zapiszUstawieniaWygladuWsi({
        villageId: wies.id,
        theme_id: themeId,
        logo_url: logoUrl || null,
        moduly,
        kolejnosc_sekcji: kolejnosc,
        hero_podtytul: heroPodtytul || null,
      });
      if ("blad" in wynik) {
        ustawBlad(wynik.blad);
        return;
      }
      ustawOk(true);
    });
  }

  if (!wies) return null;

  const sciezka = sciezkaProfiluWsi(wies);
  const motywAktywny = MOTYWY_GRAFIKI.find((m) => m.id === themeId) ?? MOTYWY_GRAFIKI[0];

  return (
    <section className="panel-karta mt-8">
      <h2 className="font-serif text-xl text-green-950">Wygląd i układ strony wsi</h2>
      <p className="mt-2 text-sm text-stone-600">
        Motyw kolorystyczny, logo, widoczność modułów i kolejność zakładek na{" "}
        <Link href={sciezka} className="font-medium text-green-800 underline">
          publicznym profilu
        </Link>
        .
      </p>

      {wsie.length > 1 ? (
        <label className="mt-4 block text-sm">
          <span className="font-medium text-stone-700">Wieś</span>
          <select
            className="form-control mt-1"
            value={villageId}
            onChange={(e) => wybierzWies(e.target.value)}
          >
            {wsie.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <form onSubmit={wyslij} className="mt-5 space-y-6">
        <div>
          <p className="text-sm font-medium text-stone-800">Motyw kolorystyczny</p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {MOTYWY_GRAFIKI.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => ustawThemeId(m.id)}
                className={`rounded-xl border p-2 text-left text-xs transition ${
                  themeId === m.id ? "border-green-700 ring-2 ring-green-700/30" : "border-stone-200 hover:border-green-300"
                }`}
                style={{ background: m.tlo }}
              >
                <span className="block font-semibold" style={{ color: m.tekst }}>
                  {m.nazwa}
                </span>
                <span className="mt-1 inline-block h-3 w-full rounded" style={{ background: m.akcent }} aria-hidden />
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-stone-700">Logo / herb (URL)</span>
            <input
              type="url"
              className="form-control mt-1"
              value={logoUrl}
              onChange={(e) => ustawLogoUrl(e.target.value)}
              placeholder="https://…"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-stone-700">Podtytuł pod nazwą wsi</span>
            <input
              type="text"
              className="form-control mt-1"
              value={heroPodtytul}
              onChange={(e) => ustawHeroPodtytul(e.target.value)}
              maxLength={280}
              placeholder="np. Serdecznie witamy na stronie naszej miejscowości"
            />
          </label>
        </div>

        <div>
          <p className="text-sm font-medium text-stone-800">Moduły na profilu</p>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {KLUCZE_SEKCJI_WSI.map((klucz) => (
              <li key={klucz}>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-stone-200 bg-stone-50/80 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    className="accent-green-800"
                    checked={moduly[klucz] !== false}
                    onChange={(e) => ustawModuly((m) => ({ ...m, [klucz]: e.target.checked }))}
                  />
                  {ETYKIETY_SEKCJI_WSI[klucz]}
                </label>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-medium text-stone-800">Kolejność zakładek</p>
          <ol className="mt-2 space-y-1">
            {kolejnosc.map((klucz, i) => (
              <li
                key={klucz}
                className="flex items-center justify-between gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
              >
                <span>
                  {i + 1}. {ETYKIETY_SEKCJI_WSI[klucz]}
                </span>
                <span className="flex gap-1">
                  <button
                    type="button"
                    className="rounded border border-stone-300 px-2 py-0.5 text-xs disabled:opacity-40"
                    disabled={i === 0}
                    onClick={() => przesun(klucz, -1)}
                    aria-label={`Wyżej: ${ETYKIETY_SEKCJI_WSI[klucz]}`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="rounded border border-stone-300 px-2 py-0.5 text-xs disabled:opacity-40"
                    disabled={i === kolejnosc.length - 1}
                    onClick={() => przesun(klucz, 1)}
                    aria-label={`Niżej: ${ETYKIETY_SEKCJI_WSI[klucz]}`}
                  >
                    ↓
                  </button>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div
          className="rounded-xl border p-4"
          style={{
            background: motywAktywny.tlo,
            borderColor: motywAktywny.ramka,
            color: motywAktywny.tekst,
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Podgląd motywu</p>
          <p className="mt-2 font-serif text-2xl">{wies.name}</p>
          {heroPodtytul ? <p className="mt-1 text-sm opacity-80">{heroPodtytul}</p> : null}
          <span
            className="mt-3 inline-block rounded-lg px-3 py-1.5 text-sm font-medium text-white"
            style={{ background: motywAktywny.akcent }}
          >
            Przykładowy przycisk
          </span>
        </div>

        {blad ? <p className="text-sm text-red-700">{blad}</p> : null}
        {ok ? <p className="text-sm text-green-800">Zapisano ustawienia wyglądu.</p> : null}

        <button
          type="submit"
          disabled={czek}
          className="rounded-xl bg-green-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-900 disabled:opacity-60"
        >
          {czek ? "Zapisywanie…" : "Zapisz wygląd i układ"}
        </button>
      </form>
    </section>
  );
}
