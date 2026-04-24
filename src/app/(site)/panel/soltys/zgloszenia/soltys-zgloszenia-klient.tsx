"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { zaktualizujZgloszenieSoltys } from "../akcje-zgloszenia";
import { etykietkiSzybkich, etykietaStanuZgloszenia, kategorieZgloszen } from "@/lib/zgloszenia/szybkie-etykiety";

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
  zglaszajacy: string;
};

type Props = { wiersze: WierszZgloszenia[] };

const statusyAkcje: { v: "w_trakcie" | "rozwiazane" | "odrzucone"; label: string }[] = [
  { v: "w_trakcie", label: "W trakcie" },
  { v: "rozwiazane", label: "Rozwiązane" },
  { v: "odrzucone", label: "Odrzucone" },
];

function etykietKat(c: string) {
  return kategorieZgloszen.find((x) => x.value === c)?.label ?? c;
}

export function SoltysZgloszeniaKlient({ wiersze: poczatkowe }: Props) {
  const router = useRouter();
  const [blad, ustawBlad] = useState("");
  const [czeka, startT] = useTransition();

  return (
    <div className="mt-6 space-y-4">
      {blad ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {blad}
        </p>
      ) : null}
      {poczatkowe.length === 0 ? (
        <p className="text-sm text-stone-600">Brak zgłoszeń w Twoich sołectwach.</p>
      ) : null}
      <ul className="space-y-6">
        {poczatkowe.map((r) => (
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
  return (
    <li className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
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

      <div className="mt-4 flex flex-col gap-3 border-t border-stone-100 pt-4 sm:flex-row sm:items-end sm:flex-wrap">
        <div className="min-w-0 flex-1">
          <label className="block text-xs text-stone-600" htmlFor={`notatka-${r.id}`}>
            Uwaga / odpowiedź dla kroniki (opcjonalnie)
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
