"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export function BlogWyszukiwarka() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, ustawQ] = useState(params.get("q") ?? "");

  useEffect(() => {
    ustawQ(params.get("q") ?? "");
  }, [params]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const zapytanie = q.trim();
    if (zapytanie.length < 2) {
      router.push("/blog");
      return;
    }
    router.push(`/blog?q=${encodeURIComponent(zapytanie)}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-2" role="search">
      <label htmlFor="blog-szukaj" className="sr-only">
        Szukaj na blogu
      </label>
      <input
        id="blog-szukaj"
        type="search"
        value={q}
        onChange={(e) => ustawQ(e.target.value)}
        placeholder="Szukaj artykułów…"
        className="min-h-[44px] flex-1 rounded-xl border border-stone-300 bg-white px-3 text-stone-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-800/20 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
      />
      <button
        type="submit"
        className="min-h-[44px] shrink-0 rounded-xl bg-green-800 px-4 text-sm font-medium text-white hover:bg-green-900"
      >
        Szukaj
      </button>
    </form>
  );
}
