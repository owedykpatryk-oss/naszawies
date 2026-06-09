import Image from "next/image";
import Link from "next/link";
import type { BlogArtykulPelny } from "@/lib/blog/typy";
import { sciezkaOkladkiArtykulu } from "@/lib/images/sciezki-blog";
import { generateAltText } from "@/lib/images/generate-alt-text";

type Props = {
  artykul: BlogArtykulPelny;
  featured?: boolean;
};

export function BlogKartaArtykulu({ artykul, featured = false }: Props) {
  const okladka = sciezkaOkladkiArtykulu(artykul.slug, artykul.coverImage);
  const alt = generateAltText(artykul.title);

  return (
    <article
      className={
        featured
          ? "group relative overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm ring-1 ring-stone-900/[0.03] transition hover:shadow-md dark:border-stone-700 dark:bg-stone-900/60 md:col-span-2 md:grid md:grid-cols-2"
          : "group overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm ring-1 ring-stone-900/[0.03] transition hover:shadow-md dark:border-stone-700 dark:bg-stone-900/60"
      }
    >
      <Link href={`/blog/${artykul.slug}`} className={featured ? "relative block min-h-[200px] md:min-h-full" : "relative block aspect-[16/9]"}>
        <Image
          src={okladka}
          alt={alt}
          fill
          className="object-cover transition duration-300 group-hover:scale-[1.02]"
          sizes={featured ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 100vw, 33vw"}
          unoptimized={okladka.startsWith("/api/")}
        />
        <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
          {artykul.readingTime} min
        </span>
        {artykul.featured ? (
          <span className="absolute left-3 top-3 rounded-full bg-green-800/90 px-2.5 py-0.5 text-xs font-medium text-white">
            Wyróżnione
          </span>
        ) : null}
      </Link>
      <div className="flex flex-col p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
          <Link href={`/blog/kategoria/${artykul.category.slug}`}>{artykul.category.name}</Link>
        </p>
        <h2 className="mt-1 font-serif text-lg leading-snug text-green-950 dark:text-green-50">
          <Link href={`/blog/${artykul.slug}`} className="hover:underline">
            {artykul.title}
          </Link>
        </h2>
        <p className="mt-2 line-clamp-3 flex-1 text-sm text-stone-600 dark:text-stone-400">{artykul.excerpt}</p>
        <p className="mt-3 text-xs text-stone-500 dark:text-stone-500">
          {artykul.author.name} · {artykul.readingTime} min czytania ·{" "}
          {new Date(artykul.publishedAt).toLocaleDateString("pl-PL", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>
    </article>
  );
}
