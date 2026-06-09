"use client";

import Link from "next/link";
import { FormEvent, useState, useTransition } from "react";
import { zapiszUstawieniaWygladuWsi } from "../akcje";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { KodyEmbedWsiKlient } from "@/components/wies/kody-embed-wsi-klient";
import { PodgladWygladWsiKlient } from "@/components/wies/podglad-wyglad-wsi-klient";
import { WgrajObrazWiesKlient } from "@/components/wies/wgraj-obraz-wies-klient";
import { ListaPrzeciagnij } from "@/components/ui/lista-przeciagnij";
import { EdytorTresciProstej } from "@/components/ui/edytor-tresci-prostej";
import {
  DOMYSLNE_IKONY_SEKCJI_WSI,
  ikonaSekcjiWsi,
  PALETA_IKON_ZAKLADEK,
} from "@/lib/wies/ikony-sekcji-wsi";
import {
  domyslnyPasekNawigacjiWsi,
  ETYKIETY_SEKCJI_WSI,
  KLUCZE_SEKCJI_WSI,
  MOTYWY_GRAFIKI,
  presetWygladuWsi,
  type BlokTresciWsiPubliczny,
  type HeroCtaWsi,
  type KluczSekcjiWsi,
  type PasekNawigacjiWsi,
  type PresetWygladuWsi,
  type SkrotWsiPubliczny,
  type UstawieniaWsiPubliczne,
  type ZakladkaSekcjiWsiConfig,
} from "@/lib/wies/ustawienia-wsi";

export type WiesWygladDoEdycji = {
  id: string;
  name: string;
  voivodeship: string;
  county: string;
  commune: string;
  slug: string;
  cover_image_url: string | null;
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
    coverUrl: w.cover_image_url ?? "",
    heroNaglowek: w.ustawienia.hero_naglowek ?? "",
    heroPodtytul: w.ustawienia.hero_podtytul ?? "",
    heroCta: [...w.ustawienia.hero_cta],
    skroty: [...w.ustawienia.skroty],
    bloki: [...w.ustawienia.bloki],
    moduly: { ...w.ustawienia.moduly },
    kolejnosc: [...w.ustawienia.kolejnosc_sekcji],
    zakladki: { ...w.ustawienia.zakladki },
    pasek: { ...w.ustawienia.pasek_nawigacji },
    domyslnyTrybSeniora: w.ustawienia.domyslny_tryb_seniora,
    ciekawostkiWsi: w.ustawienia.ciekawostki_wsi ?? "",
  };
}

