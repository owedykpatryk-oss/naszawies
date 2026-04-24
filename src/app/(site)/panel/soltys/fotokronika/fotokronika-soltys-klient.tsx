"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { ustawOkladkeAlbumu, utworzAlbumFotokroniki, zmoderujZdjecieFotokroniki } from "../akcje-fotokronika";

type Wies = { id: string; name: string };
type Oczek = {
  id: string;
  url: string;
  caption: string | null;
  village_id: string;
  created_at: string;
  album_id: string | null;
  wies_nazwa: string;
  album_tytul: string | null;
  zglaszajacy: string;
};
type AlbumKarta = {
  id: string;
  title: string;
  wies_nazwa: string;
  event_date: string | null;
  visibility: string;
  opis: string | null;
  zdjZatw: { id: string; url: string; caption: string | null }[];
};

type Props = {
  wies: Wies[];
  oczekujace: Oczek[];
  albumy: AlbumKarta[];
  okladki: Record<string, string | null>;
};

const widocznosc: Record<string, string> = {
  public: "Publiczna",
  residents_only: "Tylko dla mieszkańców (po zalogowaniu w serwisie)",
};

export function FotokronikaSoltysKlient({ wies, oczekujace, albumy, okladki }: Props) {
  const router = useRouter();
  const [bladA, ustawBladA] = useState("");
  const [bladF, ustawBladF] = useState("");
  const [czek, startT] = useTransition();
  const [vNew, ustawVNew] = useState(wies[0]?.id ?? "");

  function onAlbum(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    ustawBladA("");
    const fd = new FormData(e.currentTarget);
    const tyt = String(fd.get("title") || "").trim();
    const opis = String(fd.get("description") || "").trim();
    const wyd = String(fd.get("event_date") || "");
    const wid = String(fd.get("visibility") || "public");
    const tagS = String(fd.get("tags") || "").trim();
    startT(async () => {
      const tags = tagS
        .split(/[,;]+/)
        .map((x) => x.trim())
        .filter(Boolean);
      const w = await utworzAlbumFotokroniki({
        villageId: vNew,
        title: tyt,
        description: opis || null,
        eventDate: wyd || null,
        visibility: wid as "public" | "residents_only",
        tags: tags.length ? tags : undefined,
      });
      if ("blad" in w) {
        ustawBladA(w.blad);
        return;
      }
      (e.target as HTMLFormElement).reset();
      router.refresh();
    });
  }

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="font-serif text-xl text-green-950">Nowy album</h2>
        <p className="mt-1 text-sm text-stone-600">
          Mieszkańcy będą mogli wybierać ten album przy wysyłce zdjęć. Dopóki nie zatwierdzisz zdjęć, album może być
          pusty.
        </p>
        {bladA ? <p className="mt-2 text-sm text-red-800">{bladA}</p> : null}
        <form onSubmit={onAlbum} className="mt-4 space-y-3">
          <div>
            <label className="text-sm font-medium">Wieś</label>
            <select
              value={vNew}
              onChange={(e) => ustawVNew(e.target.value)}
              className="mt-1 w-full max-w-md rounded border border-stone-300 px-2 py-1.5 text-sm"
            >
              {wies.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="a-tyt">
              Tytuł
            </label>
            <input
              id="a-tyt"
              name="title"
              required
              minLength={2}
              className="mt-1 w-full max-w-md rounded border border-stone-300 px-2 py-1.5 text-sm"
              placeholder="np. Dożynki 2026"
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="a-opis">
              Opis
            </label>
            <textarea
              id="a-opis"
              name="description"
              rows={2}
              className="mt-1 w-full max-w-xl rounded border border-stone-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="a-data">
              Data wydarzenia
            </label>
            <input
              id="a-data"
              name="event_date"
              type="date"
              className="mt-1 rounded border border-stone-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="a-wid">
              Widoczność
            </label>
            <select
              id="a-wid"
              name="visibility"
              className="mt-1 w-full max-w-md rounded border border-stone-300 px-2 py-1.5 text-sm"
            >
              <option value="public">{widocznosc.public}</option>
              <option value="residents_only">{widocznosc.residents_only}</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="a-tags">
              Tagi (opcjonalnie, po przecinku)
            </label>
            <input id="a-tags" name="tags" className="mt-1 w-full max-w-md rounded border border-stone-300 px-2 py-1.5 text-sm" />
          </div>
          <button
            type="submit"
            disabled={czek}
            className="rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900"
          >
            {czek ? "Tworzę…" : "Utwórz album"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="font-serif text-xl text-green-950">Do moderacji</h2>
        {oczekujace.length === 0 ? (
          <p className="mt-2 text-sm text-stone-600">Brak zdjęć oczekujących.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {oczekujace.map((z) => (
              <li key={z.id} className="flex flex-col gap-2 rounded-xl border border-stone-200 bg-stone-50/50 p-3 sm:flex-row sm:items-start sm:gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={z.url}
                  alt=""
                  className="h-32 w-32 shrink-0 rounded-lg border border-stone-200 object-cover"
                />
                <div className="min-w-0 text-sm text-stone-800">
                  <p className="text-xs text-stone-500">
                    {z.wies_nazwa} · {new Date(z.created_at).toLocaleString("pl-PL")} · {z.zglaszajacy}
                  </p>
                  {z.album_tytul ? <p className="text-xs">Album: {z.album_tytul}</p> : null}
                  {z.caption ? <p className="mt-1">{z.caption}</p> : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <PrzyciskMod
                      id={z.id}
                      typ="approved"
                      etyk="Zatwierdź"
                      startT={startT}
                      router={router}
                      onBlad={ustawBladF}
                    />
                    <PrzyciskMod
                      id={z.id}
                      typ="rejected"
                      etyk="Odrzuć"
                      startT={startT}
                      router={router}
                      onBlad={ustawBladF}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {bladF ? <p className="mt-2 text-sm text-red-800">{bladF}</p> : null}
      </section>

      <section>
        <h2 className="font-serif text-xl text-green-950">Albumy i okładka</h2>
        {albumy.length === 0 ? (
          <p className="mt-2 text-sm text-stone-600">Jeszcze brak utworzonych albumów.</p>
        ) : (
          <ul className="mt-4 space-y-6">
            {albumy.map((a) => (
              <li key={a.id} className="rounded-xl border border-stone-200 bg-white p-4">
                <p className="font-medium text-stone-900">{a.title}</p>
                <p className="text-xs text-stone-500">
                  {a.wies_nazwa} · {a.event_date ? new Date(a.event_date).toLocaleDateString("pl-PL") : "data nie podana"}{" "}
                  · {widocznosc[a.visibility] ?? a.visibility}
                </p>
                {a.opis ? <p className="mt-1 text-sm text-stone-700">{a.opis}</p> : null}
                {okladki[a.id] ? (
                  (() => {
                    const c = a.zdjZatw.find((p) => p.id === okladki[a.id]);
                    return c ? (
                      <div className="mt-2 flex items-center gap-2 text-xs text-stone-600">
                        <span>Okładka albumu:</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={c.url} alt="" className="h-10 w-10 rounded border object-cover" />
                      </div>
                    ) : (
                      <p className="mt-1 text-xs text-stone-500">Okładka ustawiona w bazie; odśwież stronę, by zobaczyć miniatury.</p>
                    );
                  })()
                ) : (
                  <p className="mt-1 text-xs text-amber-800">Brak okładki — wybierz wśród zatwierdzonych w albumie.</p>
                )}
                {a.zdjZatw.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {a.zdjZatw.map((p) => (
                      <div key={p.id} className="w-20 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.url} alt="" className="h-20 w-20 rounded border object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            startT(async () => {
                              const w = await ustawOkladkeAlbumu({ albumId: a.id, photoId: p.id });
                              if ("blad" in w) {
                                alert(w.blad);
                                return;
                              }
                              router.refresh();
                            });
                          }}
                          className="mt-1 w-full text-[10px] text-green-800 underline"
                        >
                          jako okładka
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-stone-500">W tym albumie nie ma jeszcze zatwierdzonych zdjęć.</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function PrzyciskMod({
  id,
  typ,
  etyk,
  startT,
  router,
  onBlad,
}: {
  id: string;
  typ: "approved" | "rejected";
  etyk: string;
  startT: (c: () => void) => void;
  router: { refresh: () => void };
  onBlad: (s: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        startT(async () => {
          onBlad("");
          const w = await zmoderujZdjecieFotokroniki({ photoId: id, decyzja: typ });
          if ("blad" in w) {
            onBlad(w.blad);
            return;
          }
          router.refresh();
        });
      }}
      className={
        typ === "rejected"
          ? "rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-900"
          : "rounded border border-green-200 bg-green-50 px-2 py-1 text-xs text-green-900"
      }
    >
      {etyk}
    </button>
  );
}
