"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zapiszRegulaminPlacuZabawWsi } from "@/app/(site)/panel/soltys/akcje";
import { REGULAMIN_PLACU_ZABAW_SZABLON } from "@/lib/swietlica/regulamin-plac-zabaw-szablon";

type Props = {
  villageId: string;
  nazwaWsi: string;
  regulaminPoczatek: string | null;
};

export function RegulaminPlacuZabawKlient({ villageId, nazwaWsi, regulaminPoczatek }: Props) {
  const router = useRouter();
  const [tekst, ustawTekst] = useState(regulaminPoczatek ?? "");
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

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-800 hover:bg-stone-50"
            onClick={() => ustawTekst(REGULAMIN_PLACU_ZABAW_SZABLON)}
          >
            Wstaw przykładowy regulamin
          </button>
          <button
            type="button"
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-50"
            onClick={() => ustawTekst("")}
          >
            Wyczyść pole
          </button>
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
