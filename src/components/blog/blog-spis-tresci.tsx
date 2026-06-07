"use client";

import { useEffect, useState } from "react";

type Pozycja = { id: string; tekst: string };

type Props = {
  selektorKontenera?: string;
};

export function BlogSpisTresci({ selektorKontenera = ".blog-tresc-artykulu" }: Props) {
  const [pozycje, ustawPozycje] = useState<Pozycja[]>([]);

  useEffect(() => {
    const kontener = document.querySelector(selektorKontenera);
    if (!kontener) return;
    const naglowki = kontener.querySelectorAll("h2[id], h3[id]");
    const lista: Pozycja[] = [];
    naglowki.forEach((el) => {
      const id = el.id;
      if (id) lista.push({ id, tekst: el.textContent?.trim() ?? id });
    });
    ustawPozycje(lista);
  }, [selektorKontenera]);

  if (pozycje.length < 2) return null;

  return (
    <nav
      aria-label="Spis treści"
      className="rounded-xl border border-stone-200/80 bg-stone-50/80 p-4 dark:border-stone-700 dark:bg-stone-900/50"
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
        Spis treści
      </p>
      <ol className="space-y-1.5 text-sm">
        {pozycje.map((p) => (
          <li key={p.id}>
            <a
              href={`#${p.id}`}
              className="text-green-900 underline decoration-emerald-700/30 underline-offset-2 hover:decoration-emerald-700 dark:text-green-200"
            >
              {p.tekst}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
