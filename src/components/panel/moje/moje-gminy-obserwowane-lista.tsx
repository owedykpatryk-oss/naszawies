"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { GminaObserwowana } from "@/lib/panel/pobierz-moje-powiazania";
import { przestanObserwowacGmine } from "@/app/(site)/panel/moje/akcje";

export function MojeGminyObserwowaneLista({ gminy }: { gminy: GminaObserwowana[] }) {
  const router = useRouter();
  const [czek, startT] = useTransition();

  if (gminy.length === 0) {
    return (
      <p className="text-sm text-stone-600">
        Nie obserwujesz jeszcze żadnej gminy „w całości”. Możesz dodać gminę poniżej — bez konieczności przypisania konkretnej
        wsi.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {gminy.map((g) => (
        <li key={g.followId} className="karta-wow rounded-xl border border-sky-200/80 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <Link href={g.sciezkaHub} className="font-serif text-lg text-green-950 hover:underline">
                {g.gmina}
              </Link>
              <p className="text-xs text-stone-500">
                Powiat {g.powiat} · {g.wojewodztwo}
              </p>
            </div>
            <button
              type="button"
              disabled={czek}
              onClick={() => {
                startT(async () => {
                  await przestanObserwowacGmine(g.followId);
                  router.refresh();
                });
              }}
              className="text-xs font-medium text-red-800 underline disabled:opacity-50"
            >
              Przestań obserwować
            </button>
          </div>
          <p className="mt-2 text-xs text-stone-600">
            Feed obejmuje wszystkie wsie w tej gminie (do limitu katalogu). Powiadomienia: ogłoszenia{" "}
            {g.notify_posts ? "tak" : "nie"}, wydarzenia {g.notify_events ? "tak" : "nie"}.
          </p>
        </li>
      ))}
    </ul>
  );
}
