"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type ChangeEvent } from "react";
import type { ElementPlanuSali, PlanSaliJson, TypElementuPlanu } from "@/lib/swietlica/plan-sali";
import { klonPlanuSali, sprobujSparsowacPlanSali, sumaMiejscWPlanie } from "@/lib/swietlica/plan-sali";
import { generujBankiet2x4, generujKsztaltU, generujRzadOkraglych } from "@/lib/swietlica/plan-sali-presety";
import { zapiszPlanSali } from "@/app/(site)/panel/soltys/akcje";
import { PlanSaliRysunek } from "./plan-sali-rysunek";

type SzablonLokalny = { id: string; nazwa: string; json: string };

type Props = {
  hallId: string;
  poczatkowyPlan: PlanSaliJson;
  /** Maks. osób w sali — porównanie z sumą miejsc w układzie stołów. */
  pojemnoscSali?: number | null;
};

const MAX_COFANIA = 22;
/** Szer. uszkodnia strefy kliku w jednostkach viewBox (łatwiej trafić palcem). */
const SLUP_PALCA = 1.8;

/** Szer. planu w 0–100, wys. w 0–70 — szacunek w cm, gdy podano wymiary sali w m. */
function przyblizRozmiarStoluCm(
  szer: number,
  wys: number,
  saliSzerM: number | null,
  saliDlM: number | null
): { szerCm: number; wysCm: number } | null {
  if (saliSzerM == null || saliDlM == null) return null;
  if (!Number.isFinite(saliSzerM) || !Number.isFinite(saliDlM) || saliSzerM <= 0 || saliDlM <= 0) return null;
  return {
    szerCm: Math.round((szer / 100) * saliSzerM * 100),
    wysCm: Math.round((wys / 70) * saliDlM * 100),
  };
}

function nowyStol(typ: TypElementuPlanu): ElementPlanuSali {
  return {
    id: crypto.randomUUID(),
    typ,
    x: 12,
    y: 12,
    szer: typ === "stol_okragly" ? 10 : 14,
    wys: typ === "stol_okragly" ? 10 : 9,
    obrot: 0,
    etykieta: "S",
    miejsca: typ === "lawka" ? 4 : 8,
    szer_cm: typ === "stol_okragly" ? 120 : 180,
    dl_cm: typ === "stol_okragly" ? 120 : 80,
  };
}

const KLUCZ_SZABLONOW = (h: string) => `plan-sali-szablony-v1-${h}`;

