"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adminOdrzucWniosekSoltysa, adminZatwierdzWniosekSoltysa } from "./akcje-wnioski-soltysa";

import type { WniosekAdminWiersz } from "@/lib/admin/typy-wniosek-soltysa";

type Props = { wnioski: WniosekAdminWiersz[] };

export function AdminKolejkaSoltysowKlient({ wnioski }: Props) {
  const router = useRouter();
  const [blad, ustawBlad] = useState("");
  const [sukces, ustawSukces] = useState("");
  const [czeka, startT] = useTransition();
  const [notatki, ustawNotatki] = useState<Record<string, string>>({});

  function zatwierdz(id: string) {
    ustawBlad("");
    ustawSukces("");
    startT(async () => {
      const w = await adminZatwierdzWniosekSoltysa(id);
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawSukces(`Zatwierdzono. Wieś ID: ${w.villageId ?? "—"}`);
      router.refresh();
    });
  }

  function odrzuc(id: string) {
    ustawBlad("");
    ustawSukces("");
    startT(async () => {
      const w = await adminOdrzucWniosekSoltysa(id, notatki[id] ?? null);
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawSukces("Wniosek odrzucony.");
      router.refresh();
    });
  }

  if (wnioski.length === 0) {
    return (
      <p className="mt-4 text-sm text-stone-600">Brak oczekujących wniosków o rolę sołtysa.</p>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {blad ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900" role="alert">
          {blad}
        </p>
      ) : null}
      {sukces ? (
        <p className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-950">{sukces}</p>
      ) : null}
      {wnioski.map((w) => (
        <article key={w.id} className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-serif text-lg text-green-950">{w.village_name}</h3>
              <p className="text-sm text-stone-700">
                {w.commune}, {w.county}, {w.voivodeship}
              </p>
              <p className="mt-1 font-mono text-xs text-stone-500">TERYT / SIMC: {w.teryt_id}</p>
            </div>
            <time className="text-xs text-stone-500" dateTime={w.created_at}>
              {new Date(w.created_at).toLocaleString("pl-PL")}
            </time>
          </div>
          <dl className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-stone-500">Wnioskodawca</dt>
              <dd>{w.applicant_display_name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-stone-500">E-mail konta</dt>
              <dd className="break-all font-mono text-xs">{w.email}</dd>
            </div>
            {w.applicant_phone ? (
              <div>
                <dt className="text-xs text-stone-500">Telefon</dt>
                <dd>{w.applicant_phone}</dd>
              </div>
            ) : null}
            {w.village_id ? (
              <div>
                <dt className="text-xs text-stone-500">Wieś w bazie</dt>
                <dd className="font-mono text-xs">{w.village_id}</dd>
              </div>
            ) : null}
          </dl>
          {w.note ? <p className="mt-2 text-sm text-stone-700">{w.note}</p> : null}
          <label className="mt-3 block text-xs font-medium text-stone-600">
            Uwaga przy odrzuceniu (opcjonalnie)
            <input
              type="text"
              value={notatki[w.id] ?? ""}
              onChange={(e) => ustawNotatki((prev) => ({ ...prev, [w.id]: e.target.value }))}
              className="form-control mt-1"
            />
          </label>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={czeka}
              onClick={() => zatwierdz(w.id)}
              className="rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-60"
            >
              Zatwierdź i aktywuj wieś
            </button>
            <button
              type="button"
              disabled={czeka}
              onClick={() => odrzuc(w.id)}
              className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm hover:bg-stone-50 disabled:opacity-60"
            >
              Odrzuć
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
