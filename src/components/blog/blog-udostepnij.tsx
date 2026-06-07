"use client";

type Props = {
  tytul: string;
  url: string;
};

export function BlogUdostepnij({ tytul, url }: Props) {
  const pelny = typeof window !== "undefined" ? `${window.location.origin}${url}` : url;

  async function kopiuj() {
    try {
      await navigator.clipboard.writeText(pelny);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
        Udostępnij
      </span>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pelny)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg border border-stone-200 px-2.5 py-1 text-xs text-stone-700 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800"
      >
        Facebook
      </a>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tytul)}&url=${encodeURIComponent(pelny)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg border border-stone-200 px-2.5 py-1 text-xs text-stone-700 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800"
      >
        X
      </a>
      <button
        type="button"
        onClick={() => void kopiuj()}
        className="rounded-lg border border-stone-200 px-2.5 py-1 text-xs text-stone-700 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800"
      >
        Kopiuj link
      </button>
    </div>
  );
}
