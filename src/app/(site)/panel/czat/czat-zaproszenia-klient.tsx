"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { zaprosDoGrupyCzatu } from "./akcje";

export type MieszkaniecDoZaproszenia = {
  user_id: string;
  display_name: string;
};

export function CzatZaproszeniaKlient({
  conversationId,
  mieszkancy,
}: {
  conversationId: string;
  mieszkancy: MieszkaniecDoZaproszenia[];
}) {
  const router = useRouter();
  const [blad, ustawBlad] = useState("");
  const [czek, startT] = useTransition();
  const [wybrany, ustawWybrany] = useState("");

  if (mieszkancy.length === 0) {
    return (
      <p className="mb-4 text-xs text-stone-500">Brak innych mieszkańców do zaproszenia w tej wsi.</p>
    );
  }

  return (
    <section className="mb-4 rounded-xl border border-violet-200 bg-violet-50/40 p-3">
      <h2 className="text-sm font-semibold text-green-950">Zaproś do grupy</h2>
      {blad ? <p className="mt-1 text-xs text-red-800">{blad}</p> : null}
      <div className="mt-2 flex flex-wrap gap-2">
        <select
          value={wybrany}
          onChange={(e) => ustawWybrany(e.target.value)}
          className="min-w-[180px] rounded border border-stone-300 bg-white px-2 py-1.5 text-sm"
        >
          <option value="">— wybierz mieszkańca —</option>
          {mieszkancy.map((m) => (
            <option key={m.user_id} value={m.user_id}>
              {m.display_name}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={czek || !wybrany}
          className="rounded-lg bg-violet-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-900 disabled:opacity-50"
          onClick={() => {
            ustawBlad("");
            startT(async () => {
              const w = await zaprosDoGrupyCzatu(conversationId, wybrany);
              if ("blad" in w) {
                ustawBlad(w.blad);
                return;
              }
              ustawWybrany("");
              router.refresh();
            });
          }}
        >
          Zaproś
        </button>
      </div>
    </section>
  );
}
