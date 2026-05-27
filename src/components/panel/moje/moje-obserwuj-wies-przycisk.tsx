"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { obserwujWies } from "@/app/(site)/panel/mieszkaniec/akcje";
import { przestanObserwowacWies } from "@/app/(site)/panel/moje/akcje";

type Props = {
  villageId: string;
  nazwaWsi: string;
  followId: string | null;
  zalogowany: boolean;
  sciezkaPowrotu: string;
};

export function MojeObserwujWiesPrzycisk({ villageId, nazwaWsi, followId, zalogowany, sciezkaPowrotu }: Props) {
  const router = useRouter();
  const [aktualnyFollowId, ustawAktualnyFollowId] = useState(followId);
  const [laduje, ustawLaduje] = useState(false);
  const [blad, ustawBlad] = useState("");

  if (!zalogowany) {
    return (
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/logowanie?next=${encodeURIComponent(sciezkaPowrotu)}`}
          className="inline-flex items-center rounded-xl border border-emerald-700/30 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-100"
        >
          Zaloguj się, aby obserwować {nazwaWsi}
        </Link>
      </div>
    );
  }

  async function przełacz() {
    ustawBlad("");
    ustawLaduje(true);
    try {
      if (aktualnyFollowId) {
        const w = await przestanObserwowacWies(aktualnyFollowId);
        if ("blad" in w) {
          ustawBlad(w.blad);
          return;
        }
        ustawAktualnyFollowId(null);
      } else {
        const w = await obserwujWies(villageId);
        if ("blad" in w) {
          ustawBlad(w.blad);
          return;
        }
        router.refresh();
      }
    } finally {
      ustawLaduje(false);
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={laduje}
        onClick={() => void przełacz()}
        className={
          aktualnyFollowId
            ? "inline-flex items-center gap-1.5 rounded-xl border border-sky-300 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-950 hover:bg-sky-100 disabled:opacity-60"
            : "inline-flex items-center gap-1.5 rounded-xl border border-emerald-700/40 bg-emerald-800 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-60"
        }
      >
        {laduje ? "…" : aktualnyFollowId ? "★ W ulubionych" : "☆ Dodaj do ulubionych"}
      </button>
      <Link
        href="/panel/moje/wies"
        className="inline-flex items-center rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50"
      >
        Dołącz do wsi
      </Link>
      <Link
        href="/panel/moje"
        className="inline-flex items-center rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50"
      >
        Otwórz w „Moje”
      </Link>
      {blad ? (
        <span className="text-xs text-amber-800" role="alert">
          {blad}
        </span>
      ) : null}
    </div>
  );
}
