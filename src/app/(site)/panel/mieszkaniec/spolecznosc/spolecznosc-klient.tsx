"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  dodajKomentarzDyskusjiMieszkanca,
  dodajWatekDyskusjiMieszkanca,
  dodajWpisBlogaMieszkanca,
  glosujWatekDyskusjiMieszkanca,
  usunGlosWatekDyskusjiMieszkanca,
  zglosTrescSpolecznosciMieszkanca,
} from "../akcje-spolecznosc";

export type WiesOpcja = { id: string; name: string };

export type Watek = {
  id: string;
  village_id: string;
  author_id: string;
  title: string;
  body: string;
  category: string;
  status: "open" | "closed" | "hidden" | "archived";
  comment_count: number;
  vote_score: number;
  created_at: string;
};

export type Komentarz = {
  id: string;
  thread_id: string;
  author_id: string;
  body: string;
  created_at: string;
};

export type GlosMoj = {
  thread_id: string;
  vote: number;
};

function slugify(tekst: string): string {
  return tekst
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 130);
}

export function MieszkaniecSpolecznoscKlient({
  wsie,
  watki,
  komentarze,
  mojeGlosy,
}: {
  wsie: WiesOpcja[];
  watki: Watek[];
  komentarze: Komentarz[];
  mojeGlosy: GlosMoj[];
}) {
  const router = useRouter();
  const [villageId, setVillageId] = useState(wsie[0]?.id ?? "");
  const [threadId, setThreadId] = useState<string>("");
  const [wiadomosc, setWiadomosc] = useState("");
  const [blad, setBlad] = useState("");
  const [trwa, startTransition] = useTransition();
  const [blogTytul, setBlogTytul] = useState("");
  const [blogSlug, setBlogSlug] = useState("");

  const watkiWsi = useMemo(
    () =>
      watki
        .filter((w) => w.village_id === villageId && (w.status === "open" || w.status === "closed"))
        .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)),
    [watki, villageId],
  );

  const aktywnyWatek = useMemo(() => {
    const zWyboru = watkiWsi.find((w) => w.id === threadId);
    return zWyboru ?? watkiWsi[0] ?? null;
  }, [threadId, watkiWsi]);

  const komentarzeWatku = useMemo(
    () =>
      aktywnyWatek
        ? komentarze
            .filter((k) => k.thread_id === aktywnyWatek.id)
            .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at))
        : [],
    [aktywnyWatek, komentarze],
  );

  const mapaMoichGlosow = useMemo(() => {
    const m = new Map<string, number>();
    for (const g of mojeGlosy) m.set(g.thread_id, g.vote);
    return m;
  }, [mojeGlosy]);

  function wykonaj(akcja: () => Promise<{ ok?: true; blad?: string; komunikat?: string }>) {
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
    <section className="space-y-6">
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <label htmlFor="wies-spolecznosc" className="text-sm font-medium text-stone-800">
          Aktywna wieś
        </label>
        <select
          id="wies-spolecznosc"
          className="mt-2 w-full max-w-md rounded border border-stone-300 px-3 py-2 text-sm"
          value={villageId}
          onChange={(e) => {
            setVillageId(e.target.value);
            setThreadId("");
          }}
        >
          {wsie.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        {wiadomosc ? (
          <p className="mt-3 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            {wiadomosc}
          </p>
        ) : null}
        {blad ? (
          <p className="mt-3 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">{blad}</p>
        ) : null}
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs text-amber-900">
          Zasady: bez obrażania i spamu. Powtarzające się naruszenia powodują automatyczne zaostrzenie limitów publikacji.
        </div>
      </div>

      <form
        className="rounded-2xl border border-sky-200/80 bg-sky-50/40 p-5 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          wykonaj(() =>
            dodajWatekDyskusjiMieszkanca({
              villageId,
              title: String(fd.get("title") ?? ""),
              body: String(fd.get("body") ?? ""),
              category: String(fd.get("category") ?? "ogolne"),
            }),
          );
          e.currentTarget.reset();
        }}
      >
        <h2 className="font-serif text-xl text-green-950">Nowy wątek dyskusji</h2>
        <div className="mt-3 grid gap-3">
          <input
            name="title"
            required
            placeholder="Tytuł (np. Oświetlenie przy drodze gminnej)"
            className="rounded border border-stone-300 px-3 py-2 text-sm"
          />
          <input
            name="category"
            defaultValue="ogolne"
            placeholder="Kategoria (np. infrastruktura, wydarzenia, bezpieczeństwo)"
            className="rounded border border-stone-300 px-3 py-2 text-sm"
          />
          <textarea
            name="body"
            required
            rows={4}
            placeholder="Opisz temat, kontekst i propozycję rozwiązania."
            className="rounded border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={trwa || !villageId}
          className="mt-4 rounded-lg bg-sky-800 px-4 py-2 text-sm text-white hover:bg-sky-900 disabled:opacity-60"
        >
          Opublikuj wątek
        </button>
      </form>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <h3 className="font-serif text-lg text-green-950">Wątki w tej wsi</h3>
          {watkiWsi.length === 0 ? (
            <p className="mt-2 text-sm text-stone-600">Brak tematów. Załóż pierwszy wątek.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {watkiWsi.map((w) => {
                const mojGlos = mapaMoichGlosow.get(w.id) ?? 0;
                return (
                  <li key={w.id} className="rounded-lg border border-stone-200 p-3">
                    <button
                      type="button"
                      onClick={() => setThreadId(w.id)}
                      className="w-full text-left"
                    >
                      <p className="font-medium text-stone-900">{w.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-stone-600">{w.body}</p>
                    </button>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-stone-600">
                      <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5">
                        {w.category}
                      </span>
                      <span>komentarze: {w.comment_count}</span>
                      <span>głosy: {w.vote_score}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={trwa}
                        className={`rounded border px-2 py-1 text-xs ${mojGlos === 1 ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-stone-300 bg-white"}`}
                        onClick={() =>
                          wykonaj(() =>
                            mojGlos === 1
                              ? usunGlosWatekDyskusjiMieszkanca(w.id)
                              : glosujWatekDyskusjiMieszkanca({ threadId: w.id, vote: 1 }),
                          )
                        }
                      >
                        Popieram
                      </button>
                      <button
                        type="button"
                        disabled={trwa}
                        className={`rounded border px-2 py-1 text-xs ${mojGlos === -1 ? "border-rose-400 bg-rose-50 text-rose-900" : "border-stone-300 bg-white"}`}
                        onClick={() =>
                          wykonaj(() =>
                            mojGlos === -1
                              ? usunGlosWatekDyskusjiMieszkanca(w.id)
                              : glosujWatekDyskusjiMieszkanca({ threadId: w.id, vote: -1 }),
                          )
                        }
                      >
                        Nie popieram
                      </button>
                      <button
                        type="button"
                        disabled={trwa}
                        className="rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-900"
                        onClick={() =>
                          wykonaj(() =>
                            zglosTrescSpolecznosciMieszkanca({
                              villageId: w.village_id,
                              contentType: "thread",
                              contentId: w.id,
                              reason: "Naruszenie zasad",
                              note: "Prośba o sprawdzenie przez sołtysa.",
                            }),
                          )
                        }
                      >
                        Zgłoś
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <h3 className="font-serif text-lg text-green-950">Komentarze do wybranego wątku</h3>
          {!aktywnyWatek ? (
            <p className="mt-2 text-sm text-stone-600">Wybierz wątek z lewej strony.</p>
          ) : (
            <>
              <p className="mt-2 text-sm font-medium text-stone-900">{aktywnyWatek.title}</p>
              <p className="mt-1 text-xs text-stone-600">{aktywnyWatek.body}</p>

              <form
                className="mt-3 space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  wykonaj(() =>
                    dodajKomentarzDyskusjiMieszkanca({
                      threadId: aktywnyWatek.id,
                      body: String(fd.get("body") ?? ""),
                    }),
                  );
                  e.currentTarget.reset();
                }}
              >
                <textarea
                  name="body"
                  required
                  rows={3}
                  placeholder="Napisz komentarz..."
                  className="w-full rounded border border-stone-300 px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  disabled={trwa || aktywnyWatek.status !== "open"}
                  className="rounded-lg bg-green-800 px-3 py-2 text-xs text-white hover:bg-green-900 disabled:opacity-60"
                >
                  Dodaj komentarz
                </button>
              </form>

              {komentarzeWatku.length === 0 ? (
                <p className="mt-3 text-sm text-stone-600">Brak komentarzy.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {komentarzeWatku.map((k) => (
                    <li key={k.id} className="rounded border border-stone-200 bg-stone-50/50 px-3 py-2">
                      <p className="text-xs text-stone-500">Autor: {k.author_id.slice(0, 8)}…</p>
                      <p className="mt-1 text-sm text-stone-800">{k.body}</p>
                      <button
                        type="button"
                        disabled={trwa}
                        className="mt-2 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-900"
                        onClick={() =>
                          wykonaj(() =>
                            zglosTrescSpolecznosciMieszkanca({
                              villageId: aktywnyWatek.village_id,
                              contentType: "comment",
                              contentId: k.id,
                              reason: "Wątpliwa treść",
                              note: "Prośba o moderację komentarza.",
                            }),
                          )
                        }
                      >
                        Zgłoś komentarz
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>

      <form
        className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-5 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const tytul = String(fd.get("title") ?? "");
          const slug = String(fd.get("slug") ?? "").trim() || slugify(tytul);
          wykonaj(() =>
            dodajWpisBlogaMieszkanca({
              villageId,
              title: tytul,
              slug,
              body: String(fd.get("body") ?? ""),
              excerpt: String(fd.get("excerpt") ?? ""),
              tagsCsv: String(fd.get("tagsCsv") ?? ""),
            }),
          );
          e.currentTarget.reset();
          setBlogTytul("");
          setBlogSlug("");
        }}
      >
        <h2 className="font-serif text-xl text-green-950">Blog mieszkańca (do moderacji)</h2>
        <p className="mt-1 text-sm text-stone-600">
          Wpis trafia najpierw do kolejki sołtysa. Po akceptacji będzie widoczny publicznie.
        </p>
        <div className="mt-3 grid gap-3">
          <input
            name="title"
            required
            value={blogTytul}
            onChange={(e) => {
              const next = e.target.value;
              setBlogTytul(next);
              setBlogSlug(slugify(next));
            }}
            placeholder="Tytuł wpisu"
            className="rounded border border-stone-300 px-3 py-2 text-sm"
          />
          <input
            name="slug"
            required
            value={blogSlug}
            onChange={(e) => setBlogSlug(e.target.value)}
            placeholder="slug-wpisu"
            className="rounded border border-stone-300 px-3 py-2 text-sm"
          />
          <input
            name="tagsCsv"
            placeholder="Tagi, oddziel przecinkami"
            className="rounded border border-stone-300 px-3 py-2 text-sm"
          />
          <textarea
            name="excerpt"
            rows={2}
            placeholder="Krótki lead (opcjonalnie)"
            className="rounded border border-stone-300 px-3 py-2 text-sm"
          />
          <textarea
            name="body"
            required
            rows={6}
            placeholder="Treść wpisu mieszkańca..."
            className="rounded border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={trwa || !villageId}
          className="mt-4 rounded-lg bg-emerald-800 px-4 py-2 text-sm text-white hover:bg-emerald-900 disabled:opacity-60"
        >
          Wyślij wpis do moderacji
        </button>
      </form>
    </section>
  );
}
