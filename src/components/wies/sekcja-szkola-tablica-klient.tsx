"use client";

import { useMemo, useState } from "react";
import {
  AUDIENCJE_OGLOSZEN_SZKOLY,
  ETYKIETY_AUDIENCJI_SZKOLY,
  type AudiencjaOgloszeniaSzkoly,
  type OgloszenieSzkolyPubliczne,
} from "@/lib/szkola/teksty-szkoly";
import { filtrujOgloszeniaSzkolyDlaAudiencji } from "@/lib/szkola/pobierz-ogloszenia-szkoly";

type Filtr = AudiencjaOgloszeniaSzkoly | "wszystkie";

const OPCJE_FILTRA: { wartosc: Filtr; etykieta: string }[] = [
  { wartosc: "wszystkie", etykieta: "Wszystkie" },
  ...AUDIENCJE_OGLOSZEN_SZKOLY.map((k) => ({
    wartosc: k,
    etykieta: ETYKIETY_AUDIENCJI_SZKOLY[k],
  })),
];

type Props = {
  ogloszenia: OgloszenieSzkolyPubliczne[];
  nazwaSzkoly: string;
};

export function SekcjaSzkolaTablicaKlient({ ogloszenia, nazwaSzkoly }: Props) {
  const [filtr, ustawFiltr] = useState<Filtr>("wszystkie");
  const [klasa, ustawKlasa] = useState("");

  const widoczne = useMemo(
    () => filtrujOgloszeniaSzkolyDlaAudiencji(ogloszenia, filtr, klasa),
    [ogloszenia, filtr, klasa],
  );

  const przypiete = widoczne.filter((o) => o.is_pinned);
  const reszta = widoczne.filter((o) => !o.is_pinned);

  return (
    <div className="mt-6">
      <div className="tablica-szkoly-pasek">
        <div className="tablica-szkoly-naglowek">
          <span className="text-lg leading-none" aria-hidden>
            📋
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-lg text-sky-950">Tablica ogłoszeń</h3>
            <p className="text-xs text-stone-600">
              {ogloszenia.length === 0
                ? `Brak wpisów — ${nazwaSzkoly}`
                : `${widoczne.length} z ${ogloszenia.length} ogłoszeń`}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div
            className="tablica-szkoly-filtry -mx-1 flex gap-1.5 overflow-x-auto overscroll-x-contain px-1 pb-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] max-sm:flex-nowrap sm:flex-wrap"
            role="group"
            aria-label="Filtr ogłoszeń"
          >
            {OPCJE_FILTRA.map((op) => (
              <button
                key={op.wartosc}
                type="button"
                onClick={() => ustawFiltr(op.wartosc)}
                className={`shrink-0 min-h-[40px] rounded-full border px-2.5 py-1.5 text-xs font-medium transition ${
                  filtr === op.wartosc
                    ? "border-sky-700 bg-sky-800 text-white shadow-sm"
                    : "border-sky-200/90 bg-white text-sky-950 hover:border-sky-400 hover:bg-sky-50"
                }`}
              >
                {op.etykieta}
              </button>
            ))}
          </div>
          {filtr === "klasa" ? (
            <label className="block w-full min-w-0 text-sm sm:w-28">
              <span className="font-medium text-stone-700">Klasa</span>
              <input
                className="form-control mt-1 w-full sm:w-24"
                placeholder="np. 5a"
                value={klasa}
                onChange={(e) => ustawKlasa(e.target.value)}
              />
            </label>
          ) : null}
        </div>
      </div>

      {ogloszenia.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-sky-200/80 bg-sky-50/30 px-4 py-6 text-center text-sm text-stone-500">
          Brak ogłoszeń na tablicy {nazwaSzkoly}. Sołtys lub szkoła mogą je dodać w panelu „Szkoła”.
        </p>
      ) : widoczne.length === 0 ? (
        <p className="mt-4 text-sm text-stone-500">Brak ogłoszeń dla wybranego filtra.</p>
      ) : (
        <div className="mt-4 space-y-6">
          {przypiete.length > 0 ? (
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-800/90">
                Przypięte
              </p>
              <ul className="space-y-3">
                {przypiete.map((o) => (
                  <li key={o.id}>
                    <KartaOgloszenia o={o} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {reszta.length > 0 ? (
            <ul className="space-y-3">
              {reszta.map((o) => (
                <li key={o.id}>
                  <KartaOgloszenia o={o} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  );
}

function KartaOgloszenia({ o }: { o: OgloszenieSzkolyPubliczne }) {
  const [rozwin, ustawRozwin] = useState(false);
  const dlugi = (o.body?.length ?? 0) > 280;
  const etykieta =
    o.audience === "klasa" && o.class_label
      ? `Klasa ${o.class_label}`
      : ETYKIETY_AUDIENCJI_SZKOLY[o.audience];

  return (
    <article
      id={`ogl-szkola-${o.id}`}
      className={`tablica-ogloszenie-karta scroll-mt-32 pl-3.5 sm:pl-4 ${
        o.is_pinned ? "tablica-ogloszenie-karta--przypieta border-amber-300/75" : "border-stone-200/90"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h4 className="font-semibold text-stone-900">{o.title}</h4>
        <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-semibold text-sky-900 ring-1 ring-sky-200/80">
          {o.is_pinned ? "📌 " : ""}
          {etykieta}
        </span>
      </div>
      {o.body ? (
        <div className="mt-2">
          <p className={`whitespace-pre-wrap text-sm leading-relaxed text-stone-700 ${!rozwin && dlugi ? "line-clamp-4" : ""}`}>
            {o.body}
          </p>
          {dlugi ? (
            <button
              type="button"
              className="mt-1.5 text-xs font-semibold text-sky-800 underline decoration-sky-300/80 underline-offset-2"
              onClick={() => ustawRozwin((v) => !v)}
            >
              {rozwin ? "Zwiń" : "Czytaj więcej"}
            </button>
          ) : null}
        </div>
      ) : null}
      <p className="mt-2.5 text-xs text-stone-500">
        {new Date(o.published_at).toLocaleDateString("pl-PL", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
        {o.valid_until
          ? ` · ważne do ${new Date(o.valid_until).toLocaleDateString("pl-PL")}`
          : null}
      </p>
      {o.attachment_url ? (
        <p className="mt-2">
          <a
            href={o.attachment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[40px] items-center gap-1 text-sm font-medium text-sky-800 underline"
          >
            Załącznik / dokument
          </a>
        </p>
      ) : null}
    </article>
  );
}
