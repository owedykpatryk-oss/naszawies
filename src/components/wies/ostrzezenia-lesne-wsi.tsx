import Link from "next/link";
import { linkChroniony } from "@/lib/auth/sciezki-chronione";
import {
  etykietaRodzajuOstrzezenia,
  ikonaRodzajuOstrzezenia,
} from "@/lib/lesnictwo/kategorie-ostrzezen";
import type { OstrzezenieLesne } from "@/lib/lesnictwo/pobierz-ostrzezenia-publiczne";
import { OslonaSekcjiWies } from "@/components/wies/oslona-sekcji-wies";

function formatujZakres(start: string, end: string): string {
  const fmt = new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "short" });
  return `${fmt.format(new Date(start))} – ${fmt.format(new Date(end))}`;
}

export function OstrzezeniaLesneWsi({
  ostrzezenia,
  nazwaWsi,
  sciezkaWsi,
  zalogowany = false,
}: {
  ostrzezenia: OstrzezenieLesne[];
  nazwaWsi: string;
  sciezkaWsi: string;
  zalogowany?: boolean;
}) {
  if (ostrzezenia.length === 0) return null;

  return (
    <OslonaSekcjiWies id="ostrzezenia-lesne">
      <div className="wow-wejscie overflow-hidden rounded-2xl border-2 border-emerald-700/80 bg-gradient-to-br from-emerald-50 via-white to-lime-50/50 p-5 shadow-md ring-1 ring-emerald-600/25 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-900">Uwaga — las i leśnictwo</p>
        <h2 className="mt-1 font-serif text-xl text-emerald-950">Informacja dla mieszkańców i turystów</h2>
        <p className="mt-2 text-sm text-emerald-950/90">
          W rejonie {nazwaWsi} obowiązują poniższe ostrzeżenia leśne (zakazy wstępu, wycinki, prace leśne itd.).
          {" "}
          <Link href={`${sciezkaWsi}/lesnictwo`} className="font-medium underline hover:text-emerald-950">
            Pełny profil leśnictwa →
          </Link>
        </p>
        <ul className="mt-4 space-y-4">
          {ostrzezenia.map((o) => (
            <li key={o.id} className="rounded-xl border border-emerald-300/70 bg-white/85 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                {ikonaRodzajuOstrzezenia(o.noticeKind)} {etykietaRodzajuOstrzezenia(o.noticeKind)}
              </p>
              <p className="mt-1 font-semibold text-stone-900">{o.title}</p>
              <p className="mt-1 text-sm text-stone-700">
                <span className="font-medium">Rejon:</span> {o.areaDescription}
              </p>
              <p className="mt-1 text-xs text-stone-600">{formatujZakres(o.startsAt, o.endsAt)}</p>
              {o.safetyNote ? <p className="mt-2 text-sm text-emerald-900">{o.safetyNote}</p> : null}
              {o.contactPhone || o.contactName ? (
                <p className="mt-2 text-xs text-stone-600">
                  Kontakt: {o.contactName ? `${o.contactName}` : ""}
                  {o.contactPhone ? ` · tel. ${o.contactPhone}` : ""}
                </p>
              ) : null}
              {o.maObszarMapy ? (
                <p className="mt-2">
                  <Link
                    href={linkChroniony("/mapa", zalogowany, `?les=${encodeURIComponent(o.id)}`)}
                    className="text-sm font-medium text-emerald-900 underline hover:text-emerald-950"
                  >
                    Zobacz obszar na mapie →
                  </Link>
                </p>
              ) : null}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-stone-500">
          Informacja ma charakter społeczny i orientacyjny. Przestrzegaj znaków na terenie i poleceń służb (LP, OSP, policja).
        </p>
      </div>
    </OslonaSekcjiWies>
  );
}
