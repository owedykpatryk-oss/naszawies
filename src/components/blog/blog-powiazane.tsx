import Link from "next/link";
import type { BlogArtykulPelny } from "@/lib/blog/typy";

type Props = {
  artykuly: BlogArtykulPelny[];
};

export function BlogPowiazane({ artykuly }: Props) {
  if (!artykuly.length) return null;

  return (
    <section className="mt-10" aria-labelledby="blog-powiazane">
      <h2 id="blog-powiazane" className="font-serif text-xl text-green-950 dark:text-green-50">
        Powiązane artykuły
      </h2>
      <ul className="mt-4 space-y-3">
        {artykuly.map((a) => (
          <li key={a.slug}>
            <Link
              href={`/blog/${a.slug}`}
              className="block rounded-xl border border-stone-200/80 bg-white/90 px-4 py-3 text-sm transition hover:border-emerald-700/30 dark:border-stone-700 dark:bg-stone-900/40"
            >
              <span className="font-medium text-green-900 dark:text-green-100">{a.title}</span>
              <span className="mt-1 block text-stone-600 dark:text-stone-400">{a.excerpt.slice(0, 120)}…</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
