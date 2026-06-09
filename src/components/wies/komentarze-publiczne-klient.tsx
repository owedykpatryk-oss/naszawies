"use client";

import { type FormEvent, useState, useTransition } from "react";
import Link from "next/link";
import { urlLogowaniaZPowrotem } from "@/lib/auth/sciezki-chronione";

export type KomentarzPublicznyWiersz = {
  id: string;
  body: string;
  createdAt: string;
  authorLabel: string;
};

type Props = {
  tytul?: string;
  komentarze: KomentarzPublicznyWiersz[];
  zalogowany: boolean;
  sciezkaPowrotu: string;
  onDodaj: (body: string) => Promise<{ ok?: true; blad?: string }>;
};

export function KomentarzePubliczneKlient({
  tytul = "Komentarze",
  komentarze: poczatkowe,
  zalogowany,
  sciezkaPowrotu,
  onDodaj,
}: Props) {
  const [komentarze, ustawKomentarze] = useState(poczatkowe);
  const [blad, ustawBlad] = useState("");
  const [czek, startTransition] = useTransition();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    ustawBlad("");
    const fd = new FormData(e.currentTarget);
    const body = String(fd.get("body") ?? "").trim();
    if (!body) return;

    startTransition(async () => {
      const w = await onDodaj(body);
      if (w.blad) {
        ustawBlad(w.blad);
        return;
      }
      ustawKomentarze((prev) => [
        ...prev,
        {
          id: `tmp-${Date.now()}`,
          body,
          createdAt: new Date().toISOString(),
          authorLabel: "Ty",
        },
      ]);
      e.currentTarget.reset();
    });
  }

  return (
    <section className="mt-6 rounded-2xl border border-stone-200/80 bg-stone-50/50 p-5">
      <h2 className="font-serif text-lg text-green-950">
        {tytul} ({komentarze.length})
      </h2>
      {komentarze.length === 0 ? (
        <p className="mt-2 text-sm text-stone-500">
          Brak komentarzy — bądź pierwszą osobą, która podzieli się wrażeniami.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {komentarze.map((k) => (
            <li key={k.id} className="rounded-xl border border-stone-100 bg-white px-4 py-3">
              <p className="text-sm text-stone-800">{k.body}</p>
              <p className="mt-1 text-xs text-stone-500">
                {k.authorLabel} · {new Date(k.createdAt).toLocaleString("pl-PL")}
              </p>
            </li>
          ))}
        </ul>
      )}

      {zalogowany ? (
        <form onSubmit={onSubmit} className="mt-5 space-y-2 border-t border-stone-200 pt-5">
          <label className="block text-sm font-medium text-stone-800">
            Twój komentarz
            <textarea
              name="body"
              required
              maxLength={600}
              rows={3}
              className="form-control mt-1"
              placeholder="Podziel się wspomnieniem lub pytaniem…"
            />
          </label>
          {blad ? <p className="text-sm text-red-800">{blad}</p> : null}
          <button type="submit" disabled={czek} className="btn-panel-primary text-sm">
            Dodaj komentarz
          </button>
        </form>
      ) : (
        <p className="mt-4 text-sm text-stone-600">
          <Link href={urlLogowaniaZPowrotem(sciezkaPowrotu)} className="font-medium text-green-800 underline">
            Zaloguj się
          </Link>
          , aby dodać komentarz.
        </p>
      )}
    </section>
  );
}
