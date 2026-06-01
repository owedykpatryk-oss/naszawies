"use client";

import { useState, useTransition } from "react";
import { zapiszNotatkeAdminSugestii } from "./akcje-admin-sugestie";

export type WierszOpiniiAdmin = {
  id: string;
  created_at: string;
  survey_kind: string;
  rating_overall: number | null;
  rating_ease: number | null;
  what_works: string | null;
  what_improve: string | null;
  free_notes: string | null;
  user_role_snapshot: string | null;
  admin_status: string;
  admin_notes: string | null;
  user_display_name: string | null;
  user_email: string | null;
  village_name: string | null;
};

const STATUSY = [
  { id: "new", label: "Nowe" },
  { id: "read", label: "Przeczytane" },
  { id: "planned", label: "W planie" },
  { id: "done", label: "Zrobione" },
] as const;

export function AdminSugestieKlient({ wiersze }: { wiersze: WierszOpiniiAdmin[] }) {
  const [filtr, ustawFiltr] = useState<string>("all");
  const [pending, startTransition] = useTransition();
  const [komunikat, ustawKomunikat] = useState("");

  const lista =
    filtr === "all" ? wiersze : wiersze.filter((w) => w.admin_status === filtr);

  const nowe = wiersze.filter((w) => w.admin_status === "new").length;

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-stone-600">
          {wiersze.length} opinii · <strong className="text-amber-900">{nowe} nowych</strong>
        </span>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => ustawFiltr("all")}
            className={`rounded-full px-3 py-1 text-xs font-medium ${filtr === "all" ? "bg-green-800 text-white" : "bg-stone-100 text-stone-700"}`}
          >
            Wszystkie
          </button>
          {STATUSY.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => ustawFiltr(s.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${filtr === s.id ? "bg-green-800 text-white" : "bg-stone-100 text-stone-700"}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {komunikat ? <p className="text-sm text-green-800">{komunikat}</p> : null}

      {lista.length === 0 ? (
        <p className="text-sm text-stone-500">Brak opinii w tym filtrze.</p>
      ) : (
        <ul className="space-y-4">
          {lista.map((w) => (
            <WierszOpiniiAdminKarta
              key={w.id}
              wiersz={w}
              pending={pending}
              onZapisz={(d) => {
                ustawKomunikat("");
                startTransition(async () => {
                  const r = await zapiszNotatkeAdminSugestii(d);
                  if ("blad" in r) ustawKomunikat(r.blad);
                  else ustawKomunikat("Zapisano notatki wewnętrzne.");
                });
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function WierszOpiniiAdminKarta({
  wiersz,
  pending,
  onZapisz,
}: {
  wiersz: WierszOpiniiAdmin;
  pending: boolean;
  onZapisz: (d: { id: string; adminStatus: "new" | "read" | "planned" | "done"; adminNotes: string }) => void;
}) {
  const [status, ustawStatus] = useState(wiersz.admin_status);
  const [notatki, ustawNotatki] = useState(wiersz.admin_notes ?? "");

  return (
    <li className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs text-stone-500">
            {new Date(wiersz.created_at).toLocaleString("pl-PL", { dateStyle: "medium", timeStyle: "short" })}
            {" · "}
            {wiersz.survey_kind}
            {wiersz.rating_overall != null ? ` · ⭐ ${wiersz.rating_overall}/5` : ""}
            {wiersz.rating_ease != null ? ` · łatwość ${wiersz.rating_ease}/5` : ""}
          </p>
          <p className="mt-1 text-sm font-medium text-stone-900">
            {wiersz.user_display_name ?? "Użytkownik"}{" "}
            <span className="font-normal text-stone-500">
              ({wiersz.user_role_snapshot ?? "—"}
              {wiersz.village_name ? ` · ${wiersz.village_name}` : ""})
            </span>
          </p>
          {wiersz.user_email ? <p className="font-mono text-xs text-stone-500">{wiersz.user_email}</p> : null}
        </div>
      </div>

      {wiersz.what_works ? (
        <div className="mt-3 rounded-lg bg-emerald-50/80 px-3 py-2 text-sm">
          <p className="text-xs font-semibold uppercase text-emerald-900">Działa dobrze</p>
          <p className="mt-1 whitespace-pre-wrap text-stone-800">{wiersz.what_works}</p>
        </div>
      ) : null}

      {wiersz.what_improve ? (
        <div className="mt-2 rounded-lg bg-amber-50/80 px-3 py-2 text-sm">
          <p className="text-xs font-semibold uppercase text-amber-900">Do ulepszenia</p>
          <p className="mt-1 whitespace-pre-wrap text-stone-800">{wiersz.what_improve}</p>
        </div>
      ) : null}

      {wiersz.free_notes ? (
        <p className="mt-2 text-sm text-stone-600">
          <span className="font-medium">Notatka:</span> {wiersz.free_notes}
        </p>
      ) : null}

      <div className="mt-4 border-t border-stone-100 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Twoje notatki (wewnętrzne)</p>
        <p className="mt-1 text-xs text-stone-500">Co z tym zrobić w produkcie — widoczne tylko dla admina.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <select
            value={status}
            onChange={(e) => ustawStatus(e.target.value)}
            className="rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
          >
            {STATUSY.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <textarea
          value={notatki}
          onChange={(e) => ustawNotatki(e.target.value)}
          rows={3}
          placeholder="Np. dodać do backlogu Q3, sprawdzić bug na mobile, odpowiedzieć użytkownikowi…"
          className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            onZapisz({
              id: wiersz.id,
              adminStatus: status as "new" | "read" | "planned" | "done",
              adminNotes: notatki,
            })
          }
          className="mt-2 rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-60"
        >
          Zapisz status i notatki
        </button>
      </div>
    </li>
  );
}
