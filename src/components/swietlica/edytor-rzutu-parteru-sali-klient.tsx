"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import {
  noweIdArch,
  nowePomieszczenie,
  presetJednaDuzaSala,
  presetRzutuSwietlicaLStudzienki,
  presetSalaPlusZaplecze,
  snapDoSiatki,
  type ElementArchRzutu,
  type PomieszczenieRzutuParteru,
  type RzutParteruSaliJson,
  type TypElementuArch,
} from "@/lib/swietlica/rzut-parteru-sali";
import { zapiszRzutParteruSali } from "@/app/(site)/panel/soltys/akcje";
import { wgrajObrazDoMagazynuR2 } from "@/lib/storage/wgraj-obraz-r2";
import { RzutParteruSaliSvg } from "./rzut-parteru-sali-svg";

type SzablonId = "l_studzienki" | "jedna_sala" | "sala_zaplecze";
type TrybEdycji = "przeglad" | "sciana" | "znacznik" | "pomieszczenie";

const SZABLONY: { id: SzablonId; label: string; krotko: string }[] = [
  { id: "l_studzienki", label: "Świetlica L (Studzienki)", krotko: "Wiatrołap, WC, kuchnia, sala L + wejścia/okna" },
  { id: "jedna_sala", label: "Jedna duża sala", krotko: "Prosty prostokąt" },
  { id: "sala_zaplecze", label: "Sala + zaplecze", krotko: "Dwa prostokąty" },
];

const ZNACZNIKI: { typ: TypElementuArch; label: string }[] = [
  { typ: "wejscie", label: "Wejście" },
  { typ: "drzwi_wew", label: "Drzwi wewn." },
  { typ: "okno", label: "Okno" },
  { typ: "rampa", label: "Rampa" },
  { typ: "drzwi", label: "Drzwi" },
];

function zSzablonu(id: SzablonId): RzutParteruSaliJson {
  if (id === "l_studzienki") return presetRzutuSwietlicaLStudzienki();
  if (id === "sala_zaplecze") return presetSalaPlusZaplecze();
  return presetJednaDuzaSala();
}

function mapKluczDoWyboru(k: string): SzablonId {
  if (k === "swietlica_l_studzienki") return "l_studzienki";
  if (k === "sala_zaplecze") return "sala_zaplecze";
  if (k === "jedna_sala") return "jedna_sala";
  return "l_studzienki";
}

function clampWymiarM(n: number): number {
  if (!Number.isFinite(n)) return 10;
  return Math.min(200, Math.max(1, Math.round(n * 10) / 10));
}

function klamruj(n: number, a = 0, b = 100) {
  return Math.min(b, Math.max(a, n));
}

function wspDoSvg(e: React.PointerEvent, svg: SVGSVGElement, siatka: number) {
  const r = svg.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width) * 100;
  const y = ((e.clientY - r.top) / r.height) * 100;
  return { x: snapDoSiatki(klamruj(x), siatka), y: snapDoSiatki(klamruj(y), siatka) };
}

