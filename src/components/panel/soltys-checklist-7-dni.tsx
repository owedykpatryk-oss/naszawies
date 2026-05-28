"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ChecklistSoltys7Dni } from "@/lib/panel/checklist-soltys-7-dni";

const KLUCZ = "naszawies_checklist_soltys_ukryj";

type Props = { checklist: ChecklistSoltys7Dni };

export function SoltysChecklist7Dni({ checklist }: Props) {
  const [ukryty, ustawUkryty] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(KLUCZ) === "1") ustawUkryty(true);
    } catch {
      /* ignore */
    }
  }, []);

  if (checklist.lacznie === 0 || checklist.ukonczone === checklist.lacznie || ukryty) {
    return null;
  }

  const procent = Math.round((checklist.ukonczone / checklist.lacznie) * 100);

  return (
    <section className="mb-8 rounded-2xl border border-violet-200/70 bg-gradient-to-br from-violet-50/80 via-white to-emerald-50/30 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-800">Pierwsze 7 dni</p>
          <h2 className="mt-1 font-serif text-xl text-green-950">Checklista startu sołtysa</h2>
          <p className="mt-1 text-sm text-stone-600">
            {checklist.ukonczone} z {checklist.lacznie} kroków · {procent}%
          </p>
          <div
            className="mt-2 h-2 max-w-md overflow-hidden rounded-full bg-stone-200"
            role="progressbar"
            aria-valuenow={procent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full rounded-full bg-violet-600 transition-[width]" style={{ width: `${procent}%` }} />
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            try {
              sessionStorage.setItem(KLUCZ, "1");
            } catch {
              /* ignore */
            }
            ustawUkryty(true);
          }}
          className="text-xs text-stone-500 underline"
        >
          Schowaj w tej sesji
        </button>
      </div>
      <ol className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {checklist.kroki.map((k) => (
          <li
            key={k.id}
            className={`rounded-xl border px-3 py-2.5 text-sm ${k.ok ? "border-emerald-200 bg-emerald-50/60" : "border-amber-200/80 bg-white"}`}
          >
            <p className="font-medium text-green-950">
              {k.ok ? "✓ " : ""}
              {k.tytul}
            </p>
            <p className="mt-0.5 text-xs text-stone-600">{k.opis}</p>
            {!k.ok ? (
              <Link href={k.href} className="mt-1.5 inline-block text-xs font-medium text-green-800 underline">
                Dokończ →
              </Link>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
