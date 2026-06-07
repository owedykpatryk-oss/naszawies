"use client";

import { useEffect, useState } from "react";

/** Cienki pasek postępu czytania artykułu u góry widoku. */
export function BlogPasekCzytania() {
  const [postep, ustawPostep] = useState(0);

  useEffect(() => {
    function onScroll() {
      const article = document.querySelector("article");
      if (!article) return;
      const rect = article.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      const wysokosc = article.offsetHeight - window.innerHeight;
      if (wysokosc <= 0) {
        ustawPostep(100);
        return;
      }
      const y = window.scrollY - top;
      ustawPostep(Math.min(100, Math.max(0, (y / wysokosc) * 100)));
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (postep <= 0) return null;

  return (
    <div
      className="blog-pasek-czytania pointer-events-none fixed left-0 right-0 top-0 z-50 h-0.5 bg-stone-200/80 dark:bg-stone-800"
      aria-hidden
    >
      <div
        className="h-full bg-emerald-700 transition-[width] duration-150 dark:bg-emerald-500"
        style={{ width: `${postep}%` }}
      />
    </div>
  );
}