export function EdytorRzutuParteruSaliKlient({
  hallId,
  poczatkowyRzut,
}: {
  hallId: string;
  poczatkowyRzut: RzutParteruSaliJson | null;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const ostatnioZSerwera = useRef<RzutParteruSaliJson | null>(poczatkowyRzut);
  const [wybrany, ustawWybrany] = useState<SzablonId>(() =>
    poczatkowyRzut ? mapKluczDoWyboru(poczatkowyRzut.szablonKlucz) : "l_studzienki",
  );
  const [roboczy, ustawRoboczy] = useState<RzutParteruSaliJson>(() => poczatkowyRzut ?? zSzablonu("l_studzienki"));
  const [notatka, ustawNotatka] = useState(() => poczatkowyRzut?.notatka?.trim() ?? "");
  const [komunikat, ustawKomunikat] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [tryb, ustawTryb] = useState<TrybEdycji>("przeglad");
  const [typZnacznika, ustawTypZnacznika] = useState<TypElementuArch>("wejscie");
  const [wybranePom, ustawWybranePom] = useState<string | null>(null);
  const [wybraneArch, ustawWybraneArch] = useState<string | null>(null);
  const [scianaStart, ustawScianaStart] = useState<{ x: number; y: number } | null>(null);
  const [pomStart, ustawPomStart] = useState<{ x: number; y: number } | null>(null);
  const [przeciagPom, ustawPrzeciagPom] = useState<{ id: string; offX: number; offY: number } | null>(null);

  const siatka = roboczy.snap_siatka ?? 2;

  const podglad = useMemo(
    () => ({ ...roboczy, notatka: notatka.trim() || null }),
    [roboczy, notatka],
  );

  const zapiszWersje = useCallback(
    (doZapisu: RzutParteruSaliJson) => {
      ustawKomunikat(null);
      startTransition(async () => {
        const w = await zapiszRzutParteruSali(hallId, doZapisu);
        if ("blad" in w) {
          ustawKomunikat(w.blad);
          return;
        }
        ostatnioZSerwera.current = doZapisu;
        ustawKomunikat("Zapisano rzut parteru.");
      });
    },
    [hallId],
  );

  const zapisz = useCallback(() => {
    zapiszWersje({ ...roboczy, notatka: notatka.trim() || null });
  }, [roboczy, notatka, zapiszWersje]);

  const wczytajSzablon = useCallback(() => {
    const b = zSzablonu(wybrany);
    ustawRoboczy({ ...b, notatka: notatka.trim() || b.notatka || null });
    ustawKomunikat("Załadowano szablon.");
  }, [wybrany, notatka]);

  const obsluzKlikSvg = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return;
      const w = wspDoSvg(e, svg, siatka);

      if (tryb === "sciana") {
        if (!scianaStart) {
          ustawScianaStart(w);
          return;
        }
        const nowaSciana: ElementArchRzutu = {
          id: noweIdArch(),
          typ: "sciana",
          x1: scianaStart.x,
          y1: scianaStart.y,
          x2: w.x,
          y2: w.y,
        };
        ustawRoboczy((r) => ({
          ...r,
          elementy_arch: [...(r.elementy_arch ?? []), nowaSciana],
        }));
        ustawScianaStart(null);
        return;
      }

      if (tryb === "znacznik") {
        const zn: ElementArchRzutu = {
          id: noweIdArch(),
          typ: typZnacznika,
          x: w.x - 1.5,
          y: w.y - 0.6,
          w: typZnacznika === "rampa" ? 4 : 3,
          h: typZnacznika === "okno" ? 0.8 : 1.2,
          etykieta: typZnacznika === "wejscie" ? "Dz" : typZnacznika === "okno" ? "O" : undefined,
        };
        ustawRoboczy((r) => ({
          ...r,
          elementy_arch: [...(r.elementy_arch ?? []), zn],
        }));
        return;
      }

      if (tryb === "pomieszczenie") {
        if (!pomStart) {
          ustawPomStart(w);
          return;
        }
        const x = Math.min(pomStart.x, w.x);
        const y = Math.min(pomStart.y, w.y);
        const pw = Math.max(3, Math.abs(w.x - pomStart.x));
        const ph = Math.max(3, Math.abs(w.y - pomStart.y));
        const lp = String(roboczy.pomieszczenia.length + 1);
        const nowe = nowePomieszczenie(lp);
        nowe.x = x;
        nowe.y = y;
        nowe.w = pw;
        nowe.h = ph;
        ustawRoboczy((r) => ({ ...r, pomieszczenia: [...r.pomieszczenia, nowe] }));
        ustawPomStart(null);
      }
    },
    [tryb, scianaStart, pomStart, typZnacznika, siatka, roboczy.pomieszczenia.length],
  );

  const onPointerMovePom = useCallback(
    (e: React.PointerEvent) => {
      if (!przeciagPom || !svgRef.current) return;
      const w = wspDoSvg(e, svgRef.current, siatka);
      ustawRoboczy((r) => ({
        ...r,
        pomieszczenia: r.pomieszczenia.map((p) =>
          p.id === przeciagPom.id
            ? {
                ...p,
                x: klamruj(w.x - przeciagPom.offX, 0, 100 - p.w),
                y: klamruj(w.y - przeciagPom.offY, 0, 100 - p.h),
              }
            : p,
        ),
      }));
    },
    [przeciagPom, siatka],
  );

  const wgrajTlo = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const plik = e.target.files?.[0];
    if (!plik) return;
    const fd = new FormData();
    fd.set("file", plik);
    fd.set("prefix", `halls/${hallId}/floor-plan`);
    const w = await wgrajObrazDoMagazynuR2(fd);
    if ("blad" in w) {
      ustawKomunikat(w.blad);
      return;
    }
    ustawRoboczy((r) => ({
      ...r,
      tlo: { url: w.publicUrl, opacity: 0.45, kalibracja: r.tlo?.kalibracja ?? null },
    }));
    ustawKomunikat("Wgrano tło rzutu.");
    e.target.value = "";
  }, [hallId]);

  const wybranePomieszczenie: PomieszczenieRzutuParteru | null =
    wybranePom ? roboczy.pomieszczenia.find((p) => p.id === wybranePom) ?? null : null;

  return (
    <section
      id="rzut-parteru-sali"
      className="scroll-mt-24 mt-8 max-w-full rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30 p-4 shadow-sm sm:p-6"
    >
      <h2 className="font-serif text-xl text-green-950 sm:text-2xl">Edytor rzutu parteru</h2>
      <p className="mt-2 max-w-prose text-sm text-stone-600">
        Rysuj ściany, dodawaj okna i wejścia, edytuj pomieszczenia. Schemat orientacyjny — nie zastępuje planu stołów poniżej.
      </p>

      <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1fr),minmax(0,340px)]">
        <div className="space-y-4">
          {/* Szablony */}
          <fieldset>
            <legend className="text-xs font-bold uppercase tracking-wider text-stone-500">Szablon startowy</legend>
            <div className="mt-2 flex flex-col gap-2">
              {SZABLONY.map((s) => (
                <label
                  key={s.id}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-stone-200 bg-white/90 p-3 has-[:checked]:border-emerald-500"
                >
                  <input
                    type="radio"
                    name="szablon-rzutu"
                    checked={wybrany === s.id}
                    onChange={() => ustawWybrany(s.id)}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-medium text-stone-900">{s.label}</span>
                    <span className="mt-0.5 block text-xs text-stone-600">{s.krotko}</span>
                  </span>
                </label>
              ))}
            </div>
            <button type="button" onClick={wczytajSzablon} className="mt-2 rounded-lg border border-emerald-700 bg-emerald-800 px-3 py-2 text-sm font-semibold text-white">
              Załaduj szablon
            </button>
          </fieldset>

          {/* Narzędzia */}
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Narzędzia rysowania</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["przeglad", "sciana", "znacznik", "pomieszczenie"] as TrybEdycji[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { ustawTryb(t); ustawScianaStart(null); ustawPomStart(null); }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium ${tryb === t ? "bg-emerald-800 text-white" : "border border-stone-200 bg-stone-50"}`}
                >
                  {t === "przeglad" ? "Przegląd" : t === "sciana" ? "Ściana" : t === "znacznik" ? "Znacznik" : "+ Pomieszczenie"}
                </button>
              ))}
            </div>
            {tryb === "sciana" ? (
              <p className="mt-2 text-xs text-amber-800">Kliknij dwa punkty, aby narysować ścianę.{scianaStart ? " Wybierz drugi punkt…" : ""}</p>
            ) : null}
            {tryb === "pomieszczenie" ? (
              <p className="mt-2 text-xs text-amber-800">Przeciągnij dwa rogi prostokąta pomieszczenia.{pomStart ? " Wybierz drugi róg…" : ""}</p>
            ) : null}
            {tryb === "znacznik" ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {ZNACZNIKI.map((z) => (
                  <button
                    key={z.typ}
                    type="button"
                    onClick={() => ustawTypZnacznika(z.typ)}
                    className={`rounded px-2 py-1 text-xs ${typZnacznika === z.typ ? "bg-sky-800 text-white" : "border border-stone-200"}`}
                  >
                    {z.label}
                  </button>
                ))}
              </div>
            ) : null}
            {tryb === "przeglad" ? (
              <p className="mt-2 text-xs text-stone-600">Kliknij pomieszczenie, aby je edytować. Przeciągnij, aby przesunąć.</p>
            ) : null}
          </div>

          {/* Edycja wybranego pomieszczenia */}
          {wybranePomieszczenie ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
              <p className="text-sm font-semibold text-emerald-950">Pomieszczenie: {wybranePomieszczenie.nazwa}</p>
              <label className="block text-xs">
                Nazwa
                <input
                  value={wybranePomieszczenie.nazwa}
                  onChange={(e) =>
                    ustawRoboczy((r) => ({
                      ...r,
                      pomieszczenia: r.pomieszczenia.map((p) =>
                        p.id === wybranePomieszczenie.id ? { ...p, nazwa: e.target.value.slice(0, 120) } : p,
                      ),
                    }))
                  }
                  className="mt-1 w-full rounded border border-stone-200 px-2 py-1 text-sm"
                />
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={roboczy.sala_glowna_id === wybranePomieszczenie.id}
                  onChange={(e) =>
                    ustawRoboczy((r) => ({
                      ...r,
                      sala_glowna_id: e.target.checked ? wybranePomieszczenie.id : r.sala_glowna_id,
                    }))
                  }
                />
                Sala główna (maska planu stołów) ★
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    ustawRoboczy((r) => ({
                      ...r,
                      pomieszczenia: r.pomieszczenia.filter((p) => p.id !== wybranePom),
                    }));
                    ustawWybranePom(null);
                  }}
                  className="rounded border border-red-200 px-2 py-1 text-xs text-red-800"
                >
                  Usuń pomieszczenie
                </button>
              </div>
            </div>
          ) : null}

          {wybraneArch ? (
            <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-3">
              <p className="text-xs text-sky-900">Wybrany element architektoniczny</p>
              <button
                type="button"
                onClick={() => {
                  ustawRoboczy((r) => ({
                    ...r,
                    elementy_arch: (r.elementy_arch ?? []).filter((a) => a.id !== wybraneArch),
                  }));
                  ustawWybraneArch(null);
                }}
                className="mt-1 rounded border border-red-200 px-2 py-1 text-xs text-red-800"
              >
                Usuń znacznik/ścianę
              </button>
            </div>
          ) : null}

          {/* Wymiary + tło */}
          <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-3">
            <label className="block text-sm">
              Tytuł
              <input
                value={roboczy.tytul}
                maxLength={160}
                onChange={(e) => ustawRoboczy((r) => ({ ...r, tytul: e.target.value }))}
                className="mt-1 w-full rounded border border-stone-200 px-2 py-1.5 text-sm"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                Szer. bryły (m)
                <input
                  type="number"
                  min={1}
                  max={200}
                  step={0.1}
                  value={roboczy.bryla_szer_m}
                  onChange={(e) => ustawRoboczy((r) => ({ ...r, bryla_szer_m: clampWymiarM(Number(e.target.value)) }))}
                  className="mt-1 w-full rounded border px-2 py-1.5 text-sm tabular-nums"
                />
              </label>
              <label className="text-sm">
                Głęb. bryły (m)
                <input
                  type="number"
                  min={1}
                  max={200}
                  step={0.1}
                  value={roboczy.bryla_gleb_m}
                  onChange={(e) => ustawRoboczy((r) => ({ ...r, bryla_gleb_m: clampWymiarM(Number(e.target.value)) }))}
                  className="mt-1 w-full rounded border px-2 py-1.5 text-sm tabular-nums"
                />
              </label>
            </div>
            <label className="block text-sm">
              Siatka snap (%)
              <input
                type="number"
                min={0.5}
                max={10}
                step={0.5}
                value={siatka}
                onChange={(e) => ustawRoboczy((r) => ({ ...r, snap_siatka: Number(e.target.value) || 2 }))}
                className="mt-1 w-24 rounded border px-2 py-1 text-sm"
              />
            </label>
            <div>
              <p className="text-xs font-medium text-stone-600">Tło (PNG/JPG z projektu)</p>
              <input type="file" accept="image/*" onChange={wgrajTlo} className="mt-1 text-xs" />
              {roboczy.tlo?.url ? (
                <label className="mt-2 flex items-center gap-2 text-xs">
                  Przezroczystość
                  <input
                    type="range"
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={roboczy.tlo.opacity}
                    onChange={(e) =>
                      ustawRoboczy((r) => ({
                        ...r,
                        tlo: r.tlo ? { ...r.tlo, opacity: Number(e.target.value) } : null,
                      }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => ustawRoboczy((r) => ({ ...r, tlo: null }))}
                    className="text-red-700 underline"
                  >
                    Usuń tło
                  </button>
                </label>
              ) : null}
            </div>
          </div>

          <label className="block text-sm">
            Notatka
            <textarea
              value={notatka}
              onChange={(e) => ustawNotatka(e.target.value)}
              rows={2}
              maxLength={2000}
              className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
            />
          </label>

          {komunikat ? (
            <p className={`rounded-lg px-3 py-2 text-sm ${komunikat.startsWith("Zapisano") ? "bg-emerald-50 text-emerald-950" : "bg-amber-50 text-amber-950"}`} role="status">
              {komunikat}
            </p>
          ) : null}

          <button
            type="button"
            disabled={pending}
            onClick={zapisz}
            className="rounded-xl bg-green-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Zapisywanie…" : "Zapisz rzut parteru"}
          </button>
        </div>

        {/* Canvas interaktywny */}
        <div className="rounded-xl border border-stone-200 bg-white p-3 shadow-inner">
          <p className="text-center text-[10px] font-bold uppercase text-stone-500">Edytor — kliknij / przeciągnij</p>
          <div
            className="mt-2 aspect-square w-full touch-none"
            onPointerMove={onPointerMovePom}
            onPointerUp={() => ustawPrzeciagPom(null)}
            onPointerLeave={() => ustawPrzeciagPom(null)}
          >
            <svg
              ref={svgRef}
              viewBox="0 0 100 100"
              className="h-full w-full cursor-crosshair"
              onPointerDown={obsluzKlikSvg}
            >
              <rect x="0" y="0" width="100" height="100" fill="#fafaf9" />
              {roboczy.tlo?.url ? (
                <image href={roboczy.tlo.url} x="0" y="0" width="100" height="100" opacity={roboczy.tlo.opacity} preserveAspectRatio="xMidYMid meet" />
              ) : null}
              {roboczy.pomieszczenia.map((p) => (
                <rect
                  key={p.id}
                  x={p.x}
                  y={p.y}
                  width={p.w}
                  height={p.h}
                  fill={p.color}
                  fillOpacity={0.5}
                  stroke={roboczy.sala_glowna_id === p.id ? "#15803d" : wybranePom === p.id ? "#2563eb" : "#44403c"}
                  strokeWidth={wybranePom === p.id ? 0.6 : 0.3}
                  rx="0.3"
                  onPointerDown={(ev) => {
                    if (tryb !== "przeglad") return;
                    ev.stopPropagation();
                    ustawWybranePom(p.id);
                    ustawWybraneArch(null);
                    const svg = svgRef.current;
                    if (!svg) return;
                    const w = wspDoSvg(ev, svg, 0);
                    ustawPrzeciagPom({ id: p.id, offX: w.x - p.x, offY: w.y - p.y });
                  }}
                />
              ))}
              {(roboczy.elementy_arch ?? []).map((el) => {
                if (el.typ === "sciana" && el.x1 != null && el.y1 != null && el.x2 != null && el.y2 != null) {
                  return (
                    <line
                      key={el.id}
                      x1={el.x1}
                      y1={el.y1}
                      x2={el.x2}
                      y2={el.y2}
                      stroke="#44403c"
                      strokeWidth="0.5"
                      onPointerDown={(ev) => { ev.stopPropagation(); ustawWybraneArch(el.id); ustawWybranePom(null); }}
                    />
                  );
                }
                const x = el.x ?? 0;
                const y = el.y ?? 0;
                return (
                  <rect
                    key={el.id}
                    x={x}
                    y={y}
                    width={el.w ?? 3}
                    height={el.h ?? 1}
                    fill="#bae6fd"
                    fillOpacity={0.7}
                    stroke={wybraneArch === el.id ? "#2563eb" : "#0369a1"}
                    strokeWidth={0.4}
                    onPointerDown={(ev) => { ev.stopPropagation(); ustawWybraneArch(el.id); ustawWybranePom(null); }}
                  />
                );
              })}
              {scianaStart ? <circle cx={scianaStart.x} cy={scianaStart.y} r="0.8" fill="#dc2626" /> : null}
              {pomStart ? <circle cx={pomStart.x} cy={pomStart.y} r="0.8" fill="#2563eb" /> : null}
            </svg>
          </div>
          <div className="mt-2">
            <RzutParteruSaliSvg plan={podglad} className="h-24 w-full opacity-60" pokazPolnoc={false} />
            <p className="mt-1 text-center text-[10px] text-stone-500">Podgląd finalny (z etykietami)</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Alias wstecznej kompatybilności */
export const GeneratorRzutuParteruSaliKlient = EdytorRzutuParteruSaliKlient;
