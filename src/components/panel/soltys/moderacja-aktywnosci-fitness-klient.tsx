"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  pobierzAktywnosciFitnessPanel,
  usunAktywnoscFitnessSoltys,
  type AktywnoscFitnessPanel,
} from "@/app/(site)/panel/soltys/akcje-aktywnosc-fitness";
import {
  etykietaRodzajuAktywnosci,
  formatujDystans,
} from "@/lib/wies/pobierz-aktywnosci-fitness-wsi";
import { urlCsvAktywnosciFitnessWsi } from "@/lib/wies/csv-aktywnosci-fitness";

export function ModeracjaAktywnosciFitnessKlient({ villageId }: { villageId: string }) {
  const router = useRouter();
  const [lista, ustawListe] = useState<AktywnoscFitnessPanel[]>([]);
  const [laduje, ustawLaduje] = useState(true);
  const [pending, startT] = useTransition();

  useEffect(() => {
    let anuluj = false;
    ustawLaduje(true);
    pobierzAktywnosciFitnessPanel(villageId).then((w) => {
      if (!anuluj) {
        ustawListe(w);
        ustawLaduje(false);
      }
    });
    return () => {
      anuluj = true;
    };
  }, [villageId]);

  function usun(id: string) {
    if (!confirm("Usunąć tę aktywność z profilu wsi?")) return;
    startT(async () => {
      const w = await usunAktywnoscFitnessSoltys(id, villageId);
      if ("ok" in w && w.ok) {
        ustawListe((prev) => prev.filter((x) => x.id !== id));
        router.refresh();
      }
    });
  }

  if (laduje) {
    return <p className="text-sm text-stone-500">Ładuję aktywności mieszkańców…</p>;
  }

  if (lista.length === 0) {
    return (
      <p className="text-sm text-stone-600">
        Brak opublikowanych aktywności fitness. Mieszkańcy mogą dodawać je w sekcji Sport na profilu wsi.
      </p>
    );
  }

  return (
    <>
      <p className="mb-3 text-xs text-stone-600">
        <a href={urlCsvAktywnosciFitnessWsi(villageId)} className="font-medium text-sky-800 underline">
          Pobierz CSV
        </a>
        {" "}
        — lista aktywności do arkusza (Excel, LibreOffice).
      </p>
      <ul className="space-y-2 text-sm">
      {lista.map((a) => (
        <li key={a.id} className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-sky-800">
              {etykietaRodzajuAktywnosci(a.activity_kind)}
            </p>
            <p className="font-medium text-stone-900">{a.title}</p>
            <p className="mt-0.5 text-xs text-stone-600">
              {new Date(a.activity_date).toLocaleString("pl-PL", { dateStyle: "medium", timeStyle: "short" })}
              {a.distance_meters ? ` · ${formatujDystans(a.distance_meters)}` : ""}
              {a.autor ? ` · ${a.autor}` : ""}
            </p>
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() => usun(a.id)}
            className="shrink-0 text-xs font-medium text-red-700 underline disabled:opacity-50"
          >
            Usuń
          </button>
        </li>
      ))}
    </ul>
    </>
  );
}
