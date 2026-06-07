import Link from "next/link";

type Props = {
  strona: number;
  liczbaStron: number;
  zapytanie?: string;
  kategoria?: string;
};

function hrefStrony(nr: number, zapytanie?: string, kategoria?: string) {
  const p = new URLSearchParams();
  if (zapytanie) p.set("q", zapytanie);
  if (kategoria) p.set("kategoria", kategoria);
  if (nr > 1) p.set("strona", String(nr));
  const q = p.toString();
  return q ? `/blog?${q}` : "/blog";
}

export function BlogPaginacja({ strona, liczbaStron, zapytanie, kategoria }: Props) {
  if (liczbaStron <= 1) return null;

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Paginacja bloga">
      {strona > 1 ? (
        <Link
          href={hrefStrony(strona - 1, zapytanie, kategoria)}
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800"
        >
          ← Poprzednia
        </Link>
      ) : null}
      <span className="px-2 text-sm text-stone-600 dark:text-stone-400">
        Strona {strona} z {liczbaStron}
      </span>
      {strona < liczbaStron ? (
        <Link
          href={hrefStrony(strona + 1, zapytanie, kategoria)}
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800"
        >
          Następna →
        </Link>
      ) : null}
    </nav>
  );
}
