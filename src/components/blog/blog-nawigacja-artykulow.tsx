import Link from "next/link";
import type { BlogArtykulPelny } from "@/lib/blog/typy";

type Props = {
  nowszy: BlogArtykulPelny | null;
  starszy: BlogArtykulPelny | null;
};

export function BlogNawigacjaArtykulow({ nowszy, starszy }: Props) {
  if (!nowszy && !starszy) return null;

  return (
    <nav
      className="mt-10 grid gap-4 border-t border-stone-200 pt-8 dark:border-stone-700 sm:grid-cols-2"
      aria-label="Nawigacja między artykułami"
    >
      {starszy ? (
        <Link
          href={`/blog/${starszy.slug}`}
          className="group rounded-xl border border-stone-200/80 bg-white/90 p-4 transition hover:border-emerald-700/30 dark:border-stone-700 dark:bg-stone-900/40"
        >
          <span className="text-xs font-medium uppercase tracking-wide text-stone-500">← Starszy</span>
          <span className="mt-1 block font-medium text-green-900 group-hover:underline dark:text-green-100">
            {starszy.title}
          </span>
        </Link>
      ) : (
        <div />
      )}
      {nowszy ? (
        <Link
          href={`/blog/${nowszy.slug}`}
          className="group rounded-xl border border-stone-200/80 bg-white/90 p-4 text-right transition hover:border-emerald-700/30 dark:border-stone-700 dark:bg-stone-900/40 sm:col-start-2"
        >
          <span className="text-xs font-medium uppercase tracking-wide text-stone-500">Nowszy →</span>
          <span className="mt-1 block font-medium text-green-900 group-hover:underline dark:text-green-100">
            {nowszy.title}
          </span>
        </Link>
      ) : null}
    </nav>
  );
}
