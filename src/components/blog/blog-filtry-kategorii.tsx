import Link from "next/link";
import type { BlogKategoria } from "@/lib/blog/typy";

type Props = {
  kategorie: BlogKategoria[];
  aktywna?: string;
};

export function BlogFiltryKategorii({ kategorie, aktywna }: Props) {
  return (
    <nav aria-label="Filtruj po kategorii" className="mt-4 flex flex-wrap gap-2">
      <Link
        href="/blog"
        className={
          !aktywna
            ? "rounded-full bg-green-800 px-3 py-1.5 text-sm font-medium text-white"
            : "rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
        }
      >
        Wszystkie
      </Link>
      {kategorie.map((k) => {
        const active = aktywna === k.slug;
        return (
          <Link
            key={k.slug}
            href={`/blog/kategoria/${k.slug}`}
            className={
              active
                ? "rounded-full bg-green-800 px-3 py-1.5 text-sm font-medium text-white"
                : "rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            }
          >
            {k.name}
          </Link>
        );
      })}
    </nav>
  );
}
