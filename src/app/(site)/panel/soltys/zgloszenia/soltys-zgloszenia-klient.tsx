"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { oznaczPismoDoGminyWyslane, zaktualizujZgloszenieSoltys } from "../akcje-zgloszenia";
import { etykietkiSzybkich, etykietaStanuZgloszenia, kategorieZgloszen } from "@/lib/zgloszenia/szybkie-etykiety";
import { SZABLONY_ODPOWIEDZI_ZGLOSZEN } from "@/lib/zgloszenia/szablony-odpowiedzi";
import { EksportZgloszenPdf } from "@/components/panel/eksport-zgloszen-pdf";

export type WierszZgloszenia = {
  id: string;
  village_id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  is_urgent: boolean;
  created_at: string;
  observed_at: string | null;
  location_text: string | null;
  image_urls: string[] | null;
  quick_flags: Record<string, unknown> | null;
  resolution_note: string | null;
  wies_nazwa: string;
  gmina_nazwa: string;
  gmina_letter_sent_at: string | null;
  gmina_letter_status: string | null;
  zglaszajacy: string;
};

function linkPismoDoGminy(r: WierszZgloszenia): string {
  const params = new URLSearchParams({
    preset: "pismo-drogowa-usterka",
    wies: r.wies_nazwa,
    gmina: r.gmina_nazwa,
    droga: r.title,
    usterka: r.description.slice(0, 1200),
    lokalizacja: r.location_text ?? r.wies_nazwa,
  });
  return `/panel/soltys/dokumenty?${params.toString()}`;
}

type Props = { wiersze: WierszZgloszenia[] };

const statusyAkcje: { v: "w_trakcie" | "rozwiazane" | "odrzucone"; label: string }[] = [
  { v: "w_trakcie", label: "W trakcie" },
  { v: "rozwiazane", label: "Rozwiązane" },
  { v: "odrzucone", label: "Odrzucone" },
];

function etykietKat(c: string) {
  return kategorieZgloszen.find((x) => x.value === c)?.label ?? c;
}

type FiltrStatusu = "otwarte" | "wszystkie" | "nowe" | "w_trakcie" | "rozwiazane" | "odrzucone";

