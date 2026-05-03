"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { dodajKanalRssWsi, uruchomSynchronizacjeRssDlaMoichWsi, usunKanalRssWsi } from "../akcje";

export type WiesDoRss = { id: string; name: string };

export type KanalRssWiersz = {
  id: string;
  village_id: string;
  label: string;
  feed_url: string;
  is_enabled: boolean;
  last_fetched_at: string | null;
  last_error: string | null;
};

export function SoltysKanalyRssKlient({
  wsie,
  kanaly,
}: {
  wsie: WiesDoRss[];
  kanaly: KanalRssWiersz[];
}) {
  const router = useRouter();
  const [villageId, setVillageId] = useState(wsie[0]?.id ?? "");
  const [czek, startT] = useTransition();
  const [komunikat, setKomunikat] = useState("");
  const [blad, setBlad] = useState("");

  const lista = kanaly.filter((k) => k.village_id === villageId);

  function onDodaj(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBlad("");
    setKomunikat("");
    startT(async () => {
      const wynik = await dodajKanalRssWsi({
        villageId,
        label: String(fd.get("label") ?? ""),
        feed_url: String(fd.get("feed_url") ?? ""),
      });
      if ("blad" in wynik && wynik.blad) {
        setBlad(wynik.blad);
        return;
      }
      setKomunikat("Dodano kanał RSS.");
      e.currentTarget.reset();
      router.refresh();
    });
  }

  function onSync() {
    setBlad("");
    setKomunikat("");
    startT(async () => {
      const wynik = await uruchomSynchronizacjeRssDlaMoichWsi();
      if (!("ok" in wynik) || !wynik.ok) {
        setBlad("blad" in wynik ? wynik.blad : "Synchronizacja nie powiodła się.");
        return;
      }
      const errPart = wynik.bledy.length ? ` Uwagi: ${wynik.bledy.slice(0, 3).join(" · ")}` : "";
      setKomunikat(
        `Zsynchronizowano źródła: ${wynik.zrodlaPrzetworzone}, nowe wpisy (oczekujące): ${wynik.noweWpisy}.${errPart}`,
      );
      router.refresh();
    });
  }

  return (
    <section className="mt-6 space-y-8">
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <label className="text-sm font-medium text-stone-800" htmlFor="wies-rss">
          Wieś
        </label>
        <select
          id="wies-rss"
          className="mt-2 w-full max-w-sm rounded border border-stone-300 px-3 py-2 text-sm"
          value={villageId}
          onChange={(e) => setVillageId(e.target.value)}
        >
          {wsie.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        <p className="mt-3 text-xs text-stone-600">
          Kanały RSS są pobierane w tle (cron lub przycisk „Synchronizuj teraz”). Nowe pozycje trafiają do moderacji
          jako wiadomości lokalne ze statusem „oczekuje”. Synchronizacja treści działa na Twojej sesji; powiadomienia push
          do innych osób wymagają na serwerze zmiennej <code className="text-[11px]">SUPABASE_SERVICE_ROLE_KEY</code>.
        </p>
        {komunikat ? (
          <p className="mt-3 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900">{komunikat}</p>
        ) : null}
        {blad ? <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">{blad}</p> : null}
        <button
          type="button"
          disabled={czek}
          onClick={onSync}
          className="mt-4 rounded-lg bg-emerald-800 px-4 py-2 text-sm text-white hover:bg-emerald-900 disabled:opacity-60"
        >
          Synchronizuj teraz (wszystkie moje wsi)
        </button>
      </div>

      <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/30 p-5 shadow-sm">
        <h2 className="font-serif text-lg text-green-950">Kanały dla wybranej wsi</h2>
        {lista.length === 0 ? (
          <p className="mt-2 text-sm text-stone-600">Brak kanałów — dodaj pierwszy adres RSS (np. z gminy lub lokalnej gazety).</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {lista.map((k) => (
              <li
                key={k.id}
                className="flex flex-col gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-stone-900">{k.label}</p>
                  <a
                    href={k.feed_url}
                    className="mt-1 block truncate text-xs text-green-800 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {k.feed_url}
                  </a>
                  <p className="mt-2 text-xs text-stone-500">
                    {k.is_enabled ? "Aktywny" : "Wyłączony"}
                    {k.last_fetched_at
                      ? ` · ostatnio: ${new Date(k.last_fetched_at).toLocaleString("pl-PL")}`
                      : " · jeszcze nie pobierano"}
                  </p>
                  {k.last_error ? (
                    <p className="mt-1 text-xs text-red-800">Błąd: {k.last_error}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  disabled={czek}
                  onClick={() => {
                    setBlad("");
                    setKomunikat("");
                    startT(async () => {
                      const w = await usunKanalRssWsi(k.id);
                      if ("blad" in w && w.blad) {
                        setBlad(w.blad);
                        return;
                      }
                      setKomunikat("Usunięto kanał.");
                      router.refresh();
                    });
                  }}
                  className="shrink-0 text-xs text-red-700 underline hover:text-red-900 disabled:opacity-50"
                >
                  Usuń kanał
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={onDodaj} className="rounded-2xl border border-stone-200 bg-slate-50/40 p-5 shadow-sm">
        <h2 className="font-serif text-lg text-green-950">Dodaj kanał RSS</h2>
        <p className="mt-1 text-xs text-stone-600">Adres musi zaczynać się od http:// lub https:// (bez skrótów).</p>
        <label className="mt-4 block text-sm font-medium text-stone-800">
          Krótka nazwa (np. „Urząd gminy — komunikaty”)
          <input
            name="label"
            required
            minLength={2}
            className="mt-1 w-full max-w-md rounded border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="mt-3 block text-sm font-medium text-stone-800">
          URL kanału RSS
          <input
            name="feed_url"
            type="url"
            required
            placeholder="https://…"
            className="mt-1 w-full max-w-xl rounded border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={czek || !villageId}
          className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-900 disabled:opacity-60"
        >
          Zapisz kanał
        </button>
      </form>
    </section>
  );
}
