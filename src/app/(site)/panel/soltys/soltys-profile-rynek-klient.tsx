"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ustawWeryfikacjeProfiluRynek } from "./akcje";

type Profil = {
  id: string;
  business_name: string;
  is_verified: boolean;
  wies: string;
};

export function SoltysProfileRynekKlient({ profile }: { profile: Profil[] }) {
  const router = useRouter();
  const [blad, ustawBlad] = useState("");
  const [czek, startT] = useTransition();

  if (profile.length === 0) return null;

  return (
    <section className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50/30 p-4">
      <h2 className="font-serif text-lg text-green-950">Firmy i sklepy (rynek)</h2>
      <p className="mt-1 text-xs text-stone-600">
        Zweryfikowany profil ma badge na profilu wsi. Mieszkańcy edytują wizytówkę w panelu.
      </p>
      {blad ? <p className="mt-2 text-sm text-red-800">{blad}</p> : null}
      <ul className="mt-3 space-y-2">
        {profile.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-sm">
            <span>
              <span className="font-medium">{p.business_name}</span>
              <span className="ml-2 text-xs text-stone-500">{p.wies}</span>
              {p.is_verified ? (
                <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-900">
                  zweryfikowany
                </span>
              ) : null}
            </span>
            <button
              type="button"
              disabled={!!czek}
              className="rounded-lg border border-green-800 px-3 py-1 text-xs font-medium text-green-900 hover:bg-green-50 disabled:opacity-50"
              onClick={() => {
                ustawBlad("");
                startT(async () => {
                  const w = await ustawWeryfikacjeProfiluRynek(p.id, !p.is_verified);
                  if ("blad" in w) {
                    ustawBlad(w.blad);
                    return;
                  }
                  router.refresh();
                });
              }}
            >
              {p.is_verified ? "Cofnij weryfikację" : "Zweryfikuj profil"}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
