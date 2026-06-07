import Link from "next/link";
import type { BlogKategoria, BlogArtykulPelny } from "@/lib/blog/typy";
import { BlogSpisTresci } from "@/components/blog/blog-spis-tresci";

type Props = {
  kategorie: BlogKategoria[];
  ostatnie: BlogArtykulPelny[];
  pokazSpis?: boolean;
};

export function BlogSidebar({ kategorie, ostatnie, pokazSpis = false }: Props) {
  return (
    <aside className="space-y-6 lg:sticky lg:top-6 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto">
      {pokazSpis ? <BlogSpisTresci /> : null}

      <div className="rounded-xl border border-stone-200/80 bg-white/90 p-4 dark:border-stone-700 dark:bg-stone-900/40">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Kategorie</p>
        <ul className="mt-3 space-y-2 text-sm">
          {kategorie.map((k) => (
            <li key={k.slug}>
              <Link
                href={`/blog/kategoria/${k.slug}`}
                className="font-medium text-green-900 hover:underline dark:text-green-200"
              >
                {k.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {ostatnie.length > 0 ? (
        <div className="rounded-xl border border-stone-200/80 bg-white/90 p-4 dark:border-stone-700 dark:bg-stone-900/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Ostatnie wpisy</p>
          <ul className="mt-3 space-y-2 text-sm">
            {ostatnie.slice(0, 5).map((a) => (
              <li key={a.slug}>
                <Link href={`/blog/${a.slug}`} className="text-stone-800 hover:text-green-900 dark:text-stone-200">
                  {a.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}
