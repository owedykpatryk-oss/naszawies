"use client";

import Link from "next/link";

type Krok = { id: string; label: string; href: string; gotowe: boolean };

export function SoltysOnboardingSwietlicyKlient({ kroki }: { kroki: Krok[] }) {
  const gotowe = kroki.filter((k) => k.gotowe).length;
  const procent = Math.round((gotowe / kroki.length) * 100);

  if (gotowe === kroki.length) return null;

  return (
    <section className="mb-6 rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/60 to-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-serif text-lg text-indigo-950">Checklista startu świetlicy</h2>
        <span className="text-sm font-medium text-indigo-800">{gotowe}/{kroki.length} ({procent}%)</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-indigo-100">
        <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${procent}%` }} />
      </div>
      <ul className="mt-4 space-y-2">
        {kroki.map((k) => (
          <li key={k.id} className="flex items-center gap-3 text-sm">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                k.gotowe ? "bg-emerald-600 text-white" : "border border-stone-300 bg-white text-stone-500"
              }`}
              aria-hidden
            >
              {k.gotowe ? "✓" : "○"}
            </span>
            {k.gotowe ? (
              <span className="text-stone-500 line-through">{k.label}</span>
            ) : (
              <Link href={k.href} className="font-medium text-indigo-900 underline hover:text-indigo-700">
                {k.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
