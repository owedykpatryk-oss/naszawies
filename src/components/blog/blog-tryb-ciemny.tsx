"use client";

import { useEffect, useState } from "react";

const KLUCZ = "naszawies-blog-theme";

export function BlogTrybCiemny() {
  const [ciemny, ustawCiemny] = useState(false);

  useEffect(() => {
    const zapisany = localStorage.getItem(KLUCZ);
    const preferuje = zapisany === "dark" || (!zapisany && window.matchMedia("(prefers-color-scheme: dark)").matches);
    ustawCiemny(preferuje);
    document.documentElement.classList.toggle("dark", preferuje);
  }, []);

  function przelacz() {
    const nowy = !ciemny;
    ustawCiemny(nowy);
    document.documentElement.classList.toggle("dark", nowy);
    localStorage.setItem(KLUCZ, nowy ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={przelacz}
      className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800"
      aria-label={ciemny ? "Włącz jasny motyw" : "Włącz ciemny motyw"}
    >
      {ciemny ? "☀ Jasny" : "☾ Ciemny"}
    </button>
  );
}
