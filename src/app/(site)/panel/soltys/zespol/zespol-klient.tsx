"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cofnijWspoladmina, nadajWspoladmina } from "./akcje-zespol";

export type WspoladminWiersz = {
  id: string;
  user_id: string;
  village_id: string;
  wies_nazwa: string;
  display_name: string;
  created_at: string;
};

type Props = {
  wsie: { id: string; name: string }[];
  wspoladmini: WspoladminWiersz[];
};

export function ZespolKlient({ wsie, wspoladmini }: Props) {
  const router = useRouter();
  const [villageId, ustawVillageId] = useState(wsie[0]?.id ?? "");
  const [email, ustawEmail] = useState("");
  const [blad, ustawBlad] = useState("");
  const [komunikat, ustawKomunikat] = useState("");
  const [czeka, startT] = useTransition();

  function nadaj(e: React.FormEvent) {
    e.preventDefault();
    ustawBlad("");
    ustawKomunikat("");
    startT(async () => {
      const w = await nadajWspoladmina(villageId, email);
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawKomunikat(w.komunikat ?? "Dodano.");
      ustawEmail("");
      router.refresh();
    });
  }

  function cofnij(id: string) {
    startT(async () => {
      const w = await cofnijWspoladmina(id);
      if ("blad" in w) ustawBlad(w.blad);
      else {
        ustawKomunikat(w.komunikat ?? "Cofnięto.");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-8">
      {komunikat ? (
        <p className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-950">{komunikat}</p>
      ) : null}
      {blad ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900" role="alert">
          {blad}
        </p>
      ) : null}

      <form onSubmit={nadaj} className="panel-karta max-w-2xl space-y-4">
        <h2 className="font-serif text-lg text-green-950">Dodaj współadministratora</h2>
        <p className="text-sm text-stone-600">
          Osoba musi mieć konto w serwisie. Współadmin ma dostęp do panelu sołtysa (moderacja, zgłoszenia, rezerwacje) —
          bez zmiany przypisania sołtysa w urzędzie.
        </p>
        {wsie.length > 1 ? (
          <label className="block text-xs font-medium text-stone-600">
            Wieś
            <select
              value={villageId}
              onChange={(e) => ustawVillageId(e.target.value)}
              className="form-control mt-1"
            >
              {wsie.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="block text-xs font-medium text-stone-600">
          E-mail użytkownika
          <input
            type="email"
            required
            value={email}
            onChange={(e) => ustawEmail(e.target.value)}
            className="form-control mt-1"
            placeholder="jan.kowalski@example.com"
          />
        </label>
        <button
          type="submit"
          disabled={czeka || !villageId}
          className="rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-60"
        >
          Nadaj współadmina
        </button>
      </form>

      <section>
        <h2 className="font-serif text-lg text-green-950">Aktywni współadministratorzy</h2>
        {wspoladmini.length === 0 ? (
          <p className="mt-2 text-sm text-stone-600">Brak — możesz dodać zaufane osoby z pomocy przy obsłudze wsi.</p>
        ) : (
          <ul className="mt-4 divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white">
            {wspoladmini.map((w) => (
              <li key={w.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-stone-900">{w.display_name}</p>
                  <p className="text-xs text-stone-500">
                    {w.wies_nazwa} · od {new Date(w.created_at).toLocaleDateString("pl-PL")}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={czeka}
                  onClick={() => cofnij(w.id)}
                  className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs hover:bg-stone-50"
                >
                  Cofnij dostęp
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