export function UstawieniaWygladWsiKlient({ wsie }: { wsie: WiesWygladDoEdycji[] }) {
  const [villageId, ustawVillageId] = useState(wsie[0]?.id ?? "");
  const wies = wsie.find((w) => w.id === villageId) ?? wsie[0];
  const pocz = wies ? wczytajStan(wies) : null;

  const [themeId, ustawThemeId] = useState(pocz?.themeId ?? "zielony-wies");
  const [logoUrl, ustawLogoUrl] = useState(pocz?.logoUrl ?? "");
  const [coverUrl, ustawCoverUrl] = useState(pocz?.coverUrl ?? "");
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
  const [zakladkiCfg, ustawZakladkiCfg] = useState<Partial<Record<KluczSekcjiWsi, ZakladkaSekcjiWsiConfig>>>(
    pocz?.zakladki ?? {},
  );
  const [pasek, ustawPasek] = useState<PasekNawigacjiWsi>(pocz?.pasek ?? domyslnyPasekNawigacjiWsi());
  const [domyslnyTrybSeniora, ustawDomyslnyTrybSeniora] = useState(pocz?.domyslnyTrybSeniora ?? false);
  const [ciekawostkiWsi, ustawCiekawostkiWsi] = useState(pocz?.ciekawostkiWsi ?? "");
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
    ustawCoverUrl(s.coverUrl);
    ustawHeroNaglowek(s.heroNaglowek);
    ustawHeroPodtytul(s.heroPodtytul);
    ustawHeroCta(s.heroCta);
    ustawSkroty(s.skroty);
    ustawBloki(s.bloki);
    ustawModuly(s.moduly);
    ustawKolejnosc(s.kolejnosc);
    ustawZakladkiCfg(s.zakladki);
    ustawPasek(s.pasek);
    ustawDomyslnyTrybSeniora(s.domyslnyTrybSeniora);
    ustawCiekawostkiWsi(s.ciekawostkiWsi);
    ustawBlad("");
    ustawOk(false);
  }

  function zastosujPreset(preset: PresetWygladuWsi) {
    const p = presetWygladuWsi(preset);
    ustawThemeId(p.theme_id);
    ustawModuly((m) => ({ ...m, ...p.moduly }));
    ustawSkroty(p.skroty);
  }

  function ustawIkoneZakladki(klucz: KluczSekcjiWsi, emoji: string) {
    ustawZakladkiCfg((z) => ({
      ...z,
      [klucz]: { label: z[klucz]?.label ?? null, emoji: emoji || null },
    }));
  }

  function ustawEtykieteZakladki(klucz: KluczSekcjiWsi, label: string) {
    ustawZakladkiCfg((z) => ({
      ...z,
      [klucz]: { emoji: z[klucz]?.emoji ?? null, label: label.trim() || null },
    }));
  }

  function wyslij(e: FormEvent) {
    e.preventDefault();
    if (!wies) return;
    ustawBlad("");
    ustawOk(false);
    startT(async () => {
      const zakladkiDoZapisu: Record<string, { emoji: string | null; label: string | null }> = {};
      for (const k of KLUCZE_SEKCJI_WSI) {
        const c = zakladkiCfg[k];
        if (!c?.emoji && !c?.label) continue;
        zakladkiDoZapisu[k] = { emoji: c.emoji ?? null, label: c.label ?? null };
      }

      const wynik = await zapiszUstawieniaWygladuWsi({
        villageId: wies.id,
        theme_id: themeId,
        logo_url: logoUrl || null,
        cover_image_url: coverUrl || null,
        moduly,
        kolejnosc_sekcji: kolejnosc,
        hero_naglowek: heroNaglowek || null,
        hero_podtytul: heroPodtytul || null,
        hero_cta: heroCta.filter((c) => c.label.trim() && c.href.trim()),
        skroty: skroty.filter((s) => s.label.trim() && s.href.trim()),
        bloki: bloki.filter((b) => b.id.trim()),
        domyslny_tryb_seniora: domyslnyTrybSeniora,
        ciekawostki_wsi: ciekawostkiWsi.trim() || null,
        zakladki: Object.keys(zakladkiDoZapisu).length ? zakladkiDoZapisu : undefined,
        pasek_nawigacji: pasek,
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
        <button type="button" className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium hover:bg-stone-50" onClick={() => zastosujPreset("szkola")}>
          Szablon: szkoła / tablica
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
          <div className="sm:col-span-2">
            <WgrajObrazWiesKlient
              villageId={wies.id}
              etykieta="Logo / herb — wgraj plik"
              aktualnyUrl={logoUrl}
              onUrl={ustawLogoUrl}
            />
            <label className="mt-2 block text-sm">
              <span className="font-medium text-stone-700">lub adres URL logo</span>
              <input type="url" className="form-control mt-1" value={logoUrl} onChange={(e) => ustawLogoUrl(e.target.value)} placeholder="https://…" />
            </label>
          </div>
          <div className="sm:col-span-2">
            <WgrajObrazWiesKlient
              villageId={wies.id}
              etykieta="Okładka profilu — wgraj zdjęcie"
              aktualnyUrl={coverUrl}
              onUrl={ustawCoverUrl}
            />
            <label className="mt-2 block text-sm">
              <span className="font-medium text-stone-700">lub adres URL okładki</span>
              <input type="url" className="form-control mt-1" value={coverUrl} onChange={(e) => ustawCoverUrl(e.target.value)} placeholder="https://… szerokie zdjęcie wsi" />
            </label>
          </div>
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
              <li key={i} className="grid gap-2 rounded-lg border border-stone-200 p-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto]">
                <input className="form-control" placeholder="Etykieta" value={c.label} onChange={(e) => ustawHeroCta((arr) => arr.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                <input className="form-control" placeholder="Link (#sekcja-mapa lub /rejestracja)" value={c.href} onChange={(e) => ustawHeroCta((arr) => arr.map((x, j) => (j === i ? { ...x, href: e.target.value } : x)))} />
                <select className="form-control" value={c.wariant} onChange={(e) => ustawHeroCta((arr) => arr.map((x, j) => (j === i ? { ...x, wariant: e.target.value as HeroCtaWsi["wariant"] } : x)))}>
                  <option value="primary">Główny</option>
                  <option value="secondary">Drugorzędny</option>
                </select>
                <button
                  type="button"
                  className="min-h-[44px] text-left text-xs text-red-700 underline sm:min-h-0 sm:col-span-2 lg:col-span-1"
                  onClick={() => ustawHeroCta((arr) => arr.filter((_, j) => j !== i))}
                >
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
          <label className="text-sm font-medium text-stone-800" htmlFor="ciekawostki-wsi">
            Ciekawostki o wsi (profil publiczny)
          </label>
          <p className="mt-1 text-xs text-stone-500">
            Legendy, daty powstania, ciekawe fakty — sekcja „Ciekawostki” na stronie wsi. Możesz użyć **pogrubienia**, linków i list.
          </p>
          <EdytorTresciProstej
            id="ciekawostki-wsi"
            value={ciekawostkiWsi}
            onChange={ustawCiekawostkiWsi}
            rows={6}
            maxLength={6000}
            placeholder="np. Wieś powstała w XIV w. · **Kościół z 1782 r.** · Tutaj odbywały się pierwsze dożynki powiatu…"
          />
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

        <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-4">
          <p className="text-sm font-medium text-stone-800">Pasek nawigacji (top bar profilu)</p>
          <p className="mt-1 text-xs text-stone-500">Wybierz, co mieszkańcy widzą pod nagłówkiem wsi.</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            <li>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" className="accent-green-800" checked={pasek.sticky_zakladki} onChange={(e) => ustawPasek((p) => ({ ...p, sticky_zakladki: e.target.checked }))} />
                Przyklejone zakładki przy scrollu
              </label>
            </li>
            <li>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" className="accent-green-800" checked={pasek.pokaz_skroty} onChange={(e) => ustawPasek((p) => ({ ...p, pokaz_skroty: e.target.checked }))} />
                Kafelki skrótów
              </label>
            </li>
            <li>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" className="accent-green-800" checked={pasek.pokaz_hero_cta} onChange={(e) => ustawPasek((p) => ({ ...p, pokaz_hero_cta: e.target.checked }))} />
                Przyciski pod nagłówkiem
              </label>
            </li>
            <li>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" className="accent-green-800" checked={pasek.pokaz_breadcrumb} onChange={(e) => ustawPasek((p) => ({ ...p, pokaz_breadcrumb: e.target.checked }))} />
                Ścieżka woj. · powiat · gmina
              </label>
            </li>
          </ul>
          <label className="mt-3 block text-sm">
            <span className="font-medium text-stone-700">Maks. zakładek w rzędzie (0 = wszystkie)</span>
            <input
              type="number"
              min={0}
              max={12}
              className="form-control mt-1 max-w-[8rem]"
              value={pasek.max_zakladek_widocznych}
              onChange={(e) =>
                ustawPasek((p) => ({
                  ...p,
                  max_zakladek_widocznych: Math.max(0, Math.min(12, Number(e.target.value) || 0)),
                }))
              }
            />
            <span className="mt-1 block text-xs text-stone-500">Reszta w menu „Więcej”.</span>
          </label>
        </div>

        <div>
          <p className="text-sm font-medium text-stone-800">Zakładki — kolejność, ikony i nazwy</p>
          <p className="mt-1 text-xs text-stone-500">Przeciągnij wiersz, aby zmienić kolejność. Ikony i krótkie nazwy widać na profilu publicznym.</p>
          <div className="mt-2">
            <ListaPrzeciagnij
              elementy={kolejnosc}
              onChange={ustawKolejnosc}
              renderWiersz={(klucz) => {
                const wlaczony = moduly[klucz] !== false;
                const cfg = zakladkiCfg[klucz];
                const ikona = ikonaSekcjiWsi(klucz, cfg?.emoji);
                return (
                  <div className={`flex flex-1 flex-wrap items-center gap-2 ${!wlaczony ? "opacity-50" : ""}`}>
                    <span className="text-lg" aria-hidden>
                      {ikona}
                    </span>
                    <span className="min-w-[6rem] font-medium text-stone-800">{ETYKIETY_SEKCJI_WSI[klucz]}</span>
                    <input
                      className="form-control max-w-[7rem] py-1 text-xs"
                      placeholder="Krótka nazwa"
                      value={cfg?.label ?? ""}
                      maxLength={24}
                      disabled={!wlaczony}
                      onChange={(e) => ustawEtykieteZakladki(klucz, e.target.value)}
                    />
                    <select
                      className="form-control max-w-[5rem] py-1 text-xs"
                      value={cfg?.emoji ?? DOMYSLNE_IKONY_SEKCJI_WSI[klucz]}
                      disabled={!wlaczony}
                      onChange={(e) => ustawIkoneZakladki(klucz, e.target.value)}
                      aria-label={`Ikona: ${ETYKIETY_SEKCJI_WSI[klucz]}`}
                    >
                      {PALETA_IKON_ZAKLADEK.map((em) => (
                        <option key={em} value={em}>
                          {em}
                        </option>
                      ))}
                    </select>
                    {!wlaczony ? <span className="text-[10px] text-stone-500">wyłączony moduł</span> : null}
                  </div>
                );
              }}
            />
          </div>
        </div>

        <PodgladWygladWsiKlient
          wies={wies}
          themeId={themeId}
          logoUrl={logoUrl}
          coverUrl={coverUrl}
          heroNaglowek={heroNaglowek}
          heroPodtytul={heroPodtytul}
        />

        <div className="rounded-xl border p-4" style={{ background: motywAktywny.tlo, borderColor: motywAktywny.ramka, color: motywAktywny.tekst }}>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Podgląd hero (lokalny)</p>
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
