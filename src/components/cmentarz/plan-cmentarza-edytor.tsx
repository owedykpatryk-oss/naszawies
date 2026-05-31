"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  dodajRekordGrobu,
  importujGrobyCsv,
  importujObrysCmentarzaZOsm,
  zapiszPlanCmentarza,
  zatwierdzGrobyCsv,
} from "@/app/(site)/panel/soltys/cmentarz/akcje-cmentarz";
import { PlanCmentarzaRysunek } from "@/components/cmentarz/plan-cmentarza-rysunek";
import {
  etykietaTypuElementuCmentarza,
  klonPlanuCmentarza,
  nowyElementCmentarza,
  szablonPlanuCmentarzaStartowy,
  typyElementuPlanuCmentarza,
  type PlanCmentarzaJson,
  type TypElementuPlanuCmentarza,
} from "@/lib/cmentarz/plan-cmentarza";
import { kafelkiSatelitarne } from "@/lib/cmentarz/podklad-satelitarny";
import { ograniczElementDoObszaru } from "@/lib/swietlica/mapowanie-rzutu-plan";

type Props = {
  planId: string;
  nazwaPoczatkowa: string;
  poczatkowyPlan: PlanCmentarzaJson;
  opublikowany: boolean;
  zniczeWlaczone: boolean;
  ortofotoWlaczone: boolean;
  maObrys: boolean;
  centroidLat?: number | null;
  centroidLng?: number | null;
  sciezkaPubliczna: string;
  oczekujaceCsv: number;
};

const OBSZAR = { x: 0, y: 0, w: 100, h: 70 };

