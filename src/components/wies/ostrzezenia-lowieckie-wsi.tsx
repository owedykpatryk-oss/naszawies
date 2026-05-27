import type { OstrzezenieLowieckie } from "@/lib/lowiectwo/pobierz-ostrzezenia-publiczne";
import { OslonaSekcjiWies } from "@/components/wies/oslona-sekcji-wies";

function formatujZakres(start: string, end: string): string {
  const fmt = new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "short" });
  return `${fmt.format(new Date(start))} – ${fmt.format(new Date(end))}`;
}

export function OstrzezeniaLowieckieWsi({ ostrzezenia, nazwaWsi }: { ostrzezenia: OstrzezenieLowieckie[]; nazwaWsi: string }) {
  if (ostrzezenia.length === 0) return null;

  return (
    <OslonaSekcjiWies id="ostrzezenia-lowieckie">
      <div className="wow-wejscie overflow-hidden rounded-2xl border-2 border-amber-500/90 bg-gradient-to-br from-amber-50 via-white to-orange-50/40 p-5 shadow-md ring-1 ring-amber-400/30 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-wide text-amber-900">Uwaga — polowania</p>
        <h2 className="mt-1 font-serif text-xl text-amber-950">Informacja dla mieszkańców i gości</h2>
        <p className="mt-2 text-sm text-amber-950/90">
          W rejonie {nazwaWsi} prowadzone są polowania. Prosimy o ostrożność i unikanie oznaczonych terenów w podanym czasie.
        </p>
        <ul className="mt-4 space-y-4">
          {ostrzezenia.map((o) => (
            <li key={o.id} className="rounded-xl border border-amber-300/60 bg-white/80 p-4">
              <p className="font-semibold text-stone-900">{o.title}</p>
              <p className="mt-1 text-sm text-stone-700">
                <span className="font-medium">Rejon:</span> {o.areaDescription}
              </p>
              <p className="mt-1 text-xs text-stone-600">{formatujZakres(o.startsAt, o.endsAt)}</p>
              {o.safetyNote ? <p className="mt-2 text-sm text-amber-900">{o.safetyNote}</p> : null}
              {o.contactPhone || o.contactName ? (
                <p className="mt-2 text-xs text-stone-600">
                  Kontakt: {o.contactName ? `${o.contactName}` : ""}
                  {o.contactPhone ? ` · tel. ${o.contactPhone}` : ""}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-stone-500">
          Informacja ma charakter społeczny. Przestrzegaj przepisów prawa i znaków na terenie. W razie wątpliwości skontaktuj się z
          kołem łowieckim lub sołtysem.
        </p>
      </div>
    </OslonaSekcjiWies>
  );
}
