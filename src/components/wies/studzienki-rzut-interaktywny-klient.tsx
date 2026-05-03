"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  BRYLA_M,
  PROSTOKAT_SALI_DLA_STOLOW_PROC,
  STREFA_SALI_GLOWNEJ_ID,
  STREFY_RZUTU_STUDZIENKI,
  UKLAD_STOLOW_W_SALI_STUDZIENKI,
  ZNACZNIKI_RZUTU_STUDZIENKI,
  znajdzStrefe,
  type ProstokatProc,
} from "./studzienki-rzut-dane";

const OBRAZ = "/wies/studzienki/rzut-parteru.png";
/** Szacowane wymiary do Next/Image (plik w repozytorium może być JPEG mimo .png w nazwie). */
const IMG_W = 1600;
const IMG_H = 1200;

type StolProsty = {
  id: string;
  typ: "okragly" | "prostokatny";
  x: number;
  y: number;
  miejsca: number;
  szer: number;
  wys: number;
};

function klamruj(n: number, a: number, b: number): number {
  return Math.min(b, Math.max(a, n));
}

function wspDoSvg(
  e: Pick<React.PointerEvent, "clientX" | "clientY">,
  svg: SVGSVGElement
): { x: number; y: number } {
  const r = svg.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width) * 100;
  const y = ((e.clientY - r.top) / r.height) * 100;
  return { x, y };
}

function sumaMiejsc(stoly: StolProsty[]) {
  return stoly.reduce((a, t) => a + t.miejsca, 0);
}

function nowyStolProsty(sala: ProstokatProc): StolProsty {
  return {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `s-${Date.now()}`,
    typ: "okragly",
    x: sala.x + sala.w * 0.4,
    y: sala.y + sala.h * 0.4,
    miejsca: 8,
    szer: 7,
    wys: 7,
  };
}

