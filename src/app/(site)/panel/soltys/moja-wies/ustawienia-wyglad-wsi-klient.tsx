"use client";

import Link from "next/link";
import { FormEvent, useState, useTransition } from "react";
import { zapiszUstawieniaWygladuWsi } from "../akcje";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { KodyEmbedWsiKlient } from "@/components/wies/kody-embed-wsi-klient";
import {
  ETYKIETY_SEKCJI_WSI,
  KLUCZE_SEKCJI_WSI,
  MOTYWY_GRAFIKI,
  presetWygladuWsi,
  type BlokTresciWsiPubliczny,
  type HeroCtaWsi,
  type KluczSekcjiWsi,
  type PresetWygladuWsi,
  type SkrotWsiPubliczny,
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

function nowyBlok(): BlokTresciWsiPubliczny {
  return {
    id: `blok-${Date.now()}`,
    typ: "tekst",
    tytul: "",
    tresc: "",
    url: null,
    obraz_url: null,
  };
}

function wczytajStan(w: WiesWygladDoEdycji) {
  return {
    themeId: w.ustawienia.theme_id,
    logoUrl: w.ustawienia.logo_url ?? "",
    heroNaglowek: w.ustawienia.hero_naglowek ?? "",
    heroPodtytul: w.ustawienia.hero_podtytul ?? "",
    heroCta: [...w.ustawienia.hero_cta],
    skroty: [...w.ustawienia.skroty],
    bloki: [...w.ustawienia.bloki],
    moduly: { ...w.ustawienia.moduly },
    kolejnosc: [...w.ustawienia.kolejnosc_sekcji],
    domyslnyTrybSeniora: w.ustawienia.domyslny_tryb_seniora,
  };
}

export function UstawieniaWygladWsiKlient({ wsie }: { wsie: WiesWygladDoEdycji[] }) {
  const [villageId, ustawVillageId] = useState(wsie[0]?.id ?? "");
  const wies = wsie.find((w) => w.id === villageId) ?? wsie[0];
  const pocz = wies ? wczytajStan(wies) : null;

  const [themeId, ustawThemeId] = useState(pocz?.themeId ?? "zielony-wies");
  const [logoUrl, ustawLogoUrl] = useState(pocz?.logoUrl ?? "");
  const [heroNaglowek, ustawHeroNaglowek] = useState(pocz?.heroNaglowek ?? "");
  const [heroPodtytul, ustawHeroPodtytul] = useState(pocz?.heroPodtytul ?? "");
  const [heroCta, ustawHeroCta] = useState<HeroCtaWsi[]>(pocz?.heroCta ?? []);
  const [skroty, ustawSkroty] = useState<SkrotWsiPubliczny[]>(pocz?.skroty ?? []);
  const [bloki, ustawBloki] = useState<BlokTresciWsiPubliczny[]>(pocz?.bloki ?? []);
  const [moduly, ustawModuly] = useState<Record<KluczSekcjiWsi, boolean>>(
    pocz?.moduly ??
      (Object.fromEntries(KLUCZE_SEKCJI_WSI.map((k) => [k, true])) as Record<KluczSekcjiWsi, boolean>),
  );
  const [kolejnosc, ustawKolejnosc] = useState<KluczSekcjiWsi[]>(pocz?.kolejnosc ?? [...KLUCZE_SEKCJI_WSI]);
  const [domyslnyTrybSeniora, ustawDomyslnyTrybSeniora] = useState(pocz?.domyslnyTrybSeniora ?? false);
  const [czek, startT] = useTransition();
  const [blad, ustawBlad] = useState("");
  const [ok, ustawOk] = useState(false);

  function wybierzWies(id: string) {
    const w = wsie.find((x) => x.id === id);
    if (!w) return;
    const s = wczytajStan(w);
    ustawVillageId(id);
    ustawThemeId(s.themeId);
    ustawLogoUrl(s.logoUrl);
    ustawHeroNaglowek(s.heroNaglowek);
    ustawHeroPodtytul(s.heroPodtytul);
    ustawHeroCta(s.heroCta);
    ustawSkroty(s.skroty);
    ustawBloki(s.bloki);
    ustawModuly(s.moduly);
    ustawKolejnosc(s.kolejnosc);
    ustawDomyslnyTrybSeniora(s.domyslnyTrybSeniora);
    ustawBlad("");
    ustawOk(false);
  }

  function zastosujPreset(preset: PresetWygladuWsi) {
    const p = presetWygladuWsi(preset);
    ustawThemeId(p.theme_id);
    ustawModuly((m) => ({ ...m, ...p.moduly }));
    ustawSkroty(p.skroty);
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
        hero_naglowek: heroNaglowek || null,
        hero_podtytul: heroPodtytul || null,
        hero_cta: heroCta.filter((c) => c.label.trim() && c.href.trim()),
        skroty: skroty.filter((s) => s.label.trim() && s.href.trim()),
        bloki: bloki.filter((b) => b.id.trim()),
        domyslny_tryb_seniora: domyslnyTrybSeniora,
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
  const tytulPodglad = heroNaglowek.trim() || wies.name;

  return (
    <section className="panel-karta mt-8">
      <h2 className="font-serif text-xl text-green-950">Wygląd i układ strony wsi</h2>
      <p className="mt-2 text-sm text-stone-600">
        Motyw, hero, skróty, własne bloki i moduły na{" "}
        <Link href={sciezka} className="font-medium text-green-800 underline">
          publicznym profilu
        </Link>
        . Po zapisie można dodać stronę wsi na ekran główny telefonu (manifest PWA).
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium hover:bg-stone-50" onClick={() => zastosujPreset("standard")}>
          Szablon: standardowa wieś
        </button>
        <button type="button" className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium hover:bg-stone-50" onClick={() => zastosujPreset("parafia_osp")}>
          Szablon: parafia + OSP
        </button>
        <button type="button" className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium hover:bg-stone-50" onClick={() => zastosujPreset("turystyczna")}>
          Szablon: turystyczna
        </button>
      </div>

      {wsie.length > 1 ? (
        <label className="mt-4 block text-sm">
          <span className="font-medium text-stone-700">Wieś</span>
          <select className="form-control mt-1" value={villageId} onChange={(e) => wybierzWies(e.target.value)}>
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
            <input type="url" className="form-control mt-1" value={logoUrl} onChange={(e) => ustawLogoUrl(e.target.value)} placeholder="https://…" />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-stone-700">Nagłówek (zamiast nazwy wsi)</span>
            <input type="text" className="form-control mt-1" value={heroNaglowek} onChange={(e) => ustawHeroNaglowek(e.target.value)} maxLength={120} placeholder={wies.name} />
          </label>
          <label className="col-span-full block text-sm sm:col-span-2">
            <span className="font-medium text-stone-700">Podtytuł</span>
            <input type="text" className="form-control mt-1" value={heroPodtytul} onChange={(e) => ustawHeroPodtytul(e.target.value)} maxLength={280} placeholder="np. Serdecznie witamy…" />
          </label>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-stone-800">Przyciski pod nagłówkiem (max 3)</p>
            {heroCta.length < 3 ? (
              <button
                type="button"
                className="text-xs font-medium text-green-800 underline"
                onClick={() => ustawHeroCta((c) => [...c, { label: "", href: "", wariant: "primary" }])}
              >
                + Dodaj przycisk
              </button>
            ) : null}
          </div>
          <ul className="mt-2 space-y-2">
            {heroCta.map((c, i) => (
              <li key={i} className="grid gap-2 rounded-lg border border-stone-200 p-3 sm:grid-cols-[1fr_1fr_auto_auto]">
                <input className="form-control" placeholder="Etykieta" value={c.label} onChange={(e) => ustawHeroCta((arr) => arr.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                <input className="form-control" placeholder="Link (#sekcja-mapa lub /rejestracja)" value={c.href} onChange={(e) => ustawHeroCta((arr) => arr.map((x, j) => (j === i ? { ...x, href: e.target.value } : x)))} />
                <select className="form-control" value={c.wariant} onChange={(e) => ustawHeroCta((arr) => arr.map((x, j) => (j === i ? { ...x, wariant: e.target.value as HeroCtaWsi["wariant"] } : x)))}>
                  <option value="primary">Główny</option>
                  <option value="secondary">Drugorzędny</option>
                </select>
                <button type="button" className="text-xs text-red-700 underline" onClick={() => ustawHeroCta((arr) => arr.filter((_, j) => j !== i))}>
                  Usuń
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-stone-800">Skróty (kafelki, max 6)</p>
            {skroty.length < 6 ? (
              <button type="button" className="text-xs font-medium text-green-800 underline" onClick={() => ustawSkroty((s) => [...s, { label: "", href: "", emoji: null, opis: null }])}>
                + Dodaj skrót
              </button>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-stone-500">Puste = automatyczne skróty (rynek, mapa, świetlica…).</p>
          <ul className="mt-2 space-y-2">
            {skroty.map((s, i) => (
              <li key={i} className="grid gap-2 rounded-lg border border-stone-200 p-3 sm:grid-cols-2">
                <input className="form-control" placeholder="Nazwa" value={s.label} onChange={(e) => ustawSkroty((arr) => arr.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                <input className="form-control" placeholder="Link" value={s.href} onChange={(e) => ustawSkroty((arr) => arr.map((x, j) => (j === i ? { ...x, href: e.target.value } : x)))} />
                <input className="form-control" placeholder="Emoji (opcj.)" value={s.emoji ?? ""} onChange={(e) => ustawSkroty((arr) => arr.map((x, j) => (j === i ? { ...x, emoji: e.target.value || null } : x)))} />
                <input className="form-control" placeholder="Opis (opcj.)" value={s.opis ?? ""} onChange={(e) => ustawSkroty((arr) => arr.map((x, j) => (j === i ? { ...x, opis: e.target.value || null } : x)))} />
                <button type="button" className="text-left text-xs text-red-700 underline sm:col-span-2" onClick={() => ustawSkroty((arr) => arr.filter((_, j) => j !== i))}>
                  Usuń skrót
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-stone-800">Własne bloki treści</p>
            {bloki.length < 8 ? (
              <button type="button" className="text-xs font-medium text-green-800 underline" onClick={() => ustawBloki((b) => [...b, nowyBlok()])}>
                + Dodaj blok
              </button>
            ) : null}
          </div>
          <ul className="mt-2 space-y-3">
            {bloki.map((b, i) => (
              <li key={b.id} className="rounded-lg border border-stone-200 p-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <select className="form-control" value={b.typ} onChange={(e) => ustawBloki((arr) => arr.map((x, j) => (j === i ? { ...x, typ: e.target.value as BlokTresciWsiPubliczny["typ"] } : x)))}>
                    <option value="tekst">Tekst</option>
                    <option value="link">Link / przycisk</option>
                    <option value="obraz">Obraz</option>
                  </select>
                  <input className="form-control" placeholder="Tytuł" value={b.tytul ?? ""} onChange={(e) => ustawBloki((arr) => arr.map((x, j) => (j === i ? { ...x, tytul: e.target.value || null } : x)))} />
                  {b.typ !== "obraz" ? (
                    <textarea className="form-control form-control--textarea sm:col-span-2" rows={3} placeholder="Treść" value={b.tresc ?? ""} onChange={(e) => ustawBloki((arr) => arr.map((x, j) => (j === i ? { ...x, tresc: e.target.value || null } : x)))} />
                  ) : null}
                  {b.typ === "link" ? (
                    <input className="form-control sm:col-span-2" placeholder="Adres URL" value={b.url ?? ""} onChange={(e) => ustawBloki((arr) => arr.map((x, j) => (j === i ? { ...x, url: e.target.value || null } : x)))} />
                  ) : null}
                  {b.typ === "obraz" ? (
                    <input className="form-control sm:col-span-2" placeholder="URL obrazu" value={b.obraz_url ?? ""} onChange={(e) => ustawBloki((arr) => arr.map((x, j) => (j === i ? { ...x, obraz_url: e.target.value || null } : x)))} />
                  ) : null}
                </div>
                <button type="button" className="mt-2 text-xs text-red-700 underline" onClick={() => ustawBloki((arr) => arr.filter((_, j) => j !== i))}>
                  Usuń blok
                </button>
              </li>
            ))}
          </ul>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" className="accent-green-800" checked={domyslnyTrybSeniora} onChange={(e) => ustawDomyslnyTrybSeniora(e.target.checked)} />
          Domyślnie włącz tryb uproszczony (większy tekst) dla nowych odwiedzających
        </label>

        <div>
          <p className="text-sm font-medium text-stone-800">Moduły na profilu</p>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {KLUCZE_SEKCJI_WSI.map((klucz) => (
              <li key={klucz}>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-stone-200 bg-stone-50/80 px-3 py-2 text-sm">
                  <input type="checkbox" className="accent-green-800" checked={moduly[klucz] !== false} onChange={(e) => ustawModuly((m) => ({ ...m, [klucz]: e.target.checked }))} />
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
              <li key={klucz} className="flex items-center justify-between gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm">
                <span>
                  {i + 1}. {ETYKIETY_SEKCJI_WSI[klucz]}
                </span>
                <span className="flex gap-1">
                  <button type="button" className="rounded border border-stone-300 px-2 py-0.5 text-xs disabled:opacity-40" disabled={i === 0} onClick={() => przesun(klucz, -1)} aria-label={`Wyżej: ${ETYKIETY_SEKCJI_WSI[klucz]}`}>
                    ↑
                  </button>
                  <button type="button" className="rounded border border-stone-300 px-2 py-0.5 text-xs disabled:opacity-40" disabled={i === kolejnosc.length - 1} onClick={() => przesun(klucz, 1)} aria-label={`Niżej: ${ETYKIETY_SEKCJI_WSI[klucz]}`}>
                    ↓
                  </button>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-xl border p-4" style={{ background: motywAktywny.tlo, borderColor: motywAktywny.ramka, color: motywAktywny.tekst }}>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Podgląd</p>
          <p className="mt-2 font-serif text-2xl">{tytulPodglad}</p>
          {heroPodtytul ? <p className="mt-1 text-sm opacity-80">{heroPodtytul}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {(heroCta.length ? heroCta : [{ label: "Przykład", href: "#", wariant: "primary" as const }]).map((c, i) => (
              <span
                key={i}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${c.wariant === "secondary" ? "border bg-white/80" : "text-white"}`}
                style={c.wariant === "secondary" ? { borderColor: motywAktywny.ramka, color: motywAktywny.tekst } : { background: motywAktywny.akcent }}
              >
                {c.label || "Przycisk"}
              </span>
            ))}
          </div>
        </div>

        {blad ? <p className="text-sm text-red-700">{blad}</p> : null}
        {ok ? <p className="text-sm text-green-800">Zapisano ustawienia wyglądu.</p> : null}

        <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-4">
          <p className="text-sm font-medium text-stone-800">Widgety na stronie gminy (iframe)</p>
          <p className="mt-1 text-xs text-stone-600">Osadź kalendarz świetlicy lub rynek lokalny na BIP lub stronie urzędu.</p>
          <div className="mt-3">
            <KodyEmbedWsiKlient villageId={wies.id} />
          </div>
        </div>

        <button type="submit" disabled={czek} className="rounded-xl bg-green-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-900 disabled:opacity-60">
          {czek ? "Zapisywanie…" : "Zapisz wygląd i układ"}
        </button>
      </form>
    </section>
  );
}
