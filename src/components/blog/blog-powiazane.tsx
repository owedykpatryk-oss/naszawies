import Image from "next/image";
import Link from "next/link";
import type { BlogArtykulPelny } from "@/lib/blog/typy";
import { sciezkaOkladkiArtykulu } from "@/lib/images/sciezki-blog";
import { generateAltText } from "@/lib/images/generate-alt-text";

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
      <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {artykuly.map((a) => {
          const okladka = sciezkaOkladkiArtykulu(a.slug, a.coverImage);
          return (
            <li key={a.slug}>
              <Link
                href={`/blog/${a.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-xl border border-stone-200/80 bg-white/90 transition hover:border-emerald-700/30 hover:shadow-md dark:border-stone-700 dark:bg-stone-900/40"
              >
                <div className="relative aspect-[16/10] w-full bg-stone-100 dark:bg-stone-800">
                  <Image
                    src={okladka}
                    alt={generateAltText(a.title)}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-[1.02]"
                    sizes="(max-width: 640px) 100vw, 240px"
                    unoptimized={okladka.startsWith("/api/")}
                  />
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
                    {a.category.name}
                  </p>
                  <span className="mt-1 font-medium leading-snug text-green-900 group-hover:underline dark:text-green-100">
                    {a.title}
                  </span>
                  <span className="mt-2 line-clamp-2 flex-1 text-xs text-stone-600 dark:text-stone-400">
                    {a.excerpt}
                  </span>
                  <span className="mt-2 text-[10px] text-stone-500">{a.readingTime} min czytania</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