export function PlanCmentarzaEdytor({
  planId,
  nazwaPoczatkowa,
  poczatkowyPlan,
  opublikowany,
  zniczeWlaczone,
  ortofotoWlaczone,
  maObrys,
  centroidLat,
  centroidLng,
  sciezkaPubliczna,
  oczekujaceCsv,
}: Props) {
  const router = useRouter();
  const [plan, ustawPlan] = useState(() => klonPlanuCmentarza(poczatkowyPlan));
  const [nazwa, ustawNazwa] = useState(nazwaPoczatkowa);
  const [publikuj, ustawPublikuj] = useState(opublikowany);
  const [znicze, ustawZnicze] = useState(zniczeWlaczone);
  const [ortofoto, ustawOrtofoto] = useState(ortofotoWlaczone);
  const [wybrany, ustawWybrany] = useState<string | null>(null);
  const [komunikat, ustawKomunikat] = useState("");
  const [blad, ustawBlad] = useState("");
  const [czek, startT] = useTransition();

  const wrapRef = useRef<HTMLDivElement>(null);
  const planRef = useRef(plan);
  planRef.current = plan;
  const przeciag = useRef<{
    id: string;
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
  } | null>(null);
  const zmianaRozmiaru = useRef<{
    id: string;
    startClientX: number;
    startClientY: number;
    startSzer: number;
    startWys: number;
  } | null>(null);

  const wybranyEl = plan.elementy.find((e) => e.id === wybrany) ?? null;

  const kafelki = useMemo(() => {
    if (!ortofoto || centroidLat == null || centroidLng == null) return [];
    return kafelkiSatelitarne(centroidLat, centroidLng, 18, 1);
  }, [ortofoto, centroidLat, centroidLng]);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = przeciag.current;
      const r = zmianaRozmiaru.current;
      const wrap = wrapRef.current;
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;

      if (d) {
        const dx = ((e.clientX - d.startClientX) / rect.width) * 100;
        const dy = ((e.clientY - d.startClientY) / rect.height) * 70;
        ustawPlan((p) => {
          const el = p.elementy.find((x) => x.id === d.id);
          if (!el) return p;
          const pos = ograniczElementDoObszaru(
            { x: d.startX + dx, y: d.startY + dy, szer: el.szer, wys: el.wys },
            OBSZAR,
          );
          return {
            ...p,
            elementy: p.elementy.map((x) => (x.id === d.id ? { ...x, x: pos.x, y: pos.y } : x)),
          };
        });
        return;
      }

      if (r) {
        const dx = ((e.clientX - r.startClientX) / rect.width) * 100;
        const dy = ((e.clientY - r.startClientY) / rect.height) * 70;
        ustawPlan((p) => ({
          ...p,
          elementy: p.elementy.map((x) => {
            if (x.id !== r.id) return x;
            const szer = Math.min(100 - x.x, Math.max(1.5, r.startSzer + dx));
            const wys = Math.min(70 - x.y, Math.max(1, r.startWys + dy));
            return { ...x, szer, wys };
          }),
        }));
      }
    };

    const up = () => {
      przeciag.current = null;
      zmianaRozmiaru.current = null;
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
      if (!wybrany) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        usunWybrany();
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        const krok = e.shiftKey ? 2 : 0.5;
        const dx = e.key === "ArrowLeft" ? -krok : e.key === "ArrowRight" ? krok : 0;
        const dy = e.key === "ArrowUp" ? -krok : e.key === "ArrowDown" ? krok : 0;
        ustawPlan((p) => ({
          ...p,
          elementy: p.elementy.map((x) => {
            if (x.id !== wybrany) return x;
            const pos = ograniczElementDoObszaru(
              { x: x.x + dx, y: x.y + dy, szer: x.szer, wys: x.wys },
              OBSZAR,
            );
            return { ...x, x: pos.x, y: pos.y };
          }),
        }));
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [wybrany]);

  function zapisz() {
    ustawBlad("");
    ustawKomunikat("");
    startT(async () => {
      const w = await zapiszPlanCmentarza(planId, planRef.current, {
        name: nazwa,
        is_published: publikuj,
        virtual_candles_enabled: znicze,
        orthophoto_enabled: ortofoto,
      });
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawKomunikat("Zapisano plan cmentarza.");
      router.refresh();
    });
  }

  function dodaj(typ: TypElementuPlanuCmentarza) {
    const el = nowyElementCmentarza(typ);
    ustawPlan((p) => ({ ...p, elementy: [...p.elementy, el] }));
    ustawWybrany(el.id);
  }

  function usunWybrany() {
    if (!wybrany) return;
    ustawPlan((p) => ({ ...p, elementy: p.elementy.filter((e) => e.id !== wybrany) }));
    ustawWybrany(null);
  }

  function aktualizujWybrany(
    pola: Partial<{ etykieta: string; x: number; y: number; szer: number; wys: number; obrot: number }>,
  ) {
    if (!wybrany) return;
    ustawPlan((p) => ({
      ...p,
      elementy: p.elementy.map((e) => (e.id === wybrany ? { ...e, ...pola } : e)),
    }));
  }

  function onPointerDownElement(e: React.PointerEvent, id: string) {
    e.stopPropagation();
    ustawWybrany(id);
    const el = planRef.current.elementy.find((x) => x.id === id);
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
  }

  function onPointerDownResize(e: React.PointerEvent, id: string) {
    ustawWybrany(id);
    const el = planRef.current.elementy.find((x) => x.id === id);
    if (!el) return;
    zmianaRozmiaru.current = {
      id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startSzer: el.szer,
      startWys: el.wys,
    };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    e.preventDefault();
  }

  return (
    <section className="space-y-5 rounded-2xl border border-stone-300 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl text-stone-900">Edytor planu cmentarza</h2>
          <p className="mt-1 text-sm text-stone-600">
            Przeciągaj kwatery i groby na planie (jak stoły w świetlicy). Publicznie:{" "}
            <a href={`${sciezkaPubliczna}/cmentarz`} target="_blank" rel="noopener noreferrer" className="underline">
              {sciezkaPubliczna}/cmentarz
            </a>
          </p>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-xs text-stone-600 sm:text-sm">
            <li>Import obrysu z OSM, włącz <strong>podkład satelitarny</strong> (Esri — jak Google Maps).</li>
            <li><strong>Przeciągnij</strong> elementy; uchwyt w rogu zmienia rozmiar; strzałki przesuwaj wybrany.</li>
            <li>Zapisz plan — mieszkańcy zobaczą go z wyszukiwarką grobów.</li>
          </ol>
        </div>
        <button
          type="button"
          disabled={czek}
          onClick={zapisz}
          className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-900 disabled:opacity-50"
        >
          {czek ? "Zapisuję…" : "Zapisz plan"}
        </button>
      </div>

      {komunikat ? <p className="text-sm text-green-800">{komunikat}</p> : null}
      {blad ? (
        <p className="text-sm text-red-800" role="alert">
          {blad}
        </p>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-sm">
          Nazwa
          <input
            value={nazwa}
            onChange={(e) => ustawNazwa(e.target.value)}
            className="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <div className="flex flex-wrap items-end gap-4 text-sm">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={publikuj} onChange={(e) => ustawPublikuj(e.target.checked)} />
            Opublikowany
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={znicze} onChange={(e) => ustawZnicze(e.target.checked)} />
            Znicze wirtualne
          </label>
          <label className="inline-flex items-center gap-2" title="Esri World Imagery — widok satelitarny">
            <input type="checkbox" checked={ortofoto} onChange={(e) => ustawOrtofoto(e.target.checked)} />
            Podkład satelitarny
          </label>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={czek}
          onClick={() => {
            startT(async () => {
              const w = await importujObrysCmentarzaZOsm(planId);
              if ("blad" in w) ustawBlad(w.blad);
              else {
                ustawKomunikat(w.nazwa ? `Zaimportowano obrys: ${w.nazwa}` : "Zaimportowano obrys z OSM.");
                router.refresh();
              }
            });
          }}
          className="rounded-lg border border-stone-400 bg-stone-50 px-3 py-1.5 text-xs font-medium"
        >
          {maObrys ? "Odśwież obrys z OSM" : "Import obrysu z OSM"}
        </button>
        <button
          type="button"
          onClick={() => ustawPlan(szablonPlanuCmentarzaStartowy())}
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs"
        >
          Szablon startowy
        </button>
        {oczekujaceCsv > 0 ? (
          <button
            type="button"
            disabled={czek}
            onClick={() => {
              startT(async () => {
                const w = await zatwierdzGrobyCsv(planId);
                if ("blad" in w) ustawBlad(w.blad);
                else {
                  ustawKomunikat(`Zatwierdzono ${w.zatwierdzono ?? 0} rekordów z CSV.`);
                  router.refresh();
                }
              });
            }}
            className="rounded-lg border border-amber-400 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-950"
          >
            Zatwierdź CSV ({oczekujaceCsv})
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {typyElementuPlanuCmentarza.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => dodaj(t)}
            className="rounded-md border border-stone-200 bg-stone-50 px-2 py-1 text-xs hover:bg-stone-100"
          >
            + {etykietaTypuElementuCmentarza(t)}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
        <div
          ref={wrapRef}
          className="relative overflow-hidden rounded-xl border-2 border-stone-200/80 bg-[#f7f3ea] shadow-inner"
          onPointerDown={() => ustawWybrany(null)}
        >
          <PlanCmentarzaRysunek
            plan={plan}
            className="aspect-[10/7] w-full touch-none select-none"
            podswietlId={wybrany}
            kafelkiSatelitarne={kafelki}
            tloOpacity={0.62}
            trybEdycji
            onElementClick={ustawWybrany}
            onPointerDownElement={onPointerDownElement}
            onPointerDownResize={onPointerDownResize}
          />
        </div>
        <div className="space-y-3 text-sm">
          {wybranyEl ? (
            <>
              <p className="font-medium">{etykietaTypuElementuCmentarza(wybranyEl.typ)}</p>
              <label className="block">
                Etykieta
                <input
                  value={wybranyEl.etykieta}
                  onChange={(e) => aktualizujWybrany({ etykieta: e.target.value })}
                  className="mt-1 w-full rounded border border-stone-300 px-2 py-1 text-sm"
                />
              </label>
              {(["x", "y", "szer", "wys"] as const).map((k) => (
                <label key={k} className="block">
                  {k}
                  <input
                    type="number"
                    step="0.5"
                    value={wybranyEl[k]}
                    onChange={(e) => aktualizujWybrany({ [k]: Number(e.target.value) })}
                    className="mt-1 w-full rounded border border-stone-300 px-2 py-1 text-sm"
                  />
                </label>
              ))}
              <label className="block">
                Obrót (°)
                <input
                  type="number"
                  step="5"
                  min={0}
                  max={359}
                  value={wybranyEl.obrot ?? 0}
                  onChange={(e) => aktualizujWybrany({ obrot: Number(e.target.value) })}
                  className="mt-1 w-full rounded border border-stone-300 px-2 py-1 text-sm"
                />
              </label>
              <button type="button" onClick={usunWybrany} className="text-xs text-red-700 underline">
                Usuń element (Del)
              </button>
            </>
          ) : (
            <p className="text-stone-500">Kliknij lub przeciągnij element na planie. Puste tło — kliknij poza elementy.</p>
          )}
        </div>
      </div>

      <details className="rounded-lg border border-stone-200 p-3 text-sm">
        <summary className="cursor-pointer font-medium">Dodaj grób ręcznie / import CSV</summary>
        <form
          className="mt-3 grid gap-2 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            startT(async () => {
              const w = await dodajRekordGrobu({
                cemeteryPlanId: planId,
                nazwisko: String(fd.get("nazwisko") ?? ""),
                imie: String(fd.get("imie") ?? "") || null,
                kwatera: String(fd.get("kwatera") ?? "") || null,
                rzad: String(fd.get("rzad") ?? "") || null,
                numer_gravu: String(fd.get("numer") ?? "") || null,
                rok_urodzenia: fd.get("urodz") ? Number(fd.get("urodz")) : null,
                rok_smierci: fd.get("smierc") ? Number(fd.get("smierc")) : null,
                plan_element_id: wybranyEl?.typ === "grob" ? wybranyEl.id : null,
              });
              if ("blad" in w) ustawBlad(w.blad);
              else {
                ustawKomunikat("Dodano rekord grobu.");
                e.currentTarget.reset();
                router.refresh();
              }
            });
          }}
        >
          <input name="nazwisko" required placeholder="Nazwisko *" className="rounded border px-2 py-1.5" />
          <input name="imie" placeholder="Imię" className="rounded border px-2 py-1.5" />
          <input name="kwatera" placeholder="Kwatera" className="rounded border px-2 py-1.5" />
          <input name="rzad" placeholder="Rząd" className="rounded border px-2 py-1.5" />
          <input name="numer" placeholder="Nr grobu" className="rounded border px-2 py-1.5" />
          <input name="urodz" placeholder="Rok ur." className="rounded border px-2 py-1.5" />
          <input name="smierc" placeholder="Rok śm." className="rounded border px-2 py-1.5" />
          <button type="submit" className="md:col-span-2 rounded bg-stone-700 px-3 py-2 text-white">
            Dodaj do ewidencji
          </button>
        </form>
        <label className="mt-4 block">
          Import CSV (kolumny: nazwisko, imie, kwatera, rzad, urodzenie, śmierć) — status „oczekuje” do zatwierdzenia
          <textarea
            name="csv"
            rows={4}
            className="mt-1 w-full rounded border border-stone-300 px-2 py-1 font-mono text-xs"
            placeholder="nazwisko;imie;kwatera;rzad;urodzenie;śmierć&#10;Kowalski;Jan;I;3;1920;1998"
            onBlur={(e) => {
              const tekst = e.target.value.trim();
              if (!tekst) return;
              startT(async () => {
                const w = await importujGrobyCsv(planId, tekst);
                if ("blad" in w) ustawBlad(w.blad);
                else {
                  ustawKomunikat(`Zaimportowano ${w.dodano ?? 0} wierszy (oczekują na zatwierdzenie).`);
                  e.target.value = "";
                  router.refresh();
                }
              });
            }}
          />
        </label>
      </details>
    </section>
  );
}
