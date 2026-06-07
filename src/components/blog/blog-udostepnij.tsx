"use client";

import { useEffect, useState } from "react";

type Props = {
  tytul: string;
  url: string;
};

export function BlogUdostepnij({ tytul, url }: Props) {
  const [skopiowano, ustawSkopiowano] = useState(false);
  const [maShare, ustawMaShare] = useState(false);
  const pelny = typeof window !== "undefined" ? `${window.location.origin}${url}` : url;

  useEffect(() => {
    ustawMaShare(typeof navigator.share === "function");
  }, []);

  async function kopiuj() {
    try {
      await navigator.clipboard.writeText(pelny);
      ustawSkopiowano(true);
      window.setTimeout(() => ustawSkopiowano(false), 2000);
    } catch {
      /* ignore */
    }
  }

  async function udostepnijNatywnie() {
    if (!navigator.share) return;
    try {
      await navigator.share({ title: tytul, url: pelny });
    } catch {
      /* anulowano */
    }
  }

  const klasaPrzycisku =
    "rounded-lg border border-stone-200 px-2.5 py-1 text-xs text-stone-700 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
        Udostępnij
      </span>
      {maShare ? (
        <button type="button" onClick={() => void udostepnijNatywnie()} className={klasaPrzycisku}>
          Udostępnij…
        </button>
      ) : null}
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pelny)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={klasaPrzycisku}
      >
        Facebook
      </a>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(tytul)}&url=${encodeURIComponent(pelny)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={klasaPrzycisku}
      >
        X
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pelny)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={klasaPrzycisku}
      >
        LinkedIn
      </a>
      <button type="button" onClick={() => void kopiuj()} className={klasaPrzycisku}>
        {skopiowano ? "Skopiowano!" : "Kopiuj link"}
      </button>
    </div>
  );
}
