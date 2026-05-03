"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { odrzucWiadomoscLokalnaSoltys, zatwierdzWiadomoscLokalnaSoltys } from "../akcje";

export type WiesDoWiadomosci = { id: string; name: string };

export type WiadomoscDoModeracji = {
  id: string;
  village_id: string;
  title: string;
  summary: string | null;
  status: string;
  is_automated: boolean;
  source_name: string | null;
  source_url: string | null;
  created_at: string;
};

export function SoltysWiadomosciLokalneKlient({
  wsie,
  wpisy,
}: {
  wsie: WiesDoWiadomosci[];
  wpisy: WiadomoscDoModeracji[];
}) {
  const router = useRouter();
  const [czek, startT] = useTransition();
  const [blad, setBlad] = useState("");
  const [komunikat, setKomunikat] = useState("");
  const [filtrWies, setFiltrWies] = useState<string>("wszystkie");

  const mapaNazw = Object.fromEntries(wsie.map((w) => [w.id, w.name]));
  const widoczne =
    filtrWies === "wszystkie" ? wpisy : wpisy.filter((w) => w.village_id === filtrWies);

  function zatwierdz(id: string) {
    setBlad("");
    setKomunikat("");
    startT(async () => {
      const w = await zatwierdzWiadomoscLokalnaSoltys(id);
      if ("blad" in w && w.blad) {
        setBlad(w.blad);
        return;
      }
      setKomunikat("Zatwierdzono wpis — jest widoczny na profilu wsi.");
      router.refresh();
    });
  }

  function onOdrzuc(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const id = String(fd.get("news_id") ?? "");
    const notatka = String(fd.get("notatka") ?? "");
    setBlad("");
    setKomunikat("");
    startT(async () => {
      const w = await odrzucWiadomoscLokalnaSoltys(id, notatka);
      if ("blad" in w && w.blad) {
        setBlad(w.blad);
        return;
      }
      setKomunikat("Odrzucono wpis.");
      e.currentTarget.reset();
      router.refresh();
    });
  }

  return (
    <section className="mt-6 space-y-6">
      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <div>
          <label className="text-sm font-medium text-stone-800" htmlFor="filtr-wies-news">
            Filtr wsi
          </label>
          <select
            id="filtr-wies-news"
            className="mt-2 block w-full min-w-[12rem] rounded border border-stone-300 px-3 py-2 text-sm"
            value={filtrWies}
            onChange={(e) => setFiltrWies(e.target.value)}
          >
            <option value="wszystkie">Wszystkie moje wsi</option>
            {wsie.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
        {komunikat ? (
          <p className="flex-1 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900">{komunikat}</p>
        ) : null}
      </div>
      {blad ? <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">{blad}</p> : null}

      {widoczne.length === 0 ? (
        <p className="text-sm text-stone-600">Brak wiadomości oczekujących na zatwierdzenie.</p>
      ) : (
        <ul className="space-y-5">
          {widoczne.map((w) => (
            <li key={w.id} className="rounded-2xl border border-amber-200/80 bg-amber-50/20 p-4 shadow-sm">
              <p className="text-xs text-stone-500">
                {mapaNazw[w.village_id] ?? "Wieś"} · {w.status}
                {w.is_automated ? " · automatyczny (RSS)" : ""}
                {" · "}
                {new Date(w.created_at).toLocaleString("pl-PL")}
              </p>
              <h2 className="mt-1 font-serif text-lg text-green-950">{w.title}</h2>
              {w.summary ? <p className="mt-2 text-sm text-stone-700">{w.summary}</p> : null}
              <p className="mt-2 text-xs text-stone-500">
                {w.source_name ? `Źródło: ${w.source_name}` : null}
                {w.source_url ? (
                  <>
                    {" "}
                    <a href={w.source_url} className="text-green-800 underline" target="_blank" rel="noopener noreferrer">
                      link
                    </a>
                  </>
                ) : null}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={czek}
                  onClick={() => zatwierdz(w.id)}
                  className="rounded-lg bg-green-800 px-4 py-2 text-sm text-white hover:bg-green-900 disabled:opacity-60"
                >
                  Zatwierdź na profil
                </button>
              </div>
              <form onSubmit={onOdrzuc} className="mt-4 border-t border-stone-200 pt-4">
                <input type="hidden" name="news_id" value={w.id} />
                <label className="block text-xs font-medium text-stone-700">
                  Odrzuć z krótką notatką (dla porządku)
                  <input
                    name="notatka"
                    required
                    placeholder="np. duplikat / poza tematem wsi"
                    className="mt-1 w-full max-w-xl rounded border border-stone-300 px-3 py-2 text-sm"
                  />
                </label>
                <button
                  type="submit"
                  disabled={czek}
                  className="mt-2 text-sm text-red-800 underline hover:text-red-950 disabled:opacity-50"
                >
                  Odrzuć
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
