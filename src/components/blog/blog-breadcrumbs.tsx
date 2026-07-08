import Link from "next/link";
import type { Okruszek } from "@/lib/seo/generate-breadcrumbs";

type Props = {
  okruszki: Okruszek[];
};

export function BlogBreadcrumbs({ okruszki }: Props) {
  return (
    <nav aria-label="Ścieżka nawigacji" className="mb-6 text-sm text-stone-600 dark:text-stone-400">
      <ol className="flex flex-wrap items-center gap-1.5">
        {okruszki.map((o, i) => {
          const ostatni = i === okruszki.length - 1 || !o.href;
          return (
            <li key={`${o.nazwa}-${i}`} className="flex items-center gap-1.5">
              {i > 0 ? <span aria-hidden className="text-stone-400">/</span> : null}
              {ostatni ? (
                <span className="min-w-0 break-words font-medium text-green-950 dark:text-green-100" aria-current="page">
                  {o.nazwa}
                </span>
              ) : (
                <Link
                  href={o.href}
                  className="font-medium text-green-800 underline decoration-emerald-600/30 underline-offset-2 hover:decoration-emerald-700 dark:text-green-300"
                >
                  {o.nazwa}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
