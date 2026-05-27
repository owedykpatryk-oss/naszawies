"use client";

import { useState } from "react";
import { LazyWidoczny } from "@/components/ui/lazy-widoczny";
import { PodgladSzablonuGrafiki } from "@/components/grafika/podglad-szablonu-grafiki";
import { TytulSekcjiWies } from "@/components/wies/tytul-sekcji-wies";
import { znajdzMotyw } from "@/lib/grafika/motywy";
import { znajdzSzablon } from "@/lib/grafika/szablony";
import type { WartosciPolGrafiki } from "@/lib/grafika/typy";

export type PlakatPubliczny = {
  id: string;
  tytul: string;
  templateId: string;
  motywId: string;
  wartosci: WartosciPolGrafiki;
  logoDataUrl?: string | null;
  backgroundDataUrl?: string | null;
  qrUrl?: string | null;
  publishedAt: string;
};

type Props = {
  plakaty: PlakatPubliczny[];
  nazwaWsi: string;
};

function MiniaturaPlakatu({ p }: { p: PlakatPubliczny }) {
  const szablon = znajdzSzablon(p.templateId);
  const motyw = znajdzMotyw(p.motywId);
  if (!szablon) return null;

  const tytul = p.wartosci.tytul?.trim() || p.wartosci.naglowek?.trim() || p.tytul;

  return (
    <div
      className="relative flex aspect-[3/4] w-full flex-col justify-end overflow-hidden rounded-lg border border-stone-200/80 p-3 shadow-sm"
      style={{
        backgroundColor: motyw.tlo,
        color: motyw.tekst,
        borderColor: motyw.ramka ?? undefined,
      }}
    >
      {p.backgroundDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.backgroundDataUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" loading="lazy" />
      ) : null}
      <div className="relative z-[1]">
        <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{szablon.tytul}</p>
        <p className="mt-1 line-clamp-3 font-serif text-sm font-semibold leading-snug">{tytul}</p>
      </div>
    </div>
  );
}

export function GaleriaPlakatowWsi({ plakaty, nazwaWsi }: Props) {
  const [otwartyId, ustawOtwartyId] = useState<string | null>(null);

  if (plakaty.length === 0) return null;

  const otwarty = plakaty.find((p) => p.id === otwartyId) ?? null;
  const szablonOtwarty = otwarty ? znajdzSzablon(otwarty.templateId) : null;
  const motywOtwarty = otwarty ? znajdzMotyw(otwarty.motywId) : null;

  return (
    <section
      id="galeria-plakatow"
      className="sekcja-poza-foldem wow-wejscie scroll-mt-24 mt-12 overflow-hidden rounded-2xl border border-emerald-900/10 bg-gradient-to-br from-white via-[#f5f9f0]/40 to-white p-5 shadow-sm ring-1 ring-stone-900/[0.02] sm:p-6"
    >
      <TytulSekcjiWies
        etykieta="Grafika sołectwa"
        tytul="Plakaty i zaproszenia"
        opis={`Materiały graficzne sołectwa ${nazwaWsi} — kliknij miniaturę, aby zobaczyć pełny podgląd.`}
      />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plakaty.map((p) => (
          <article key={p.id} className="karta-wow rounded-xl border border-stone-200/90 bg-white p-3 shadow-sm ring-1 ring-stone-900/[0.02]">
            <button type="button" className="group w-full text-left" onClick={() => ustawOtwartyId(p.id)}>
              <p className="mb-2 text-sm font-semibold text-stone-900 transition group-hover:text-green-950">{p.tytul}</p>
              <div className="overflow-hidden rounded-lg ring-1 ring-stone-200/80 transition group-hover:ring-emerald-300/60">
                <MiniaturaPlakatu p={p} />
              </div>
            </button>
            <p className="mt-2 text-[11px] text-stone-500">
              {new Date(p.publishedAt).toLocaleDateString("pl-PL", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </article>
        ))}
      </div>

      {otwarty && szablonOtwarty && motywOtwarty ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-stone-950/60 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-plakat-tytul"
          onClick={() => ustawOtwartyId(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-stone-200 bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <h3 id="modal-plakat-tytul" className="font-serif text-lg text-green-950">
                {otwarty.tytul}
              </h3>
              <button
                type="button"
                className="rounded-lg border border-stone-200 px-2 py-1 text-sm"
                onClick={() => ustawOtwartyId(null)}
              >
                Zamknij
              </button>
            </div>
            <LazyWidoczny>
              <div className="overflow-x-auto rounded-xl bg-stone-100 p-2">
                <PodgladSzablonuGrafiki
                  szablon={szablonOtwarty}
                  motyw={motywOtwarty}
                  wartosci={otwarty.wartosci}
                  logoDataUrl={otwarty.logoDataUrl}
                  backgroundDataUrl={otwarty.backgroundDataUrl}
                  qrDataUrl={otwarty.qrUrl}
                  elementId={`plakat-modal-${otwarty.id}`}
                />
              </div>
            </LazyWidoczny>
            <p className="mt-2 text-xs text-stone-500">Wydruk: Ctrl+P w przeglądarce.</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
