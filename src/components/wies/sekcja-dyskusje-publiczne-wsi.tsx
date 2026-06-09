import Link from "next/link";
import { OslonaSekcjiWies } from "@/components/wies/oslona-sekcji-wies";
import { TytulSekcjiWies } from "@/components/wies/tytul-sekcji-wies";
import { UjawnijPoPrzewinieciu } from "@/components/ui/ujawnij-po-przewinieciu";
import type { WatekDyskusjiPubliczny } from "@/lib/wies/pobierz-dyskusje-publiczne-wsi";

type Props = {
  watki: WatekDyskusjiPubliczny[];
  nazwaWsi: string;
  zalogowany: boolean;
};

function skroc(tekst: string, max = 220): string {
  const t = tekst.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

export function SekcjaDyskusjePubliczneWsi({ watki, nazwaWsi, zalogowany }: Props) {
  if (watki.length === 0) return null;

  return (
    <OslonaSekcjiWies id="sekcja-dyskusje-publiczne" className="wies-sekcja-dyskusje">
      <UjawnijPoPrzewinieciu as="section">
        <TytulSekcjiWies
          etykieta="Społeczność"
          tytul="Dyskusje mieszkańców"
          opis={`Publiczny podgląd wątków z panelu społeczności ${nazwaWsi}.`}
        />

        <ul className="mt-5 space-y-3">
          {watki.map((w, i) => (
            <UjawnijPoPrzewinieciu key={w.id} opoznienieMs={i * 80}>
              <li>
                <Link
                  href={`/panel/mieszkaniec/spolecznosc?threadId=${encodeURIComponent(w.id)}`}
                  className="dyskusja-karta-wow block rounded-xl border border-sky-200/70 bg-gradient-to-br from-sky-50/50 via-white to-emerald-50/30 p-4 shadow-sm transition hover:border-sky-300 hover:shadow-md"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="inline-flex rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-900">
                        {w.category}
                      </p>
                      <h3 className="mt-2 font-medium text-green-950">{w.title}</h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-stone-600">{skroc(w.body)}</p>
                    </div>
                    <div className="shrink-0 text-right text-xs text-stone-500">
                      <p className="font-medium text-stone-700">{w.authorLabel}</p>
                      <p>{new Date(w.createdAt).toLocaleDateString("pl-PL")}</p>
                      <p className="mt-1 font-semibold text-sky-900">
                        {w.commentCount} {w.commentCount === 1 ? "odpowiedź" : "odpowiedzi"}
                        {w.voteScore !== 0 ? ` · ${w.voteScore > 0 ? "+" : ""}${w.voteScore}` : ""}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs font-medium text-sky-900">Otwórz wątek w panelu →</p>
                </Link>
              </li>
            </UjawnijPoPrzewinieciu>
          ))}
        </ul>

        <p className="mt-4 text-sm text-stone-600">
          {zalogowany ? (
            <>
              Pełna dyskusja i nowe wątki — w{" "}
              <Link href="/panel/mieszkaniec/spolecznosc" className="font-medium text-green-800 underline">
                panelu społeczności
              </Link>
              . Przy tworzeniu wątku zaznacz „Pokaż na profilu wsi”, aby był widoczny tutaj.
            </>
          ) : (
            <>
              <Link href="/logowanie" className="font-medium text-green-800 underline">
                Zaloguj się jako mieszkaniec
              </Link>
              , aby dołączyć do dyskusji w panelu społeczności.
            </>
          )}
        </p>
      </UjawnijPoPrzewinieciu>
    </OslonaSekcjiWies>
  );
}
