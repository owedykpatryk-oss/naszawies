"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { PlanCmentarzaRysunek } from "@/components/cmentarz/plan-cmentarza-rysunek";
import { filtrujGroby, type PlanCmentarzaPubliczny } from "@/lib/cmentarz/pobierz-cmentarz-publiczny";
import { zapalWirtualnyZnicz } from "@/app/(site)/panel/soltys/cmentarz/akcje-cmentarz";

type Props = {
  nazwaWsi: string;
  sciezkaWsi: string;
  plan: PlanCmentarzaPubliczny;
};

export function CmentarzPublicznyKlient({ nazwaWsi, sciezkaWsi, plan }: Props) {
  const [szukaj, ustawSzukaj] = useState("");
  const [podswietl, ustawPodswietl] = useState<string | null>(null);
  const [wybranyGrob, ustawWybranyGrob] = useState<string | null>(null);
  const [liczbaZniczy, ustawLiczbaZniczy] = useState(plan.liczbaZniczy);
  const [blad, ustawBlad] = useState("");
  const [czek, startT] = useTransition();

  const wyniki = useMemo(() => filtrujGroby(plan.groby, szukaj), [plan.groby, szukaj]);

  const urlQr = `${sciezkaWsi}/cmentarz`;

  function zapalZnicz(graveId?: string | null) {
    ustawBlad("");
    startT(async () => {
      const w = await zapalWirtualnyZnicz(plan.id, graveId);
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      if (w.liczba != null) ustawLiczbaZniczy(w.liczba);
    });
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-stone-300/80 bg-gradient-to-br from-stone-100 via-white to-stone-50 p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-stone-600">Plan cmentarza</p>
        <h1 className="mt-1 font-serif text-2xl text-stone-900">{plan.name}</h1>
        <p className="mt-2 text-sm text-stone-600">
          {nazwaWsi} — wyszukiwarka grobów, mapa kwater i rzędów.{" "}
          {plan.virtual_candles_enabled ? (
            <span>
              Zapalone wirtualne znicze: <strong>{liczbaZniczy}</strong>
            </span>
          ) : null}
        </p>
        <p className="mt-2 text-xs text-stone-500">
          Link do QR przy bramie: <code className="rounded bg-stone-200/80 px-1 break-all">{urlQr}</code>
        </p>
      </header>

      {blad ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {blad}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)]">
        <div className="rounded-2xl border border-stone-200 bg-white p-3 shadow-sm">
          <PlanCmentarzaRysunek
            plan={plan.plan_data}
            className="h-auto w-full max-h-[min(70vh,520px)]"
            podswietlId={podswietl}
            tloUrl={plan.orthophoto_enabled ? plan.podkladUrl : null}
            onElementClick={(id) => {
              ustawPodswietl(id);
              const g = plan.groby.find((gr) => gr.plan_element_id === id);
              if (g) ustawWybranyGrob(g.id);
            }}
          />
          <p className="mt-2 text-xs text-stone-500">
            {plan.orthophoto_enabled && plan.podkladUrl
              ? "Podkład ortofoto — orientacyjny (Esri World Imagery)."
              : "Kliknij grób na planie, aby zobaczyć dane w wynikach."}
          </p>
        </div>

        <aside className="space-y-4">
          <label className="block text-sm">
            <span className="font-medium text-stone-800">Szukaj</span>
            <input
              type="search"
              value={szukaj}
              onChange={(e) => ustawSzukaj(e.target.value)}
              placeholder="Nazwisko, rok, kwatera…"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </label>

          {plan.virtual_candles_enabled ? (
            <button
              type="button"
              disabled={czek}
              onClick={() => zapalZnicz(wybranyGrob)}
              className="w-full rounded-lg border border-amber-400 bg-amber-50 px-3 py-2.5 text-sm font-medium text-amber-950 hover:bg-amber-100 disabled:opacity-50"
            >
              🕯 Zapal wirtualny znicz {wybranyGrob ? "(przy wybranym grobie)" : "(ogólny)"}
            </button>
          ) : null}

          <ul className="max-h-[min(50vh,400px)] space-y-2 overflow-y-auto text-sm">
            {wyniki.length === 0 ? (
              <li className="text-stone-500">Brak wyników — spróbuj innej frazy.</li>
            ) : (
              wyniki.slice(0, 80).map((g) => (
                <li key={g.id}>
                  <button
                    type="button"
                    onClick={() => {
                      ustawWybranyGrob(g.id);
                      if (g.plan_element_id) ustawPodswietl(g.plan_element_id);
                    }}
                    className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                      wybranyGrob === g.id
                        ? "border-amber-400 bg-amber-50"
                        : "border-stone-200 bg-white hover:border-stone-300"
                    }`}
                  >
                    <p className="font-medium text-stone-900">
                      {g.nazwisko}
                      {g.imie ? `, ${g.imie}` : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-stone-600">
                      {[g.kwatera && `kwatera ${g.kwatera}`, g.rzad && `rząd ${g.rzad}`, g.numer_gravu && `nr ${g.numer_gravu}`]
                        .filter(Boolean)
                        .join(" · ")}
                      {g.rok_urodzenia || g.rok_smierci
                        ? ` · ${g.rok_urodzenia ?? "?"}–${g.rok_smierci ?? "?"}`
                        : null}
                    </p>
                  </button>
                </li>
              ))
            )}
          </ul>
        </aside>
      </div>

      <p className="text-center text-sm">
        <Link href={sciezkaWsi} className="text-green-800 underline">
          ← Profil wsi {nazwaWsi}
        </Link>
      </p>
    </div>
  );
}
