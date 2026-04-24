"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zapiszRegulaminPlacuZabawWsi } from "@/app/(site)/panel/soltys/akcje";
import { REGULAMIN_PLACU_ZABAW_SZABLONY } from "@/lib/swietlica/regulamin-plac-zabaw-szablon";

type Props = {
  villageId: string;
  nazwaWsi: string;
  regulaminPoczatek: string | null;
};

export function RegulaminPlacuZabawKlient({ villageId, nazwaWsi, regulaminPoczatek }: Props) {
  const router = useRouter();
  const [tekst, ustawTekst] = useState(regulaminPoczatek ?? "");
  const [wybranyWzor, ustawWybranyWzor] = useState<string>("");
  const [komunikat, ustawKomunikat] = useState<{ typ: "ok" | "blad"; t: string } | null>(null);
  const [oczekuje, startTransition] = useTransition();

  useEffect(() => {
    ustawTekst(regulaminPoczatek ?? "");
  }, [regulaminPoczatek]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    ustawKomunikat(null);
    startTransition(async () => {
      const w = await zapiszRegulaminPlacuZabawWsi({
        villageId,
        playground_rules_text: tekst.trim().length ? tekst : null,
      });
      if ("blad" in w) {
        ustawKomunikat({ typ: "blad", t: w.blad });
        return;
      }
      ustawKomunikat({ typ: "ok", t: "Zapisano regulamin placu zabaw dla sołectwa." });
      router.refresh();
    });
  }

  return (
    <section className="mt-10 rounded-2xl border border-green-900/15 bg-gradient-to-b from-[#f7faf5] to-white p-5 shadow-sm">
      <h2 className="font-serif text-xl text-green-950">Regulamin placu zabaw</h2>
      <p className="mt-1 text-sm text-stone-600">
        Treść wspólna dla sołectwa <strong>{nazwaWsi}</strong> (niezależnie od liczby sal). Widoczna mieszkańcom przy
        świetlicy oraz w załączniku informacyjnym do wynajmu. Dopasuj numerację i uchwały do sytuacji w gminie.
      </p>

      <form className="mt-4 space-y-4" onSubmit={onSubmit}>
        {komunikat ? (
          <p
            role="status"
            className={
              komunikat.typ === "ok"
                ? "rounded-lg bg-green-50 px-3 py-2 text-sm text-green-900"
                : "rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800"
            }
          >
            {komunikat.t}
          </p>
        ) : null}

        <div className="space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="min-w-0 flex-1 sm:max-w-md">
              <label htmlFor="pz-wzory" className="mb-1 block text-xs font-medium text-stone-600">
                Wzorce treści (wstawia poniżej; potem edytuj wg uchwał i opisów producenta urządzeń)
              </label>
              <select
                id="pz-wzory"
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
                value={wybranyWzor}
                onChange={(e) => {
                  const id = e.target.value;
                  ustawWybranyWzor(id);
                  const s = REGULAMIN_PLACU_ZABAW_SZABLONY.find((w) => w.id === id);
                  if (s) ustawTekst(s.tresc);
                }}
              >
                <option value="">Wybierz wzorzec, aby wstawić…</option>
                {REGULAMIN_PLACU_ZABAW_SZABLONY.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.etykieta}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              {REGULAMIN_PLACU_ZABAW_SZABLONY.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  title={s.opis}
                  className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-800 hover:bg-stone-50"
                  onClick={() => {
                    ustawWybranyWzor(s.id);
                    ustawTekst(s.tresc);
                  }}
                >
                  Wstaw: {s.etykieta}
                </button>
              ))}
              <button
                type="button"
                className="rounded-lg border border-dashed border-stone-200 px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-50"
                onClick={() => {
                  ustawTekst("");
                  ustawWybranyWzor("");
                }}
              >
                Wyczyść pole
              </button>
            </div>
          </div>
          {wybranyWzor ? (
            <p className="text-xs text-stone-500">
              {REGULAMIN_PLACU_ZABAW_SZABLONY.find((s) => s.id === wybranyWzor)?.opis}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="pz-reg" className="mb-1 block text-sm font-medium text-stone-700">
            Pełny tekst regulaminu
          </label>
          <textarea
            id="pz-reg"
            value={tekst}
            onChange={(e) => ustawTekst(e.target.value)}
            rows={14}
            maxLength={50000}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 font-mono text-sm leading-relaxed text-stone-900 outline-none ring-green-800 focus:ring-2"
            placeholder="§1. …"
          />
        </div>

        <button
          type="submit"
          disabled={oczekuje}
          className="rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-60"
        >
          {oczekuje ? "Zapisywanie…" : "Zapisz regulamin placu zabaw"}
        </button>
      </form>
    </section>
  );
}
