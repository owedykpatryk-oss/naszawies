"use client";

import { PodgladSzablonuGrafiki } from "@/components/grafika/podglad-szablonu-grafiki";
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

export function GaleriaPlakatowWsi({ plakaty, nazwaWsi }: Props) {
  if (plakaty.length === 0) return null;

  return (
    <section id="galeria-plakatow" className="scroll-mt-24 mt-12 rounded-2xl border border-green-900/10 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="font-serif text-2xl text-green-950">Plakaty i zaproszenia</h2>
      <p className="mt-1 text-sm text-stone-600">
        Oficjalne materiały graficzne sołectwa {nazwaWsi} — możesz je wydrukować lub zapisać (PDF z podglądu
        przeglądarki: Ctrl+P).
      </p>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {plakaty.map((p) => {
          const szablon = znajdzSzablon(p.templateId);
          const motyw = znajdzMotyw(p.motywId);
          if (!szablon) return null;
          return (
            <article key={p.id} className="rounded-xl border border-stone-200 bg-stone-50/80 p-3">
              <p className="mb-2 text-sm font-semibold text-stone-900">{p.tytul}</p>
              <div className="overflow-x-auto">
                <PodgladSzablonuGrafiki
                  szablon={szablon}
                  motyw={motyw}
                  wartosci={p.wartosci}
                  logoDataUrl={p.logoDataUrl}
                  backgroundDataUrl={p.backgroundDataUrl}
                  qrDataUrl={p.qrUrl}
                  elementId={`plakat-publiczny-${p.id}`}
                />
              </div>
              <p className="mt-2 text-[11px] text-stone-500">
                Opublikowano:{" "}
                {new Date(p.publishedAt).toLocaleDateString("pl-PL", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