export function PlanSaliEdytor({ hallId, poczatkowyPlan, pojemnoscSali = null }: Props) {
  const [plan, ustawPlan] = useState<PlanSaliJson>(() => ({
    wersja: 1,
    szerokosc_sali_m: poczatkowyPlan.szerokosc_sali_m,
    dlugosc_sali_m: poczatkowyPlan.dlugosc_sali_m,
    elementy: [...poczatkowyPlan.elementy],
  }));
  const [wybrany, ustawWybrany] = useState<string | null>(null);
  const [komunikat, ustawKomunikat] = useState<{ typ: "ok" | "blad"; t: string } | null>(null);
  const [oczekuje, startTransition] = useTransition();
  const [cofnijDostepne, ustawCofnijDostepne] = useState(false);
  const [ponowDostepne, ustawPonowDostepne] = useState(false);
  const [brudnyPlan, ustawBrudnyPlan] = useState(false);
  const [kopiaWSchowkuEdytora, ustawKopiaWSchowkuEdytora] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const planRef = useRef(plan);
  planRef.current = plan;
  const przeciag = useRef<{ id: string; startClientX: number; startClientY: number; startX: number; startY: number } | null>(
    null
  );
  const przedPrzeciag = useRef<PlanSaliJson | null>(null);
  const czyRuchWDrag = useRef(false);
  const stosCofnij = useRef<PlanSaliJson[]>([]);
  const stosPonow = useRef<PlanSaliJson[]>([]);
  const etykietaPrzedFokusem = useRef<PlanSaliJson | null>(null);
  const etykietaFokusId = useRef<string | null>(null);
  const ostatniZapisany = useRef<PlanSaliJson>(klonPlanuSali(poczatkowyPlan));
  const schowekElementu = useRef<ElementPlanuSali | null>(null);
  const wejscieImportu = useRef<HTMLInputElement | null>(null);
  const odciskZapisu = useRef(
    (() => {
      try {
        return JSON.stringify(poczatkowyPlan);
      } catch {
        return "";
      }
    })()
  );

  const [szablony, ustawSzablony] = useState<SzablonLokalny[]>([]);
  const [nazwaSzablonu, ustawNazwaSzablonu] = useState("");

  const sumaMiejsc = useMemo(() => sumaMiejscWPlanie(plan), [plan]);
  const przekroczonaPojemnosc = pojemnoscSali != null && pojemnoscSali > 0 && sumaMiejsc > pojemnoscSali;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KLUCZ_SZABLONOW(hallId));
      if (!raw) return;
      const p = JSON.parse(raw) as unknown;
      if (!Array.isArray(p)) return;
      const ok = p.filter(
        (x) =>
          x != null &&
          typeof x === "object" &&
          "id" in x &&
          "nazwa" in x &&
          "json" in x &&
          typeof (x as SzablonLokalny).id === "string" &&
          typeof (x as SzablonLokalny).nazwa === "string" &&
          typeof (x as SzablonLokalny).json === "string"
      ) as SzablonLokalny[];
      ustawSzablony(ok.slice(0, 8));
    } catch {
      /* cicho */
    }
  }, [hallId]);

  function zapiszSzablonyLokalne(lista: SzablonLokalny[]) {
    const obci = lista.slice(0, 8);
    ustawSzablony(obci);
    try {
      localStorage.setItem(KLUCZ_SZABLONOW(hallId), JSON.stringify(obci));
    } catch {
      ustawKomunikat({ typ: "blad", t: "Nie udało się zapisać szablonu w pamięci przeglądarki." });
    }
  }

  useEffect(() => {
    try {
      ustawBrudnyPlan(JSON.stringify(plan) !== odciskZapisu.current);
    } catch {
      ustawBrudnyPlan(true);
    }
  }, [plan]);

  const dopiszDoCofnij = useCallback((stan: PlanSaliJson) => {
    stosPonow.current = [];
    ustawPonowDostepne(false);
    stosCofnij.current = [...stosCofnij.current, klonPlanuSali(stan)];
    if (stosCofnij.current.length > MAX_COFANIA) stosCofnij.current = stosCofnij.current.slice(-MAX_COFANIA);
    ustawCofnijDostepne(true);
  }, []);

  const cofnij = useCallback(() => {
    const stos = stosCofnij.current;
    if (stos.length < 1) return;
    const ostatni = stos[stos.length - 1]!;
    stosCofnij.current = stos.slice(0, -1);
    stosPonow.current = [...stosPonow.current, klonPlanuSali(planRef.current)];
    if (stosPonow.current.length > MAX_COFANIA) stosPonow.current = stosPonow.current.slice(-MAX_COFANIA);
    ustawPlan(klonPlanuSali(ostatni));
    ustawWybrany(null);
    ustawCofnijDostepne(stosCofnij.current.length > 0);
    ustawPonowDostepne(true);
  }, []);

  const ponow = useCallback(() => {
    if (stosPonow.current.length < 1) return;
    const nast = stosPonow.current[stosPonow.current.length - 1]!;
    stosPonow.current = stosPonow.current.slice(0, -1);
    stosCofnij.current = [...stosCofnij.current, klonPlanuSali(planRef.current)];
    if (stosCofnij.current.length > MAX_COFANIA) stosCofnij.current = stosCofnij.current.slice(-MAX_COFANIA);
    ustawPlan(klonPlanuSali(nast));
    ustawWybrany(null);
    ustawCofnijDostepne(true);
    ustawPonowDostepne(stosPonow.current.length > 0);
  }, []);

  const ustawElement = useCallback((id: string, patch: Partial<ElementPlanuSali>) => {
    ustawPlan((p) => ({
      ...p,
      elementy: p.elementy.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  }, []);

  const mutujZOstatnimStanie = useCallback(
    (fn: (p: PlanSaliJson) => PlanSaliJson) => {
      ustawPlan((p) => {
        dopiszDoCofnij(p);
        return fn(p);
      });
    },
    [dopiszDoCofnij]
  );

  const wyczyscStosyHistorii = useCallback(() => {
    stosCofnij.current = [];
    stosPonow.current = [];
    ustawCofnijDostepne(false);
    ustawPonowDostepne(false);
  }, []);

  const duplikujWybrany = useCallback(() => {
    const w = planRef.current;
    const idw = wybrany;
    if (!idw) return;
    const el = w.elementy.find((e) => e.id === idw);
    if (!el) return;
    const nowy: ElementPlanuSali = {
      ...el,
      id: crypto.randomUUID(),
      etykieta: el.etykieta.length < 22 ? `${el.etykieta}2` : `${el.etykieta.slice(0, 20)}2`,
      x: Math.min(100 - el.szer, el.x + 4),
      y: Math.min(70 - el.wys, el.y + 3),
    };
    mutujZOstatnimStanie((p) => ({ ...p, elementy: [...p.elementy, nowy] }));
    ustawWybrany(nowy.id);
  }, [mutujZOstatnimStanie, wybrany]);

  const wklejElementZeSchowka = useCallback(() => {
    const zrodlo = schowekElementu.current;
    if (!zrodlo) {
      ustawKomunikat({ typ: "blad", t: "Najpierw zaznacz stół i użyj Ctrl+C (kopia w schowku edytora)." });
      return;
    }
    const e: ElementPlanuSali = {
      ...structuredClone(zrodlo),
      id: crypto.randomUUID(),
      x: Math.min(100 - zrodlo.szer, zrodlo.x + 3),
      y: Math.min(70 - zrodlo.wys, zrodlo.y + 2),
    };
    mutujZOstatnimStanie((p) => ({ ...p, elementy: [...p.elementy, e] }));
    ustawWybrany(e.id);
  }, [mutujZOstatnimStanie]);

  const przywrocOstatniZapisany = useCallback(() => {
    if (!window.confirm("Odrzucić bieżące zmiany i wrócić do ostatnio zapisanego planu w tej sesji?")) return;
    mutujZOstatnimStanie(() => klonPlanuSali(ostatniZapisany.current));
    wyczyscStosyHistorii();
    ustawWybrany(null);
  }, [mutujZOstatnimStanie, wyczyscStosyHistorii]);

  const eksportujJson = useCallback(() => {
    const raw = JSON.stringify(planRef.current, null, 2);
    const blob = new Blob([raw], { type: "application/json" });
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = `plan-sali-${hallId.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    ustawKomunikat({ typ: "ok", t: "Pobrano plik planu (JSON)." });
  }, [hallId]);

  const otworzWybierzImport = useCallback(() => {
    wejscieImportu.current?.click();
  }, []);

  const obsluzPlikImportu = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      e.target.value = "";
      if (!f) return;
      const czyt = new FileReader();
      czyt.onload = () => {
        try {
          const raw = JSON.parse(String(czyt.result)) as unknown;
          const w = sprobujSparsowacPlanSali(raw);
          if (!w.ok) {
            ustawKomunikat({ typ: "blad", t: `Błąd pliku: ${w.blad}` });
            return;
          }
          mutujZOstatnimStanie(() => w.plan);
          wyczyscStosyHistorii();
          ustawWybrany(null);
          ustawKomunikat({ typ: "ok", t: "Wczytano plan z pliku." });
        } catch {
          ustawKomunikat({ typ: "blad", t: "To nie jest poprawny plik JSON." });
        }
      };
      czyt.readAsText(f);
    },
    [mutujZOstatnimStanie, wyczyscStosyHistorii]
  );

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = przeciag.current;
      if (!d) return;
      czyRuchWDrag.current = true;
      const wrap = wrapRef.current;
      if (!wrap) return;
      const r = wrap.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      ustawPlan((p) => {
        const el = p.elementy.find((x) => x.id === d.id);
        if (!el) return p;
        const dx = ((e.clientX - d.startClientX) / r.width) * 100;
        const dy = ((e.clientY - d.startClientY) / r.height) * 70;
        const nx = Math.min(100 - el.szer, Math.max(0, d.startX + dx));
        const ny = Math.min(70 - el.wys, Math.max(0, d.startY + dy));
        return {
          ...p,
          elementy: p.elementy.map((x) => (x.id === d.id ? { ...x, x: nx, y: ny } : x)),
        };
      });
    };
    const up = () => {
      if (przeciag.current) {
        if (przedPrzeciag.current && czyRuchWDrag.current) {
          stosPonow.current = [];
          ustawPonowDostepne(false);
          stosCofnij.current = [...stosCofnij.current, klonPlanuSali(przedPrzeciag.current)];
          if (stosCofnij.current.length > MAX_COFANIA) stosCofnij.current = stosCofnij.current.slice(-MAX_COFANIA);
          ustawCofnijDostepne(true);
        }
        przedPrzeciag.current = null;
        czyRuchWDrag.current = false;
        przeciag.current = null;
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).closest("input,textarea,select")) return;
      if (e.key === "Escape") {
        ustawWybrany(null);
        return;
      }
      if (e.key === "c" && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        if (wybrany) {
          const el = planRef.current.elementy.find((x) => x.id === wybrany);
          if (el) {
            e.preventDefault();
            schowekElementu.current = structuredClone(el);
            ustawKopiaWSchowkuEdytora(true);
            ustawKomunikat({ typ: "ok", t: "Skopiowano zaznaczony element (Ctrl+V wkleja kopię obok)." });
          }
        }
        return;
      }
      if (e.key === "v" && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        if (schowekElementu.current) {
          e.preventDefault();
          wklejElementZeSchowka();
        }
        return;
      }
      if (e.key === "d" && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        e.preventDefault();
        duplikujWybrany();
        return;
      }
      if ((e.key === "y" && (e.metaKey || e.ctrlKey)) || (e.key === "z" && (e.metaKey || e.ctrlKey) && e.shiftKey)) {
        e.preventDefault();
        ponow();
        return;
      }
      if (e.key === "z" && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        e.preventDefault();
        cofnij();
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && wybrany) {
        e.preventDefault();
        mutujZOstatnimStanie((p) => ({ ...p, elementy: p.elementy.filter((x) => x.id !== wybrany) }));
        ustawWybrany(null);
        return;
      }
      if (wybrany && (e.key === "[" || e.key === "]")) {
        e.preventDefault();
        const krokObr = e.shiftKey ? 15 : 5;
        const znak = e.key === "[" ? -1 : 1;
        mutujZOstatnimStanie((p) => {
          const el = p.elementy.find((x) => x.id === wybrany);
          if (!el) return p;
          const ob = ((el.obrot ?? 0) + znak * krokObr + 360) % 360;
          return { ...p, elementy: p.elementy.map((x) => (x.id === wybrany ? { ...x, obrot: ob } : x)) };
        });
        return;
      }
      if (
        wybrany &&
        (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown")
      ) {
        e.preventDefault();
        const krok = e.shiftKey ? 2 : 0.5;
        const dx = e.key === "ArrowLeft" ? -krok : e.key === "ArrowRight" ? krok : 0;
        const dy = e.key === "ArrowUp" ? -krok : e.key === "ArrowDown" ? krok : 0;
        mutujZOstatnimStanie((p) => {
          const el = p.elementy.find((x) => x.id === wybrany);
          if (!el) return p;
          const nx = Math.min(100 - el.szer, Math.max(0, el.x + dx));
          const ny = Math.min(70 - el.wys, Math.max(0, el.y + dy));
          return { ...p, elementy: p.elementy.map((x) => (x.id === wybrany ? { ...x, x: nx, y: ny } : x)) };
        });
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [wybrany, cofnij, ponow, mutujZOstatnimStanie, duplikujWybrany, wklejElementZeSchowka]);

  const usunWybrany = () => {
    if (!wybrany) return;
    mutujZOstatnimStanie((p) => ({ ...p, elementy: p.elementy.filter((e) => e.id !== wybrany) }));
    ustawWybrany(null);
  };

  const onPointerDownElement = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    const aktual = planRef.current;
    przedPrzeciag.current = klonPlanuSali(aktual);
    czyRuchWDrag.current = false;
    ustawWybrany(id);
    const el = aktual.elementy.find((x) => x.id === id);
    if (!el) return;
    przeciag.current = {
      id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: el.x,
      startY: el.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    e.preventDefault();
  };

  const zapisz = () => {
    ustawKomunikat(null);
    startTransition(async () => {
      const w = await zapiszPlanSali(hallId, planRef.current);
      if ("blad" in w) {
        ustawKomunikat({ typ: "blad", t: w.blad });
        return;
      }
      try {
        odciskZapisu.current = JSON.stringify(planRef.current);
        ostatniZapisany.current = klonPlanuSali(planRef.current);
      } catch {
        odciskZapisu.current = "";
      }
      ustawBrudnyPlan(false);
      ustawKomunikat({ typ: "ok", t: "Plan zapisany w bazie." });
    });
  };

  const wybranyEl = wybrany ? plan.elementy.find((e) => e.id === wybrany) : null;
  const cmZProcentow =
    wybranyEl != null
      ? przyblizRozmiarStoluCm(wybranyEl.szer, wybranyEl.wys, plan.szerokosc_sali_m, plan.dlugosc_sali_m)
      : null;

  const tloSiatka = {
    id: "siatka-edytor-plan" as const,
  };

  const zapiszBiezacyJakoSzablon = useCallback(() => {
    const n = nazwaSzablonu.trim();
    if (n.length < 1) {
      ustawKomunikat({ typ: "blad", t: "Podaj krótką nazwę szablonu (np. bankiet, zebranie)." });
      return;
    }
    try {
      const json = JSON.stringify(planRef.current);
      const nowy: SzablonLokalny = { id: crypto.randomUUID(), nazwa: n.slice(0, 40), json };
      const reszta = szablony.filter((s) => s.nazwa.toLowerCase() !== n.toLowerCase());
      zapiszSzablonyLokalne([nowy, ...reszta].slice(0, 8));
      ustawNazwaSzablonu("");
      ustawKomunikat({ typ: "ok", t: "Zapisano szablon w tej przeglądarce (do 8 sztuk na salę)." });
    } catch {
      ustawKomunikat({ typ: "blad", t: "Nie udało się zserializować planu." });
    }
  }, [nazwaSzablonu, szablony, hallId]);

  const wczytajSzablon = useCallback(
    (s: SzablonLokalny) => {
      try {
        const raw = JSON.parse(s.json) as unknown;
        const w = sprobujSparsowacPlanSali(raw);
        if (!w.ok) {
          ustawKomunikat({ typ: "blad", t: `Szablon uszkodzony: ${w.blad}` });
          return;
        }
        mutujZOstatnimStanie(() => w.plan);
        wyczyscStosyHistorii();
        ustawWybrany(null);
        ustawKomunikat({ typ: "ok", t: `Wczytano: ${s.nazwa}.` });
      } catch {
        ustawKomunikat({ typ: "blad", t: "Nie udało się wczytać szablonu." });
      }
    },
    [mutujZOstatnimStanie, wyczyscStosyHistorii]
  );

  const usunSzablon = useCallback(
    (id: string) => {
      zapiszSzablonyLokalne(szablony.filter((s) => s.id !== id));
    },
    [szablony, hallId]
  );

  return (
    <section className="mt-6 max-w-full overflow-x-clip rounded-xl border border-stone-200/90 bg-gradient-to-b from-white to-stone-50/90 p-4 shadow-md ring-1 ring-stone-900/[0.04] print:max-w-full print:rounded-none print:border-0 print:shadow-none print:ring-0 sm:mt-10 sm:rounded-2xl sm:p-6">
      <div className="border-b border-emerald-900/10 pb-3 sm:pb-4 print:border-0 print:pb-0">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <h2 className="font-serif text-lg leading-tight text-green-950 sm:text-2xl">Plan sali (układ stołów)</h2>
          <button
            type="button"
            onClick={() => window.print()}
            className="print:hidden w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 sm:w-auto"
          >
            Drukuj plan
          </button>
        </div>
        {pojemnoscSali != null && pojemnoscSali > 0 ? (
          <p className="mt-2 text-sm text-stone-600 print:hidden">
            Pojemność sali (dokumentacja): do <strong>{pojemnoscSali}</strong> osób. Suma miejsc w układzie:{" "}
            <strong className={przekroczonaPojemnosc ? "text-amber-800" : "text-stone-800"}>{sumaMiejsc}</strong>
            {przekroczonaPojemnosc ? " — przekroczona względem dopuszczalnej (popraw wymiary lub miejsca przy stołach)." : "."}
          </p>
        ) : (
          <p className="mt-2 text-sm text-stone-600 print:hidden">
            Suma miejsc w układzie: <strong>{sumaMiejsc}</strong> (przy braku pojemności w konfiguracji tylko informacyjnie).
          </p>
        )}
        <p className="mt-2 text-sm leading-relaxed text-stone-600 sm:mt-1.5 print:hidden">
          <span className="sm:hidden">
            Przeciągaj stoły palcem, zaznacz element, doprecyzuj wymiary w panelu. Gotowce i <strong>zapisz plan</strong> — na
            dole.{" "}
          </span>
          <span className="hidden sm:inline">
            Przeciągaj elementy, użyj <strong>gotowców</strong>, pól w panelu. W <strong>cm</strong> — do dokumentu wynajmu. Poniżej:{" "}
            <strong>Plik JSON</strong> (kopia zapasowa), skróty klawiaturowe.
          </span>
        </p>
        <details className="mt-3 max-w-2xl rounded-lg border border-stone-200/80 bg-stone-50/90 px-3 py-2.5 sm:mt-2 print:hidden" id="edytor-skroty-klaw">
          <summary className="cursor-pointer list-none text-sm font-medium text-stone-800 [&::-webkit-details-marker]:hidden">
            <span className="text-green-900 underline decoration-green-900/30 underline-offset-2">Skróty klawiatury + telefon</span>
          </summary>
          <div className="mt-2.5 space-y-2 text-xs leading-relaxed text-stone-600 sm:text-sm">
            <p>
              <strong className="text-stone-700">Klawiatura:</strong> Ctrl+Z / Y, Ctrl+C / V (kopia stołu), Ctrl+D, [ ] obrót
              (Shift szybszy krok), strzałki przesuw, Del usuwa, Esc zdejmuje zaznaczenie.{" "}
              <span className="sm:hidden">Sekcja </span>
              <span className="font-medium">Plik JSON</span> — eksport i import.
            </p>
            <p>
              <strong className="text-stone-700">Telefon:</strong> wszystko w panelu i gotowcach; przeciągnij, potem wypełnij
              wymiary sali i zapisz — skróty Ctrl służą tylko z podłączoną klawiaturą.
            </p>
          </div>
        </details>
      </div>

      {brudnyPlan ? (
        <p
          className="mt-4 flex flex-col gap-2.5 rounded-xl border border-amber-200/90 bg-amber-50/95 px-3 py-2.5 text-sm text-amber-950 ring-1 ring-amber-900/10 sm:flex-row sm:items-center sm:justify-between sm:gap-3 print:hidden"
          role="status"
        >
          <span className="min-w-0 break-words">
            <span className="font-medium">Niezapisane zmiany</span>{" "}
            <span className="text-amber-900/90">— zapisz, albo odrzuć względem ostatniego pomyślnego zapisu w tej sesji.</span>
          </span>
          <button
            type="button"
            onClick={przywrocOstatniZapisany}
            className="min-h-11 w-full touch-manipulation shrink-0 rounded-lg border border-amber-300/80 bg-white px-3 py-2.5 text-xs font-medium text-amber-950 transition hover:bg-amber-100/80 sm:min-h-0 sm:w-auto sm:px-3 sm:py-1.5"
          >
            Odrzuć edycję
          </button>
        </p>
      ) : null}

      <div className="mt-4 print:hidden">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-500">Szablony (lokalna przeglądarka)</p>
          <p className="mb-2 text-xs text-stone-600">Do 8 nazwanych wersji planu na tę salę; nie wysyłane na serwer (eksport JSON nadal służy backupowi).</p>
          <div className="flex max-w-2xl flex-col gap-2 min-[400px]:flex-row min-[400px]:items-end">
            <label className="min-w-0 grow text-xs text-stone-600">
              Nazwa
              <input
                value={nazwaSzablonu}
                onChange={(e) => ustawNazwaSzablonu(e.target.value.slice(0, 50))}
                className="mt-0.5 w-full min-h-10 rounded-lg border border-stone-300 px-2.5 py-1.5"
                placeholder="np. Zebranie KGW, bankiet"
                maxLength={50}
              />
            </label>
            <button
              type="button"
              onClick={zapiszBiezacyJakoSzablon}
              className="h-10 shrink-0 rounded-xl border border-emerald-700/20 bg-emerald-50/90 px-3 text-sm font-medium text-emerald-950"
            >
              Zapisz bieżący
            </button>
          </div>
          {szablony.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {szablony.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-0.5 rounded-lg border border-stone-200 bg-white/90 pl-1.5 text-xs"
                >
                  <button
                    type="button"
                    onClick={() => wczytajSzablon(s)}
                    className="px-1.5 py-1 font-medium text-stone-800 hover:underline"
                    title="Wczytaj w edytorze (stan możesz wycofać: cofnij w edytorze)"
                  >
                    {s.nazwa}
                  </button>
                  <button
                    type="button"
                    onClick={() => usunSzablon(s.id)}
                    className="px-1.5 py-1 text-stone-500 hover:text-red-800"
                    title="Usuń szablon"
                    aria-label={`Usuń szablon ${s.nazwa}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

      <div className="mt-4 space-y-3 sm:mt-5 sm:space-y-4 print:hidden">
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-500 sm:sr-only">Dodaj element</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => mutujZOstatnimStanie((p) => ({ ...p, elementy: [...p.elementy, nowyStol("stol_prostokatny")] }))}
              className="min-h-11 touch-manipulation rounded-xl bg-green-800 px-3.5 py-2.5 text-xs font-medium text-white shadow-sm active:bg-green-950 sm:min-h-0 sm:py-2 sm:text-sm"
            >
              + Stół prost.
            </button>
            <button
              type="button"
              onClick={() => mutujZOstatnimStanie((p) => ({ ...p, elementy: [...p.elementy, nowyStol("stol_okragly")] }))}
              className="min-h-11 touch-manipulation rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-xs font-medium active:bg-stone-100 sm:min-h-0 sm:py-2 sm:text-sm"
            >
              + Stół okr.
            </button>
            <button
              type="button"
              onClick={() => mutujZOstatnimStanie((p) => ({ ...p, elementy: [...p.elementy, nowyStol("lawka")] }))}
              className="min-h-11 touch-manipulation rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-xs font-medium active:bg-stone-100 sm:min-h-0 sm:py-2 sm:text-sm"
            >
              + Ławka
            </button>
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-500">Szybki układ</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                window.confirm("Zastąpić wszystkie elementy planu układem bankietowym (2×4 stołów)?") &&
                mutujZOstatnimStanie((p) => ({ ...p, elementy: generujBankiet2x4() }))
              }
              className="min-h-11 touch-manipulation rounded-xl border border-amber-200/90 bg-amber-50/90 px-3 py-2.5 text-xs font-medium text-amber-950 ring-1 ring-amber-900/10 active:bg-amber-100/90 sm:min-h-0 sm:py-2"
            >
              Bankiet 2×4
            </button>
            <button
              type="button"
              onClick={() =>
                window.confirm("Zastąpić plan rzędem 6 okrągłych stołów?") &&
                mutujZOstatnimStanie((p) => ({ ...p, elementy: generujRzadOkraglych(6) }))
              }
              className="min-h-11 touch-manipulation rounded-xl border border-amber-200/90 bg-amber-50/90 px-3 py-2.5 text-xs font-medium text-amber-950 ring-1 ring-amber-900/10 active:bg-amber-100/90 sm:min-h-0 sm:py-2"
            >
              Rząd ×6
            </button>
            <button
              type="button"
              onClick={() =>
                window.confirm("Dodać szkic w kształcie U (3 bloki) — obecne elementy zostaną usunięte?") &&
                mutujZOstatnimStanie((p) => ({ ...p, elementy: generujKsztaltU() }))
              }
              className="min-h-11 touch-manipulation rounded-xl border border-amber-200/90 bg-amber-50/90 px-3 py-2.5 text-xs font-medium text-amber-950 ring-1 ring-amber-900/10 active:bg-amber-100/90 sm:min-h-0 sm:py-2"
            >
              Szkic U
            </button>
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-500 sm:mb-2">Edycja</p>
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2 min-[400px]:grid-cols-4 min-[400px]:gap-1.5 sm:flex sm:flex-wrap sm:items-center">
              <button
                type="button"
                onClick={cofnij}
                disabled={!cofnijDostepne}
                className="min-h-11 touch-manipulation rounded-xl border border-stone-300 bg-white px-2 py-2.5 text-xs font-medium disabled:opacity-40 sm:min-h-0 sm:px-3 sm:py-2 sm:text-sm"
                title="Skrót: Ctrl+Z"
              >
                Cofnij
              </button>
              <button
                type="button"
                onClick={ponow}
                disabled={!ponowDostepne}
                className="min-h-11 touch-manipulation rounded-xl border border-stone-300 bg-white px-2 py-2.5 text-xs font-medium disabled:opacity-40 sm:min-h-0 sm:px-3 sm:py-2 sm:text-sm"
                title="Ctrl+Y lub Ctrl+Shift+Z"
              >
                Ponów
              </button>
              <button
                type="button"
                onClick={duplikujWybrany}
                disabled={!wybrany}
                className="min-h-11 touch-manipulation rounded-xl border border-stone-300 bg-white px-2 py-2.5 text-xs font-medium disabled:opacity-40 sm:min-h-0 sm:px-3 sm:py-2 sm:text-sm"
              >
                Duplikuj
              </button>
              <button
                type="button"
                onClick={usunWybrany}
                disabled={!wybrany}
                className="min-h-11 touch-manipulation rounded-xl border border-red-200/90 px-2 py-2.5 text-xs font-medium text-red-800 active:bg-red-50 disabled:opacity-40 sm:min-h-0 sm:px-3 sm:py-2 sm:text-sm"
              >
                Usuń
              </button>
            </div>
            <button
              type="button"
              onClick={zapisz}
              disabled={oczekuje}
              className="min-h-12 w-full touch-manipulation rounded-xl bg-gradient-to-b from-stone-800 to-stone-900 px-4 py-3 text-sm font-semibold text-white shadow-sm active:from-stone-900 active:to-stone-950 disabled:opacity-60 sm:min-h-11 sm:max-w-xs sm:py-2.5 sm:font-medium"
            >
              {oczekuje ? "Zapisywanie…" : "Zapisz plan"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 border-t border-stone-200/80 pt-3 sm:mt-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Plik JSON</p>
        <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:justify-end sm:gap-1.5">
          <button
            type="button"
            onClick={eksportujJson}
            className="min-h-11 w-full touch-manipulation rounded-xl border border-stone-300/90 bg-stone-50/90 px-3 py-2.5 text-xs font-medium text-stone-800 transition active:bg-stone-100 sm:min-h-0 sm:w-auto sm:py-2"
          >
            Pobierz (eksport)
          </button>
          <button
            type="button"
            onClick={otworzWybierzImport}
            className="min-h-11 w-full touch-manipulation rounded-xl border border-stone-300/90 bg-stone-50/90 px-3 py-2.5 text-xs font-medium text-stone-800 transition active:bg-stone-100 sm:min-h-0 sm:w-auto sm:py-2"
          >
            Wczytaj (import)…
          </button>
          <button
            type="button"
            onClick={wklejElementZeSchowka}
            disabled={!kopiaWSchowkuEdytora}
            className="min-h-11 w-full touch-manipulation rounded-xl border border-emerald-200/90 bg-emerald-50/80 px-3 py-2.5 text-xs font-medium text-emerald-900 disabled:opacity-40 sm:min-h-0 sm:w-auto sm:py-2"
            title="Działa po skopiowaniu stołu. Na klawiaturze: też Ctrl+V (poza polem tekstowym)."
          >
            Wklej kopię
          </button>
        </div>
        <input ref={wejscieImportu} type="file" accept="application/json,.json" className="hidden" onChange={obsluzPlikImportu} aria-hidden />
      </div>

      {komunikat ? (
        <p
          className={
            komunikat.typ === "ok"
              ? "mt-3 rounded-xl bg-emerald-50/90 px-3 py-2 text-sm text-emerald-950 ring-1 ring-emerald-800/10 print:hidden"
              : "mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800 print:hidden"
          }
          role="status"
        >
          {komunikat.t}
        </p>
      ) : null}

      <div className="mt-5 grid items-start gap-5 sm:gap-6 print:block lg:grid-cols-[1fr_minmax(0,320px)]">
        <div
          ref={wrapRef}
          className="relative min-w-0 overflow-hidden rounded-xl border-2 border-stone-200/80 bg-[#f7f3ea] shadow-inner sm:rounded-2xl"
          onPointerDown={() => ustawWybrany(null)}
        >
          <svg
            viewBox="0 0 100 70"
            className="aspect-[10/7] w-full touch-none select-none"
            style={{ touchAction: "none" as const }}
            role="img"
            aria-label="Płaszczyzna do układania stołów, widok z góry"
          >
            <defs>
              <pattern
                id={tloSiatka.id}
                width="5"
                height="5"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 5 0 L 0 0 0 5"
                  fill="none"
                  stroke="#c4b8a8"
                  strokeWidth="0.1"
                  opacity="0.35"
                />
              </pattern>
            </defs>
            <rect x="0" y="0" width="100" height="70" fill="#faf8f3" />
            <rect x="0" y="0" width="100" height="70" fill={`url(#${tloSiatka.id})`} />
            <rect x="0.5" y="0.5" width="99" height="69" fill="none" stroke="#2d5a2d" strokeWidth="0.45" rx="0.4" />
            {plan.szerokosc_sali_m != null && plan.dlugosc_sali_m != null ? (
              <text
                x="2"
                y="4.5"
                className="fill-stone-600"
                style={{ fontSize: "2.2px" }}
                fontWeight="500"
              >
                ≈ {plan.szerokosc_sali_m}×{plan.dlugosc_sali_m} m
              </text>
            ) : null}
            {plan.elementy.map((el) => {
              const zaznaczony = el.id === wybrany;
              const cx = el.x + el.szer / 2;
              const cy = el.y + el.wys / 2;
              const okr = el.typ === "stol_okragly";
              const hx1 = Math.max(0, el.x - SLUP_PALCA);
              const hy1 = Math.max(0, el.y - SLUP_PALCA);
              const hx2 = Math.min(100, el.x + el.szer + SLUP_PALCA);
              const hy2 = Math.min(70, el.y + el.wys + SLUP_PALCA);
              return (
                <g key={el.id} transform={`rotate(${el.obrot}, ${cx}, ${cy})`}>
                  {okr ? (
                    <>
                      <ellipse
                        cx={cx}
                        cy={cy}
                        rx={el.szer / 2 + SLUP_PALCA}
                        ry={el.wys / 2 + SLUP_PALCA}
                        fill="rgba(0,0,0,0.01)"
                        stroke="none"
                        className="cursor-grab active:cursor-grabbing"
                        onPointerDown={(ev) => onPointerDownElement(ev, el.id)}
                        style={{ touchAction: "none" }}
                      />
                      <ellipse
                        pointerEvents="none"
                        cx={cx}
                        cy={cy}
                        rx={el.szer / 2}
                        ry={el.wys / 2}
                        fill={zaznaczony ? "#a8d89a" : "#e0ecd8"}
                        stroke={zaznaczony ? "#b8860b" : "#2d5a2d"}
                        strokeWidth={zaznaczony ? 0.55 : 0.32}
                        className="pointer-events-none"
                      />
                    </>
                  ) : (
                    <>
                      <rect
                        x={hx1}
                        y={hy1}
                        width={hx2 - hx1}
                        height={hy2 - hy1}
                        fill="rgba(0,0,0,0.01)"
                        stroke="none"
                        rx="0.45"
                        className="cursor-grab active:cursor-grabbing"
                        onPointerDown={(ev) => onPointerDownElement(ev, el.id)}
                        style={{ touchAction: "none" }}
                      />
                      <rect
                        pointerEvents="none"
                        x={el.x}
                        y={el.y}
                        width={el.szer}
                        height={el.wys}
                        fill={zaznaczony ? "#a8d89a" : el.typ === "lawka" ? "#ebe5d4" : "#c8e0b8"}
                        stroke={zaznaczony ? "#b8860b" : "#2d5a2d"}
                        strokeWidth={zaznaczony ? 0.55 : 0.32}
                        rx="0.3"
                        className="pointer-events-none"
                      />
                    </>
                  )}
                  <text
                    x={cx}
                    y={cy - (el.miejsca != null && el.miejsca > 0 ? 1.2 : 0)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="2.6"
                    fill="#142818"
                    fontWeight="600"
                    pointerEvents="none"
                    style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
                  >
                    {el.etykieta}
                  </text>
                  {el.miejsca != null && el.miejsca > 0 ? (
                    <text
                      x={cx}
                      y={cy + 2.2}
                      textAnchor="middle"
                      fontSize="1.6"
                      fill="#4a5c4a"
                      pointerEvents="none"
                    >
                      {el.miejsca} os.
                    </text>
                  ) : null}
                </g>
              );
            })}
          </svg>
          <p className="border-t border-stone-200/80 bg-stone-50/80 px-2.5 py-2.5 text-left text-[11px] leading-snug text-stone-600 sm:px-3 sm:py-2.5 sm:text-center sm:text-xs sm:leading-normal print:hidden">
            <span className="sm:hidden">
              <strong>Przeciągaj</strong> palcem. Stuknij tło, by <strong>odznaczyć</strong> zaznaczony stół. Reszta edycji w
              panelu poniżej.
            </span>
            <span className="hidden sm:inline">
              <strong>Przeciągaj</strong> · klik w tło = odznacz · <strong>Del</strong> usuwa · <strong>Esc</strong> ·{" "}
              <strong>[</strong> / <strong>]</strong> obrót · strzałki = przesuw (Shift szybciej)
            </span>
          </p>
        </div>

        <div className="w-full min-w-0 space-y-4 rounded-2xl border border-stone-200/80 bg-white/90 p-3.5 text-sm shadow-sm ring-1 ring-stone-900/[0.03] print:hidden sm:sticky sm:top-4 sm:max-h-[calc(100vh-5rem)] sm:overflow-y-auto sm:self-start sm:p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-stone-500">Sala w dokumencie</p>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-stone-600">
              Szer. (m)
              <input
                type="number"
                min={0}
                step="0.1"
                value={plan.szerokosc_sali_m ?? ""}
                onChange={(e) =>
                  mutujZOstatnimStanie((p) => ({
                    ...p,
                    szerokosc_sali_m: e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
                className="mt-0.5 w-full min-h-[40px] rounded-lg border border-stone-300 px-2.5 py-1.5 transition focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-800/25"
              />
            </label>
            <label className="text-xs text-stone-600">
              Dł. (m)
              <input
                type="number"
                min={0}
                step="0.1"
                value={plan.dlugosc_sali_m ?? ""}
                onChange={(e) =>
                  mutujZOstatnimStanie((p) => ({
                    ...p,
                    dlugosc_sali_m: e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
                className="mt-0.5 w-full min-h-[40px] rounded-lg border border-stone-300 px-2.5 py-1.5 transition focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-800/25"
              />
            </label>
          </div>

          {wybranyEl ? (
            <div className="space-y-3 border-t border-stone-200 pt-3">
              <p className="font-medium text-stone-800">Zaznaczony element</p>
              <label className="block text-xs text-stone-600">
                Etykieta
                <input
                  value={wybranyEl.etykieta}
                  onChange={(e) => ustawElement(wybranyEl.id, { etykieta: e.target.value.slice(0, 24) })}
                  onFocus={() => {
                    etykietaFokusId.current = wybranyEl.id;
                    etykietaPrzedFokusem.current = klonPlanuSali(planRef.current);
                  }}
                  onBlur={() => {
                    const snap = etykietaPrzedFokusem.current;
                    const idEtyk = etykietaFokusId.current;
                    etykietaPrzedFokusem.current = null;
                    etykietaFokusId.current = null;
                    if (!snap || !idEtyk) return;
                    const bylo = snap.elementy.find((x) => x.id === idEtyk)?.etykieta;
                    const jest = planRef.current.elementy.find((x) => x.id === idEtyk)?.etykieta;
                    if (bylo !== jest) dopiszDoCofnij(snap);
                  }}
                  className="mt-0.5 w-full min-h-[40px] rounded-lg border border-stone-300 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-800/25"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-stone-600">
                  Szer. (%) planu
                  <input
                    type="number"
                    min="0.5"
                    max="80"
                    step="0.5"
                    value={Number(wybranyEl.szer.toFixed(2))}
                    onChange={(e) =>
                      mutujZOstatnimStanie((p) => ({
                        ...p,
                        elementy: p.elementy.map((x) =>
                          x.id === wybranyEl.id
                            ? { ...x, szer: Math.min(80, Math.max(0.5, Number(e.target.value) || 0.5)) }
                            : x
                        ),
                      }))
                    }
                    className="mt-0.5 w-full min-h-[40px] rounded-lg border border-stone-300 px-2 py-1"
                  />
                </label>
                <label className="text-xs text-stone-600">
                  Wys. (%) planu
                  <input
                    type="number"
                    min="0.5"
                    max="80"
                    step="0.5"
                    value={Number(wybranyEl.wys.toFixed(2))}
                    onChange={(e) =>
                      mutujZOstatnimStanie((p) => ({
                        ...p,
                        elementy: p.elementy.map((x) =>
                          x.id === wybranyEl.id
                            ? { ...x, wys: Math.min(80, Math.max(0.5, Number(e.target.value) || 0.5)) }
                            : x
                        ),
                      }))
                    }
                    className="mt-0.5 w-full min-h-[40px] rounded-lg border border-stone-300 px-2 py-1"
                  />
                </label>
              </div>
              {cmZProcentow ? (
                <p className="break-words text-[11px] leading-snug text-stone-500">
                  Przy podanych wymiarach sali: <span className="tabular-nums">≈ {cmZProcentow.szerCm}×{cmZProcentow.wysCm} cm</span> na rysunku (krawędź
                  wzdłuż szer./dł. planu, niezależne od pól w dokumencie poniżej).
                </p>
              ) : null}
              <label className="block text-xs text-stone-600">
                Obrót (°)
                <input
                  type="number"
                  min={0}
                  max={359}
                  value={wybranyEl.obrot ?? 0}
                  onChange={(e) =>
                    mutujZOstatnimStanie((p) => ({
                      ...p,
                      elementy: p.elementy.map((x) =>
                        x.id === wybranyEl.id ? { ...x, obrot: Number(e.target.value) || 0 } : x
                      ),
                    }))
                  }
                  className="mt-0.5 w-full min-h-[40px] rounded-lg border border-stone-300 px-2.5 py-1.5"
                />
              </label>
              <label className="block text-xs text-stone-600">
                Miejsca
                <input
                  type="number"
                  min={0}
                  max={500}
                  value={wybranyEl.miejsca ?? ""}
                  onChange={(e) =>
                    mutujZOstatnimStanie((p) => ({
                      ...p,
                      elementy: p.elementy.map((x) =>
                        x.id === wybranyEl.id
                          ? { ...x, miejsca: e.target.value === "" ? undefined : Number(e.target.value) }
                          : x
                      ),
                    }))
                  }
                  className="mt-0.5 w-full min-h-[40px] rounded-lg border border-stone-300 px-2.5 py-1.5"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-stone-600">
                  Szer. cm
                  <input
                    type="number"
                    min={1}
                    value={wybranyEl.szer_cm ?? ""}
                    onChange={(e) =>
                      mutujZOstatnimStanie((p) => ({
                        ...p,
                        elementy: p.elementy.map((x) =>
                          x.id === wybranyEl.id
                            ? { ...x, szer_cm: e.target.value === "" ? undefined : Number(e.target.value) }
                            : x
                        ),
                      }))
                    }
                    className="mt-0.5 w-full min-h-[40px] rounded-lg border border-stone-300 px-2 py-1"
                  />
                </label>
                <label className="text-xs text-stone-600">
                  Dł. cm
                  <input
                    type="number"
                    min={1}
                    value={wybranyEl.dl_cm ?? ""}
                    onChange={(e) =>
                      mutujZOstatnimStanie((p) => ({
                        ...p,
                        elementy: p.elementy.map((x) =>
                          x.id === wybranyEl.id
                            ? { ...x, dl_cm: e.target.value === "" ? undefined : Number(e.target.value) }
                            : x
                        ),
                      }))
                    }
                    className="mt-0.5 w-full min-h-[40px] rounded-lg border border-stone-300 px-2 py-1"
                  />
                </label>
              </div>
            </div>
          ) : (
            <p className="text-xs text-stone-500">Kliknij stół albo ławkę na planie, by zmienić etykietę, rozmiar i obrót.</p>
          )}
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-stone-200/90 bg-stone-100/50 p-3.5 print:hidden sm:p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-stone-500">Podgląd (jak u mieszkańca)</p>
        <PlanSaliRysunek plan={plan} className="mt-3 h-auto max-h-48 w-full max-w-lg sm:max-h-64" />
      </div>
    </section>
  );
}
