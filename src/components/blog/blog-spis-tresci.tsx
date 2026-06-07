"use client";

import { useEffect, useState } from "react";

type Pozycja = { id: string; tekst: string; poziom: 2 | 3 };

type Props = {
  selektorKontenera?: string;
};

export function BlogSpisTresci({ selektorKontenera = ".blog-tresc-artykulu" }: Props) {
  const [pozycje, ustawPozycje] = useState<Pozycja[]>([]);
  const [aktywny, ustawAktywny] = useState<string | null>(null);

  useEffect(() => {
    const kontener = document.querySelector(selektorKontenera);
    if (!kontener) return;

    const naglowki = kontener.querySelectorAll("h2[id], h3[id]");
    const lista: Pozycja[] = [];
    naglowki.forEach((el) => {
      const id = el.id;
      if (!id) return;
      lista.push({
        id,
        tekst: el.textContent?.trim() ?? id,
        poziom: el.tagName === "H3" ? 3 : 2,
      });
    });
    ustawPozycje(lista);

    const obserwowane = Array.from(naglowki) as HTMLElement[];
    if (!obserwowane.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const widoczne = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (widoczne[0]?.target.id) ustawAktywny(widoczne[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: [0, 0.25, 0.5] },
    );

    for (const el of obserwowane) observer.observe(el);
    return () => observer.disconnect();
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
          <li key={p.id} className={p.poziom === 3 ? "pl-3" : undefined}>
            <a
              href={`#${p.id}`}
              className={
                aktywny === p.id
                  ? "font-medium text-green-900 underline decoration-emerald-600 dark:text-green-200"
                  : "text-stone-700 underline decoration-emerald-700/20 underline-offset-2 hover:text-green-900 hover:decoration-emerald-700 dark:text-stone-300 dark:hover:text-green-200"
              }
            >
              {p.tekst}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
