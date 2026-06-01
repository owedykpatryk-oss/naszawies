"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { zapiszUstawieniaWygladuWsi } from "@/app/(site)/panel/soltys/akcje";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import {
  ETYKIETY_SEKCJI_WSI,
  KLUCZE_SEKCJI_WSI,
  MOTYWY_GRAFIKI,
  presetWygladuWsi,
  type KluczSekcjiWsi,
  type PresetWygladuWsi,
  type UstawieniaWsiPubliczne,
} from "@/lib/wies/ustawienia-wsi";
import { KodyEmbedWsiKlient } from "./kody-embed-wsi-klient";

export type WiesWizardDoEdycji = {
  id: string;
  name: string;
  voivodeship: string;
  county: string;
  commune: string;
  slug: string;
  ustawienia: UstawieniaWsiPubliczne;
};

const KROKI = ["Szablon", "Motyw", "Hero", "Moduły", "Gotowe"] as const;

export function KonfiguracjaWiesWizardKlient({ wsie }: { wsie: WiesWizardDoEdycji[] }) {
  const doKonfiguracji = wsie.filter((w) => !w.ustawienia.konfiguracja_ukonczona);
  const [ukryty, ustawUkryty] = useState(false);
  const [villageId, ustawVillageId] = useState(doKonfiguracji[0]?.id ?? wsie[0]?.id ?? "");
  const wies = wsie.find((w) => w.id === villageId) ?? wsie[0];
  const [krok, ustawKrok] = useState(0);
  const [preset, ustawPreset] = useState<PresetWygladuWsi>("standard");
  const [themeId, ustawThemeId] = useState(wies?.ustawienia.theme_id ?? "zielony-wies");
  const [logoUrl, ustawLogoUrl] = useState(wies?.ustawienia.logo_url ?? "");
  const [heroNaglowek, ustawHeroNaglowek] = useState(wies?.ustawienia.hero_naglowek ?? "");
  const [heroPodtytul, ustawHeroPodtytul] = useState(wies?.ustawienia.hero_podtytul ?? "");
  const [moduly, ustawModuly] = useState<Record<KluczSekcjiWsi, boolean>>(
    wies?.ustawienia.moduly ??
      (Object.fromEntries(KLUCZE_SEKCJI_WSI.map((k) => [k, true])) as Record<KluczSekcjiWsi, boolean>),
  );
  const [blad, ustawBlad] = useState("");
  const [czek, startT] = useTransition();

  if (!wies || doKonfiguracji.length === 0 || ukryty) return null;

  function wybierzWies(id: string) {
    const w = wsie.find((x) => x.id === id);
    if (!w) return;
    ustawVillageId(id);
    ustawThemeId(w.ustawienia.theme_id);
    ustawLogoUrl(w.ustawienia.logo_url ?? "");
    ustawHeroNaglowek(w.ustawienia.hero_naglowek ?? "");
    ustawHeroPodtytul(w.ustawienia.hero_podtytul ?? "");
    ustawModuly({ ...w.ustawienia.moduly });
    ustawKrok(0);
    ustawBlad("");
  }

  function zastosujPreset(p: PresetWygladuWsi) {
    ustawPreset(p);
    const cfg = presetWygladuWsi(p);
    ustawThemeId(cfg.theme_id);
    ustawModuly((m) => ({ ...m, ...cfg.moduly }));
  }

  function zapiszIKontynuuj(nastepny: number) {
    ustawBlad("");
    startT(async () => {
      const p = presetWygladuWsi(preset);
      const wynik = await zapiszUstawieniaWygladuWsi({
        villageId: wies.id,
        theme_id: themeId,
        logo_url: logoUrl || null,
        moduly: { ...moduly, ...p.moduly },
        kolejnosc_sekcji: wies.ustawienia.kolejnosc_sekcji,
        hero_naglowek: heroNaglowek || null,
        hero_podtytul: heroPodtytul || null,
        hero_cta: wies.ustawienia.hero_cta,
        skroty: p.skroty.length ? p.skroty : wies.ustawienia.skroty,
        bloki: wies.ustawienia.bloki,
        domyslny_tryb_seniora: wies.ustawienia.domyslny_tryb_seniora,
      });
      if ("blad" in wynik) {
        ustawBlad(wynik.blad);
        return;
      }
      ustawKrok(nastepny);
    });
  }

  function zakoncz() {
    ustawBlad("");
    startT(async () => {
      const wynik = await zapiszUstawieniaWygladuWsi({
        villageId: wies.id,
        theme_id: themeId,
        logo_url: logoUrl || null,
        moduly,
        kolejnosc_sekcji: wies.ustawienia.kolejnosc_sekcji,
        hero_naglowek: heroNaglowek || null,
        hero_podtytul: heroPodtytul || null,
        hero_cta: wies.ustawienia.hero_cta,
        skroty: wies.ustawienia.skroty,
        bloki: wies.ustawienia.bloki,
        domyslny_tryb_seniora: wies.ustawienia.domyslny_tryb_seniora,
        konfiguracja_ukonczona: true,
      });
      if ("blad" in wynik) {
        ustawBlad(wynik.blad);
        return;
      }
      ustawUkryty(true);
    });
  }

  const sciezka = sciezkaProfiluWsi(wies);
  const motyw = MOTYWY_GRAFIKI.find((m) => m.id === themeId) ?? MOTYWY_GRAFIKI[0];

  return (
    <section className="panel-karta mb-8 border-2 border-green-700/25 bg-gradient-to-br from-green-50/90 via-white to-amber-50/40">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-green-800">Pierwsza konfiguracja</p>
          <h2 className="font-serif text-xl text-green-950">Skonfiguruj stronę wsi krok po kroku</h2>
          <p className="mt-1 text-sm text-stone-600">
            Krok {krok + 1} z {KROKI.length}: <strong>{KROKI[krok]}</strong>
          </p>
        </div>
        <button type="button" className="text-xs text-stone-500 underline" onClick={() => ustawUkryty(true)}>
          Pomiń na razie
        </button>
      </div>

      {doKonfiguracji.length > 1 ? (
        <label className="mt-4 block text-sm">
          <span className="font-medium text-stone-700">Wieś</span>
          <select className="form-control mt-1 max-w-xs" value={villageId} onChange={(e) => wybierzWies(e.target.value)}>
            {doKonfiguracji.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <ol className="mt-4 flex flex-wrap gap-2" aria-label="Postęp konfiguracji">
        {KROKI.map((etykieta, i) => (
          <li
            key={etykieta}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              i === krok ? "bg-green-800 text-white" : i < krok ? "bg-green-100 text-green-900" : "bg-stone-100 text-stone-500"
            }`}
          >
            {i + 1}. {etykieta}
          </li>
        ))}
      </ol>

      <div className="mt-5">
        {krok === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-stone-700">Wybierz punkt startowy — potem możesz wszystko doprecyzować w ustawieniach wyglądu.</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {(["standard", "parafia_osp", "turystyczna", "szkola"] as PresetWygladuWsi[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => zastosujPreset(p)}
                  className={`rounded-xl border p-3 text-left text-sm transition ${
                    preset === p ? "border-green-700 ring-2 ring-green-700/30" : "border-stone-200 hover:border-green-300"
                  }`}
                >
                  {p === "standard"
                    ? "Standardowa wieś"
                    : p === "parafia_osp"
                      ? "Parafia + OSP"
                      : p === "szkola"
                        ? "Szkoła / przedszkole"
                        : "Turystyczna"}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {krok === 1 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-stone-800">Motyw kolorystyczny</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {MOTYWY_GRAFIKI.slice(0, 6).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => ustawThemeId(m.id)}
                    className={`rounded-lg border p-2 text-left text-xs ${themeId === m.id ? "border-green-700" : "border-stone-200"}`}
                    style={{ background: m.tlo }}
                  >
                    {m.nazwa}
                  </button>
                ))}
              </div>
            </div>
            <label className="block text-sm">
              <span className="font-medium text-stone-700">Logo / herb (URL, opcjonalnie)</span>
              <input type="url" className="form-control mt-1" value={logoUrl} onChange={(e) => ustawLogoUrl(e.target.value)} placeholder="https://…" />
            </label>
          </div>
        ) : null}

        {krok === 2 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-stone-700">Nagłówek (opcjonalnie)</span>
              <input type="text" className="form-control mt-1" value={heroNaglowek} onChange={(e) => ustawHeroNaglowek(e.target.value)} placeholder={wies.name} maxLength={120} />
            </label>
            <label className="col-span-full block text-sm sm:col-span-2">
              <span className="font-medium text-stone-700">Podtytuł powitalny</span>
              <input type="text" className="form-control mt-1" value={heroPodtytul} onChange={(e) => ustawHeroPodtytul(e.target.value)} placeholder="Serdecznie witamy…" maxLength={280} />
            </label>
            <div className="col-span-full rounded-xl border p-4 sm:col-span-2" style={{ background: motyw.tlo, borderColor: motyw.ramka }}>
              <p className="font-serif text-2xl" style={{ color: motyw.tekst }}>
                {heroNaglowek.trim() || wies.name}
              </p>
              {heroPodtytul ? (
                <p className="mt-1 text-sm opacity-80" style={{ color: motyw.tekst }}>
                  {heroPodtytul}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {krok === 3 ? (
          <>
          <p className="mb-3 text-xs text-stone-600">
            Włącz „Szkoła i przedszkole”, jeśli chcesz tablicę ogłoszeń i sekcję #sekcja-szkola. Ikony zakładek i pasek nawigacji ustawisz później w{" "}
            <Link href="/panel/soltys/moja-wies" className="font-medium text-green-800 underline">
              wyglądzie profilu
            </Link>
            .
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {KLUCZE_SEKCJI_WSI.map((klucz) => (
              <li key={klucz}>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm">
                  <input type="checkbox" className="accent-green-800" checked={moduly[klucz] !== false} onChange={(e) => ustawModuly((m) => ({ ...m, [klucz]: e.target.checked }))} />
                  {ETYKIETY_SEKCJI_WSI[klucz]}
                </label>
              </li>
            ))}
          </ul>
          </>
        ) : null}

        {krok === 4 ? (
          <div className="space-y-4">
            <p className="text-sm text-stone-700">
              Strona{" "}
              <Link href={sciezka} className="font-medium text-green-800 underline" target="_blank">
                {wies.name}
              </Link>{" "}
              jest gotowa. Możesz osadzić kalendarz, rynek lub tablicę szkoły na stronie gminy (iframe):
            </p>
            <KodyEmbedWsiKlient villageId={wies.id} />
          </div>
        ) : null}
      </div>

      {blad ? <p className="mt-3 text-sm text-red-700">{blad}</p> : null}

      <div className="mt-5 flex flex-wrap gap-2">
        {krok > 0 ? (
          <button type="button" className="rounded-xl border border-stone-300 px-4 py-2 text-sm" disabled={czek} onClick={() => ustawKrok((k) => k - 1)}>
            Wstecz
          </button>
        ) : null}
        {krok < KROKI.length - 1 ? (
          <button
            type="button"
            className="rounded-xl bg-green-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={czek}
            onClick={() => zapiszIKontynuuj(krok + 1)}
          >
            {czek ? "Zapisywanie…" : "Dalej"}
          </button>
        ) : (
          <button type="button" className="rounded-xl bg-green-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={czek} onClick={zakoncz}>
            {czek ? "Kończenie…" : "Zakończ konfigurację"}
          </button>
        )}
      </div>
    </section>
  );
}
