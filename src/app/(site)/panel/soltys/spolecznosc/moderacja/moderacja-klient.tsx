"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  rozpatrzRaportSpolecznosciSoltys,
  ukryjKomentarzDyskusjiSoltys,
  ukryjWatekDyskusjiSoltys,
  zamknijWatekDyskusjiSoltys,
} from "../../akcje-dyskusje";

export type RaportModeracji = {
  id: string;
  village_id: string;
  content_type: "thread" | "comment" | "blog_post";
  content_id: string;
  reason: string;
  note: string | null;
  created_at: string;
};

type WiesOpcja = { id: string; name: string };

export function SoltysModeracjaDyskusjiKlient({
  wsie,
  raporty,
}: {
  wsie: WiesOpcja[];
  raporty: RaportModeracji[];
}) {
  const router = useRouter();
  const [wiadomosc, setWiadomosc] = useState("");
  const [blad, setBlad] = useState("");
  const [trwa, startTransition] = useTransition();

  function run(akcja: () => Promise<{ ok?: true; blad?: string; komunikat?: string }>) {
    setWiadomosc("");
    setBlad("");
    startTransition(async () => {
      const wynik = await akcja();
      if ("blad" in wynik && wynik.blad) {
        setBlad(wynik.blad);
        return;
      }
      setWiadomosc(wynik.komunikat ?? "Zapisano.");
      router.refresh();
    });
  }

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-stone-700">
          Aktywne wsie sołtysa: <strong>{wsie.map((w) => w.name).join(", ")}</strong>
        </p>
        {wiadomosc ? (
          <p className="mt-2 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            {wiadomosc}
          </p>
        ) : null}
        {blad ? (
          <p className="mt-2 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">{blad}</p>
        ) : null}
      </div>

      {raporty.length === 0 ? (
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-5 text-sm text-emerald-900">
          Brak otwartych zgłoszeń społeczności.
        </div>
      ) : (
        <ul className="space-y-3">
          {raporty.map((r) => (
            <li key={r.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-stone-500">
                {new Date(r.created_at).toLocaleString("pl-PL")} · typ: <strong>{r.content_type}</strong>
              </p>
              <p className="mt-1 text-sm font-medium text-stone-900">{r.reason}</p>
              {r.note ? <p className="mt-1 text-sm text-stone-700">{r.note}</p> : null}
              <p className="mt-1 text-xs text-stone-500">ID treści: {r.content_id}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {r.content_type === "thread" ? (
                  <>
                    <button
                      type="button"
                      disabled={trwa}
                      onClick={() => run(() => zamknijWatekDyskusjiSoltys(r.content_id))}
                      className="rounded border border-indigo-300 bg-indigo-50 px-2.5 py-1.5 text-xs text-indigo-900"
                    >
                      Zamknij wątek
                    </button>
                    <button
                      type="button"
                      disabled={trwa}
                      onClick={() => run(() => ukryjWatekDyskusjiSoltys(r.content_id))}
                      className="rounded border border-rose-300 bg-rose-50 px-2.5 py-1.5 text-xs text-rose-900"
                    >
                      Ukryj wątek
                    </button>
                  </>
                ) : null}

                {r.content_type === "comment" ? (
                  <button
                    type="button"
                    disabled={trwa}
                    onClick={() => run(() => ukryjKomentarzDyskusjiSoltys(r.content_id))}
                    className="rounded border border-rose-300 bg-rose-50 px-2.5 py-1.5 text-xs text-rose-900"
                  >
                    Ukryj komentarz
                  </button>
                ) : null}

                <button
                  type="button"
                  disabled={trwa}
                  onClick={() => run(() => rozpatrzRaportSpolecznosciSoltys({ reportId: r.id, decyzja: "resolved" }))}
                  className="rounded border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-900"
                >
                  Oznacz jako rozwiązane
                </button>
                <button
                  type="button"
                  disabled={trwa}
                  onClick={() => run(() => rozpatrzRaportSpolecznosciSoltys({ reportId: r.id, decyzja: "rejected" }))}
                  className="rounded border border-stone-300 bg-stone-50 px-2.5 py-1.5 text-xs text-stone-800"
                >
                  Odrzuć zgłoszenie
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
