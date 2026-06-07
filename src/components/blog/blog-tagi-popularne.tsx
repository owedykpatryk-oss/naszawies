import Link from "next/link";

type Props = {
  tagi: { nazwa: string; slug: string; liczba: number }[];
};

export function BlogTagiPopularne({ tagi }: Props) {
  if (tagi.length === 0) return null;

  return (
    <div className="rounded-xl border border-stone-200/80 bg-white/90 p-4 dark:border-stone-700 dark:bg-stone-900/40">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Popularne tagi</p>
      <p className="mt-3 flex flex-wrap gap-2">
        {tagi.map((t) => (
          <Link
            key={t.slug}
            href={`/blog/tag/${encodeURIComponent(t.slug)}`}
            className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-700 hover:bg-emerald-100 hover:text-green-900 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-emerald-950 dark:hover:text-green-200"
          >
            #{t.nazwa}
            <span className="ml-1 opacity-60">({t.liczba})</span>
          </Link>
        ))}
      </p>
    </div>
  );
}