export function SoltysZgloszeniaKlient({ wiersze: poczatkowe }: Props) {
  const router = useRouter();
  const [blad, ustawBlad] = useState("");
  const [czeka, startT] = useTransition();
  const [filtrStatus, ustawFiltrStatus] = useState<FiltrStatusu>("otwarte");
  const [filtrWies, ustawFiltrWies] = useState("");
  const [tylkoPilne, ustawTylkoPilne] = useState(false);
  const [szukaj, ustawSzukaj] = useState("");

  const wiesOpcje = useMemo(() => Array.from(new Set(poczatkowe.map((r) => r.wies_nazwa))).sort(), [poczatkowe]);

  const widoczne = useMemo(() => {
    const q = szukaj.trim().toLowerCase();
    return poczatkowe.filter((r) => {
      if (filtrWies && r.wies_nazwa !== filtrWies) return false;
      if (tylkoPilne && !r.is_urgent) return false;
      if (filtrStatus === "otwarte" && !["nowe", "w_trakcie"].includes(r.status)) return false;
      if (filtrStatus !== "otwarte" && filtrStatus !== "wszystkie" && r.status !== filtrStatus) return false;
      if (q && !r.title.toLowerCase().includes(q) && !r.description.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [poczatkowe, filtrStatus, filtrWies, tylkoPilne, szukaj]);

  const liczbaOtwartych = useMemo(
    () => poczatkowe.filter((r) => ["nowe", "w_trakcie"].includes(r.status)).length,
    [poczatkowe],
  );

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-stone-200 bg-stone-50/80 p-3 text-sm">
        <span className="text-xs font-medium text-stone-600">
          Otwarte: <strong className="text-green-900">{liczbaOtwartych}</strong> / {poczatkowe.length}
        </span>
        <EksportZgloszenPdf
          wiersze={widoczne.map((r) => ({
            title: r.title,
            wies_nazwa: r.wies_nazwa,
            category: r.category,
            status: r.status,
            is_urgent: r.is_urgent,
            created_at: r.created_at,
            description: r.description,
          }))}
          tytulRaportu={`Zgłoszenia (${filtrStatus === "otwarte" ? "otwarte" : filtrStatus})`}
        />
        <select
          value={filtrStatus}
          onChange={(e) => ustawFiltrStatus(e.target.value as FiltrStatusu)}
          className="rounded-lg border border-stone-300 px-2 py-1 text-xs"
        >
          <option value="otwarte">Tylko otwarte (nowe + w trakcie)</option>
          <option value="wszystkie">Wszystkie statusy</option>
          <option value="nowe">Nowe</option>
          <option value="w_trakcie">W trakcie</option>
          <option value="rozwiazane">Rozwiązane</option>
          <option value="odrzucone">Odrzucone</option>
        </select>
        <select
          value={filtrWies}
          onChange={(e) => ustawFiltrWies(e.target.value)}
          className="rounded-lg border border-stone-300 px-2 py-1 text-xs"
        >
          <option value="">Wszystkie wsie</option>
          {wiesOpcje.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-xs">
          <input type="checkbox" checked={tylkoPilne} onChange={(e) => ustawTylkoPilne(e.target.checked)} />
          Tylko pilne
        </label>
        <input
          type="search"
          value={szukaj}
          onChange={(e) => ustawSzukaj(e.target.value)}
          placeholder="Szukaj w tytule lub opisie…"
          className="min-w-[10rem] flex-1 rounded-lg border border-stone-300 px-2 py-1 text-xs"
        />
      </div>

      {blad ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {blad}
        </p>
      ) : null}
      {poczatkowe.length === 0 ? (
        <p className="text-sm text-stone-600">Brak zgłoszeń w Twoich sołectwach.</p>
      ) : null}
      {widoczne.length === 0 && poczatkowe.length > 0 ? (
        <p className="text-sm text-stone-500">Brak zgłoszeń pasujących do filtrów.</p>
      ) : null}
      <ul className="space-y-6">
        {widoczne.map((r) => (
          <Wiersz
            key={r.id}
            r={r}
            ustawBlad={ustawBlad}
            czeka={czeka}
            startT={startT}
            onOk={() => router.refresh()}
          />
        ))}
      </ul>
    </div>
  );
}

function Wiersz({
  r,
  ustawBlad,
  czeka,
  startT,
  onOk,
}: {
  r: WierszZgloszenia;
  ustawBlad: (s: string) => void;
  czeka: boolean;
  startT: (c: () => void) => void;
  onOk: () => void;
}) {
  const [notatka, ustawNotatke] = useState(r.resolution_note ?? "");
  const duplikat = Boolean(
    r.quick_flags && typeof r.quick_flags === "object" && (r.quick_flags as Record<string, unknown>).mozliwy_duplikat,
  );
  return (
    <li className="panel-karta !p-4">
      {duplikat ? (
        <p className="mb-2 rounded-lg bg-amber-50 px-2 py-1 text-xs font-medium text-amber-950 ring-1 ring-amber-200">
          Możliwy duplikat — podobny tytuł w ostatnich 14 dniach
        </p>
      ) : null}
      <p className="text-xs text-stone-500">
        {r.wies_nazwa} · {etykietKat(r.category)} · wysłano {new Date(r.created_at).toLocaleString("pl-PL")} · status:{" "}
        {etykietaStanuZgloszenia(r.status)}
      </p>
      <p className="mt-1 text-xs text-stone-800">
        Zgłasza: <strong>{r.zglaszajacy}</strong> (dane tylko dla sołtysa)
      </p>
      <p className="mt-2 font-medium text-stone-900">
        {r.is_urgent ? <span className="text-amber-800">[pilne] </span> : null}
        {r.title}
      </p>
      <p className="mt-1 text-sm text-stone-800 whitespace-pre-wrap">{r.description}</p>
      {r.location_text ? <p className="mt-1 text-sm">Miejsce: {r.location_text}</p> : null}
      {r.observed_at ? (
        <p className="mt-1 text-xs text-stone-600">
          Zauważono: {new Date(r.observed_at).toLocaleString("pl-PL")} (wg zgłaszającego)
        </p>
      ) : null}
      {etykietkiSzybkich(r.quick_flags).length > 0 ? (
        <p className="mt-1 text-xs text-stone-600">Oznaczenia: {etykietkiSzybkich(r.quick_flags).join(" · ")}</p>
      ) : null}
      {r.image_urls && r.image_urls.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {r.image_urls.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="block">
              <img src={url} alt="" className="h-24 w-24 rounded border border-stone-200 object-cover" />
            </a>
          ))}
        </div>
      ) : null}
      {r.resolution_note && r.status === "rozwiazane" ? (
        <p className="mt-2 text-sm text-stone-600">Poprzednia notatka: {r.resolution_note}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-sky-100 bg-sky-50/60 px-3 py-2 text-xs">
        <Link
          href={linkPismoDoGminy(r)}
          className="font-medium text-green-900 underline decoration-green-800/40"
        >
          Przygotuj pismo do gminy (PDF)
        </Link>
        {r.gmina_letter_status === "sent" || r.gmina_letter_sent_at ? (
          <span className="text-stone-600">
            Wysłano do gminy: {r.gmina_letter_sent_at ? new Date(r.gmina_letter_sent_at).toLocaleDateString("pl-PL") : "tak"}
          </span>
        ) : (
          <button
            type="button"
            disabled={czeka}
            className="rounded border border-stone-300 bg-white px-2 py-0.5 hover:bg-stone-50"
            onClick={() => {
              startT(async () => {
                const w = await oznaczPismoDoGminyWyslane(r.id);
                if ("blad" in w) ustawBlad(w.blad);
                else onOk();
              });
            }}
          >
            Oznacz jako wysłane
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-stone-100 pt-4 sm:flex-row sm:items-end sm:flex-wrap">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-stone-600">Szablony</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {SZABLONY_ODPOWIEDZI_ZGLOSZEN.map((s) => (
              <button
                key={s.id}
                type="button"
                className="rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-[11px] hover:bg-stone-100"
                onClick={() => ustawNotatke(s.body)}
              >
                {s.label}
              </button>
            ))}
          </div>
          <label className="mt-2 block text-xs text-stone-600" htmlFor={`notatka-${r.id}`}>
            Uwaga publiczna po „Rozwiązane”
          </label>
          <textarea
            id={`notatka-${r.id}`}
            value={notatka}
            onChange={(e) => ustawNotatke(e.target.value)}
            rows={2}
            className="mt-1 w-full max-w-lg rounded border border-stone-300 px-2 py-1.5 text-sm"
            maxLength={2000}
            placeholder="np. zgłoszono do gminy, naprawa w terminie, odrzucenie — powód"
          />
        </div>
        {statusyAkcje.map((s) => (
            <button
              key={s.v}
              type="button"
              disabled={czeka || r.status === s.v}
              onClick={() => {
                ustawBlad("");
                startT(async () => {
                  const w = await zaktualizujZgloszenieSoltys({
                    issueId: r.id,
                    status: s.v,
                    resolutionNote: notatka.trim() || null,
                  });
                  if ("blad" in w) {
                    ustawBlad(w.blad);
                    return;
                  }
                  onOk();
                });
              }}
              className={
                s.v === "odrzucone"
                  ? "rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-900 hover:bg-red-100 disabled:opacity-50"
                  : "rounded-lg border border-stone-300 bg-stone-50 px-3 py-1.5 text-sm text-stone-800 hover:bg-stone-100 disabled:opacity-50"
              }
            >
              Oznacz: {s.label}
            </button>
          ))}
      </div>
    </li>
  );
}