export function StudzienkiRzutInteraktywny() {
  const idPref = useId();
  const svgUid = idPref.replace(/:/g, "");
  const svgRef = useRef<SVGSVGElement | null>(null);
  /** Sali 1.6 w kształcie L: bbox 8,0 m + doł 7,05 m — ograniczenie stołów; główny prostokąt 8,00×6,60 m w `PROSTOKAT_SALI_GLOWNEJ_PROC`. */
  const sala = useMemo(() => PROSTOKAT_SALI_DLA_STOLOW_PROC, []);
  const [pokazStrefy, ustawPokazStrefy] = useState(true);
  const [pokazZnaczniki, ustawPokazZnaczniki] = useState(true);
  const [trybStolow, ustawTrybStolow] = useState(false);
  const [wybrana, ustawWybrana] = useState<string | null>(null);
  const [stoly, ustawStoly] = useState<StolProsty[]>(() =>
    UKLAD_STOLOW_W_SALI_STUDZIENKI.map((t) => ({ ...t, id: `${idPref}-${t.id}` }))
  );
  const [wlecze, ustawWlecze] = useState<{ id: string; offX: number; offY: number } | null>(null);
  const [najechana, ustawNajechana] = useState<string | null>(null);
  const wleczePrzestRef = useRef<typeof wlecze>(null);
  wleczePrzestRef.current = wlecze;

  const ograniczWzgledemSali = useCallback(
    (s: StolProsty) => {
      return {
        ...s,
        x: klamruj(s.x, sala.x, sala.x + sala.w - s.szer),
        y: klamruj(s.y, sala.y, sala.y + sala.h - s.wys),
      };
    },
    [sala]
  );

  const przesunWszystkieStart = useCallback((lista: StolProsty[]) => {
    return lista.map((s) => ograniczWzgledemSali(s));
  }, [ograniczWzgledemSali]);

  const naPointerStoluDown = (e: React.PointerEvent, st: StolProsty) => {
    if (!trybStolow) return;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    e.preventDefault();
    e.stopPropagation();
    if (!svgRef.current) return;
    const w = wspDoSvg(e, svgRef.current);
    /* Przeciągany stół rysuj nad pozostałymi (kolejność w <svg>). */
    ustawStoly((list) => {
      const idx = list.findIndex((s) => s.id === st.id);
      if (idx < 0) return list;
      if (idx === list.length - 1) return list;
      const next = list.slice();
      const [moved] = next.splice(idx, 1);
      return moved ? [...next, moved] : list;
    });
    ustawWlecze({ id: st.id, offX: w.x - st.x, offY: w.y - st.y });
  };

  useEffect(() => {
    if (!wlecze) return;
    const naRuch = (e: PointerEvent) => {
      const ref = wleczePrzestRef.current;
      if (!ref || !svgRef.current) return;
      const w = wspDoSvg(e, svgRef.current);
      const nx = w.x - ref.offX;
      const ny = w.y - ref.offY;
      ustawStoly((list) =>
        list.map((s) => (s.id !== ref.id ? s : ograniczWzgledemSali({ ...s, x: nx, y: ny })))
      );
    };
    const naKoniec = () => {
      ustawWlecze(null);
    };
    window.addEventListener("pointermove", naRuch);
    window.addEventListener("pointerup", naKoniec);
    window.addEventListener("pointercancel", naKoniec);
    return () => {
      window.removeEventListener("pointermove", naRuch);
      window.removeEventListener("pointerup", naKoniec);
      window.removeEventListener("pointercancel", naKoniec);
    };
  }, [wlecze, ograniczWzgledemSali]);

  useEffect(() => {
    const naKlawisz = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      ustawWybrana(null);
      ustawNajechana(null);
      ustawWlecze(null);
    };
    window.addEventListener("keydown", naKlawisz);
    return () => window.removeEventListener("keydown", naKlawisz);
  }, []);

  const suma = sumaMiejsc(stoly);

  function pasekPilule(
    klucz: string,
    etykieta: string,
    krotko: string,
    aktywne: boolean,
    onToggle: () => void
  ) {
    return (
      <label
        key={klucz}
        className="group/pill has-[:checked]:[&_.studz-pill-sub]:text-emerald-800/90 relative inline-flex cursor-pointer items-stretch"
      >
        <input type="checkbox" checked={aktywne} onChange={onToggle} className="peer sr-only" />
        <span className="flex min-h-[44px] sm:min-h-0 select-none items-center gap-2 rounded-2xl border-2 border-stone-200/90 bg-white/80 px-3.5 py-2.5 text-xs font-semibold text-stone-600 shadow-sm backdrop-blur-sm transition duration-200 peer-checked:border-emerald-500/80 peer-checked:bg-gradient-to-r peer-checked:from-emerald-50 peer-checked:via-white peer-checked:to-teal-50/90 peer-checked:text-emerald-950 peer-checked:shadow-md peer-hover:border-stone-300 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-emerald-700/40">
          <span
            className={`h-2 w-2 shrink-0 rounded-full transition ${
              aktywne
                ? "scale-110 bg-gradient-to-br from-emerald-500 to-teal-600 shadow-[0_0_0_2px_rgba(16,185,129,0.35)]"
                : "bg-stone-300 group-hover/pill:bg-stone-400"
            }`}
            aria-hidden
          />
          <span>
            {etykieta}
            <span className="studz-pill-sub mt-0.5 block text-[10px] font-normal leading-tight text-stone-500 transition">
              {krotko}
            </span>
          </span>
        </span>
      </label>
    );
  }

  return (
    <div className="animate-studz-rzut-enter group relative max-w-5xl">
      <div
        className="pointer-events-none absolute -inset-px rounded-[1.2rem] bg-gradient-to-r from-emerald-400/40 via-teal-400/35 to-amber-300/30 opacity-70 blur-sm animate-studz-rzut-glow"
        aria-hidden
      />
      <div className="pointer-events-none absolute -inset-[1px] rounded-[1.15rem] p-[1px] opacity-60" aria-hidden>
        <div className="h-full w-full rounded-[1.1rem] bg-[length:200%_100%] bg-gradient-to-r from-transparent via-white/25 to-transparent animate-studz-rzut-shimmer" />
      </div>
      <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-b from-stone-50/98 via-white to-emerald-50/30 shadow-[0_1px_0_rgba(255,255,255,0.85)_inset,0_20px_60px_-20px_rgba(15,80,55,0.28),0_0_0_1px_rgba(21,83,45,0.05)] ring-1 ring-stone-900/5 sm:rounded-3xl">
        <div className="relative border-b border-emerald-900/[0.06] bg-gradient-to-r from-emerald-950/90 via-emerald-900/95 to-teal-900/90 px-4 py-4 text-white sm:px-5 sm:py-5">
          <div
            className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(120deg,transparent,transparent_14px,rgba(255,255,255,0.03)_14px,rgba(255,255,255,0.03)_15px)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-8 -top-20 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl"
            aria-hidden
          />
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-200/95">Parter · Studzienki</p>
          <h3 className="mt-1.5 font-serif text-lg leading-tight sm:text-2xl">
            <span className="block bg-gradient-to-r from-white via-emerald-100 to-teal-200 bg-clip-text text-transparent drop-shadow-sm">
              Interaktywny plan piętra
            </span>
            <span className="mt-1 block text-sm font-normal text-emerald-100/95">
              Odkryj strefy, włącz wejścia i okna — a w sali ułóż stół w kilka ruchów.
            </span>
          </h3>
        </div>
        <div className="space-y-3 border-b border-stone-200/60 bg-white/50 px-4 py-4 sm:px-5">
          <p className="text-xs leading-relaxed text-stone-600 sm:text-sm">
            Prostokąty pomieszczeń pochodzą z <strong>wymiarów w metrach</strong> (tabela 1.1–1.6) przeliczonych na
            tło PNG. W papierach liczy się <strong>oryginał 1:100</strong> i projekt budowlany; tu orientacja, nie
            wymiary prawne w CAD.             <span className="whitespace-nowrap">Bryła modelu: {BRYLA_M.w} m × {BRYLA_M.h} m.</span>{" "}
            <span className="sm:hidden">Dotknij pustego tła rysunku, by schować opis strefy.</span>
            <span className="hidden sm:inline">
              <kbd className="rounded border border-stone-300 bg-stone-100 px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd>{" "}
              — czyści wybór strefy albo kończy przeciąganie stołu.
            </span>
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2 sm:gap-2.5">
              {pasekPilule("a", "Pomieszczenia", "Klik i najazd", pokazStrefy, () => ustawPokazStrefy((v) => !v))}
              {pasekPilule("b", "Wejścia i okna", "Dz1, O, rampa", pokazZnaczniki, () => ustawPokazZnaczniki((v) => !v))}
              {pasekPilule("c", "Stoły w sali", "Przeciąganie", trybStolow, () => ustawTrybStolow((v) => !v))}
            </div>
            {trybStolow ? (
              <div className="flex w-full min-w-0 max-w-full flex-nowrap items-center justify-end gap-1.5 overflow-x-auto scroll-pb-2 sm:w-auto sm:flex-wrap sm:overflow-visible [scrollbar-width:thin] [padding-bottom:env(safe-area-inset-bottom,0px)]">
                <div className="inline-flex min-h-[44px] min-w-0 shrink-0 sm:min-h-0 items-center justify-center gap-1.5 rounded-2xl border-2 border-emerald-200/80 bg-gradient-to-b from-amber-50/90 to-white px-3 py-1.5 text-sm font-serif tabular-nums text-emerald-950 shadow-inner shadow-emerald-900/5">
                  <span className="text-lg font-bold tracking-tight">{suma}</span>
                  <span className="text-xs font-sans text-stone-500">miejsc</span>
                </div>
                <button
                  type="button"
                  onClick={() => ustawStoly((l) => [...l, ograniczWzgledemSali(nowyStolProsty(sala))])}
                  className="min-h-[44px] shrink-0 touch-manipulation rounded-2xl border-2 border-emerald-800/20 bg-gradient-to-b from-emerald-600 to-emerald-800 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-900/25 transition hover:from-emerald-500 hover:to-emerald-700 active:scale-[0.98] sm:min-h-0"
                >
                  + stół
                </button>
                <button
                  type="button"
                  onClick={() =>
                    ustawStoly(
                      przesunWszystkieStart(UKLAD_STOLOW_W_SALI_STUDZIENKI.map((t) => ({ ...t, id: `${idPref}-${t.id}` })))
                    )
                  }
                  className="min-h-[44px] shrink-0 touch-manipulation rounded-2xl border border-stone-200/90 bg-white px-3.5 py-2 text-sm font-medium text-stone-700 shadow-sm transition hover:border-emerald-300/60 hover:bg-stone-50/90 sm:min-h-0"
                >
                  Start
                </button>
                <button
                  type="button"
                  onClick={() => ustawStoly([])}
                  className="min-h-[44px] shrink-0 touch-manipulation rounded-2xl border border-stone-200/90 bg-stone-50/90 px-3.5 py-2 text-sm text-stone-600 transition hover:bg-stone-100 sm:min-h-0"
                >
                  Wyczyść
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="relative w-full bg-stone-900/5 p-1.5 sm:p-2">
          <div className="relative overflow-hidden rounded-xl sm:rounded-2xl sm:ring-1 sm:ring-white/30">
            <div
              className="pointer-events-none absolute inset-0 z-10 shadow-[inset_0_0_80px_rgba(5,50,30,0.1)]"
              aria-hidden
            />
            <div className="relative">
          <Image
            src={OBRAZ}
            alt="Rzut parteru projektowanej świetlicy wiejskiej w Studzienkach"
            width={IMG_W}
            height={IMG_H}
            className="h-auto w-full select-none transition duration-700 ease-out group-hover:brightness-[1.03]"
            priority
            sizes="(max-width: 1024px) 100vw, min(896px, 70vw)"
          />
          <svg
            ref={svgRef}
            className={`absolute left-0 top-0 h-full w-full touch-none ${wlecze ? "cursor-grabbing" : trybStolow ? "cursor-default" : ""}`}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            role="img"
            aria-label="Interaktywna warstwa: pomieszczenia i stół w planie"
          >
            {/* Klik w wolne pole (pod warstwą stref) — odpina wybór podświetlonej strefy */}
            {pokazStrefy && !trybStolow ? (
              <rect
                x="0"
                y="0"
                width="100"
                height="100"
                fill="transparent"
                className="cursor-default"
                aria-hidden
                onClick={() => {
                  ustawWybrana(null);
                  ustawNajechana(null);
                }}
              />
            ) : null}
            <defs>
              <linearGradient id={`stol-grad-${svgUid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f0fdf4" />
                <stop offset="55%" stopColor="#bbf7d0" />
                <stop offset="100%" stopColor="#86efac" />
              </linearGradient>
              <linearGradient id={`stol-grad-okrag-${svgUid}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fffbeb" />
                <stop offset="100%" stopColor="#fed7aa" stopOpacity="0.95" />
              </linearGradient>
              <filter
                id={`stol-cien-${svgUid}`}
                x="-0.1"
                y="-0.1"
                width="1.2"
                height="1.2"
                colorInterpolationFilters="sRGB"
              >
                <feDropShadow dx="0" dy="0.2" stdDeviation="0.15" floodColor="#0f3d1f" floodOpacity="0.4" />
              </filter>
              <pattern
                id={`rampa-siatka-${svgUid}`}
                width="1.2"
                height="1.2"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(25)"
              >
                <line x1="0" y1="0" x2="0" y2="1.2" stroke="#a8a29e" strokeWidth="0.15" />
              </pattern>
            </defs>
            {pokazStrefy
              ? STREFY_RZUTU_STUDZIENKI.map((z) => {
                  const wyr = z.id === wybrana || z.id === najechana;
                  return (
                    <g key={z.id}>
                      <rect
                        x={z.rect.x}
                        y={z.rect.y}
                        width={z.rect.w}
                        height={z.rect.h}
                        fill={z.id === STREFA_SALI_GLOWNEJ_ID || z.id === "1.6L" ? "rgba(16,185,129,0.12)" : "rgba(120,113,108,0.06)"}
                        stroke={wyr ? z.kolor : "rgba(0,0,0,0.18)"}
                        strokeWidth={wyr ? 0.5 : 0.14}
                        opacity={wyr ? 1 : 0.88}
                        className="cursor-pointer transition"
                        onMouseEnter={() => !trybStolow && ustawNajechana(z.id)}
                        onMouseLeave={() => !trybStolow && ustawNajechana(null)}
                        onClick={() => {
                          if (!trybStolow) {
                            ustawWybrana((cur) => (cur === z.id ? null : z.id));
                          }
                        }}
                      >
                        <title>
                          {z.id} {z.nazwa} — {z.powierzchnia}
                        </title>
                      </rect>
                      {wyr && !trybStolow ? (
                        <text
                          x={z.rect.x + 1.2}
                          y={z.rect.y + 3.2}
                          className="pointer-events-none select-none"
                          fill="rgba(28,25,23,0.5)"
                          fontSize={2.2}
                          fontWeight="700"
                        >
                          {z.id}
                        </text>
                      ) : null}
                    </g>
                  );
                })
              : null}
            {pokazZnaczniki
              ? ZNACZNIKI_RZUTU_STUDZIENKI.map((z, i) => {
                  const { x, y, w, h } = z.rect;
                  const cx = x + w / 2;
                  const cy = y + h / 2;
                  if (z.typ === "wejscie") {
                    return (
                      <g key={`${z.etykieta}-${i}`} className="pointer-events-none">
                        <title>
                          {z.etykieta}: {z.opis}
                        </title>
                        <rect x={x} y={y} width={w} height={h} fill="rgba(21,128,61,0.35)" stroke="#14532d" strokeWidth="0.12" rx="0.15" />
                        <text x={cx} y={cy + 0.8} textAnchor="middle" fontSize="1.8" fill="#14532d" fontWeight="700">
                          {z.etykieta}
                        </text>
                      </g>
                    );
                  }
                  if (z.typ === "drzwi_wew") {
                    return (
                      <g key={`${z.etykieta}-${i}`} className="pointer-events-none">
                        <title>
                          {z.etykieta}: {z.opis}
                        </title>
                        <line x1={x} y1={y + h} x2={x + w} y2={y} stroke="#92400e" strokeWidth="0.35" />
                        <text x={cx} y={y - 0.5} textAnchor="middle" fontSize="1.5" fill="#92400e" fontWeight="600">
                          {z.etykieta}
                        </text>
                      </g>
                    );
                  }
                  if (z.typ === "rampa") {
                    return (
                      <g key={`${z.etykieta}-${i}`} className="pointer-events-none">
                        <title>{z.opis}</title>
                        <rect
                          x={x}
                          y={y}
                          width={w}
                          height={h}
                          fill={`url(#rampa-siatka-${svgUid})`}
                          stroke="#78716c"
                          strokeWidth="0.1"
                        />
                        <text x={cx} y={cy + 0.6} textAnchor="middle" fontSize="1.4" fill="#44403c" fontWeight="600">
                          {z.etykieta}
                        </text>
                      </g>
                    );
                  }
                  return (
                    <g key={`${z.etykieta}-${i}`} className="pointer-events-none">
                      <title>
                        {z.etykieta}: {z.opis}
                      </title>
                      <rect x={x} y={y} width={w} height={h} fill="rgba(14,165,233,0.45)" stroke="#0369a1" strokeWidth="0.12" rx="0.1" />
                      <text x={cx} y={cy + 0.7} textAnchor="middle" fontSize="1.5" fill="#0c4a6e" fontWeight="700">
                        {z.etykieta}
                      </text>
                    </g>
                  );
                })
              : null}
            {trybStolow
              ? stoly.map((st) => {
                  const srodekX = st.x + st.szer / 2;
                  const srodekY = st.y + st.wys / 2;
                  return (
                    <g
                      key={st.id}
                      onPointerDown={(e) => naPointerStoluDown(e, st)}
                      className={`${wlecze?.id === st.id ? "cursor-grabbing" : "cursor-grab active:cursor-grabbing"}`}
                      style={{ touchAction: "none" as const }}
                    >
                      {st.typ === "okragly" ? (
                        <ellipse
                          cx={srodekX}
                          cy={srodekY}
                          rx={st.szer / 2}
                          ry={st.wys / 2}
                          fill={`url(#stol-grad-okrag-${svgUid})`}
                          stroke="#166534"
                          strokeWidth="0.28"
                          filter={`url(#stol-cien-${svgUid})`}
                        />
                      ) : (
                        <rect
                          x={st.x}
                          y={st.y}
                          width={st.szer}
                          height={st.wys}
                          fill={`url(#stol-grad-${svgUid})`}
                          stroke="#14532d"
                          strokeWidth="0.24"
                          rx="0.35"
                          filter={`url(#stol-cien-${svgUid})`}
                        />
                      )}
                      <text
                        x={srodekX}
                        y={srodekY + 0.1}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#052e16"
                        fontSize="2.1"
                        fontWeight="800"
                        className="pointer-events-none"
                        style={{ textShadow: "0 0.08em 0 rgba(255,255,255,0.4)" }}
                      >
                        {st.miejsca}
                      </text>
                    </g>
                  );
                })
              : null}
          </svg>
        </div>
        </div>
        </div>

        {wybrana && !trybStolow && pokazStrefy ? (
          <div
            role="status"
            aria-live="polite"
            className="border-t border-emerald-200/40 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/50 px-4 py-3.5 text-sm text-stone-800 sm:px-5"
          >
            {(() => {
              const z = znajdzStrefe(wybrana ?? "");
              if (!z) return null;
              return (
                <p className="flex flex-wrap items-baseline gap-x-2">
                  <span className="rounded-md bg-white/80 px-2 py-0.5 font-mono text-xs text-emerald-800 shadow-sm ring-1 ring-emerald-200/50">
                    {z.id}
                  </span>
                  <span>
                    {z.nazwa} — <strong className="text-green-950">{z.powierzchnia}</strong>
                  </span>
                </p>
              );
            })()}
          </div>
        ) : null}

        {trybStolow ? (
          <p className="border-t border-amber-200/50 bg-gradient-to-b from-amber-50/90 to-amber-50/20 px-4 py-2.5 text-xs leading-relaxed text-amber-950/90 sm:px-5 sm:text-sm">
            Ćwiczenie aranżacyjne: stoły <strong>nie</strong> skalują się 1:1 w metrach. Wydarzenie weryfikuj w
            rzeczywistej sali. Po uruchomieniu świetlicy w naszawies sołtys zapisze plan w panelu sali. Chwytany stół
            ląduje <strong>nad</strong> pozostałymi, żeby go nie zasłaniały sąsiednie.
          </p>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-stone-200/60 bg-gradient-to-b from-stone-50/95 to-white/90 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-stone-500 sm:text-xs">
            <span className="font-semibold uppercase tracking-wider text-stone-600">Legenda</span>
            <span className="inline-flex max-w-full items-baseline gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 self-center rounded-sm bg-emerald-400/90 ring-1 ring-emerald-700/30" />
              <span>
                Sala <span className="font-mono text-stone-600">1.6</span> — dwa poligony (główna + doł L)
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-stone-400/90 ring-1 ring-stone-600/30" /> Inne pomieszczenia
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-sky-400/90 ring-1 ring-sky-700/30" /> Okno
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-amber-300/90 ring-1 ring-amber-800/20" /> Stół
            </span>
            <span className="font-mono text-stone-400 sm:ml-2">Podkład techniczny = dokumentacja projektowa</span>
          </div>
        </div>
      </div>
    </div>
  );
}
