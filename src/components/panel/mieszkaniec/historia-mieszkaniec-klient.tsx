"use client";

import Link from "next/link";
import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zglosWspomnienieHistorii } from "@/lib/historia/akcje-historia-mieszkaniec";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

export type WiesHistoriaMieszkaniec = {
  id: string;
  name: string;
  voivodeship: string;
  county: string;
  commune: string;
  slug: string;
};

export function HistoriaMieszkaniecKlient({ wsie }: { wsie: WiesHistoriaMieszkaniec[] }) {
  const router = useRouter();
  const [villageId, ustawVillageId] = useState(wsie[0]?.id ?? "");
  const [blad, ustawBlad] = useState("");
  const [komunikat, ustawKomunikat] = useState("");
  const [czek, startT] = useTransition();

  const wies = wsie.find((w) => w.id === villageId) ?? wsie[0];
  const sciezka = wies ? sciezkaProfiluWsi(wies) : null;

  function wyslij(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!wies) return;
    const fd = new FormData(e.currentTarget);
    ustawBlad("");
    ustawKomunikat("");
    startT(async () => {
      const wynik = await zglosWspomnienieHistorii({
        villageId: wies.id,
        title: String(fd.get("title") ?? ""),
        short_description: String(fd.get("short_description") ?? "") || null,
        body: String(fd.get("body") ?? ""),
        event_date: String(fd.get("event_date") ?? "") || null,
        era_label: String(fd.get("era_label") ?? "") || null,
        location_label: String(fd.get("location_label") ?? "") || null,
      });
      if ("blad" in wynik) {
        ustawBlad(wynik.blad);
        return;
      }
      ustawKomunikat(wynik.komunikat ?? "Wysłano wspomnienie.");
      e.currentTarget.reset();
      router.refresh();
    });
  }

  if (wsie.length === 0) {
    return (
      <p className="text-sm text-stone-600">
        Najpierw{" "}
        <Link href="/panel/mieszkaniec#dolacz-mieszkaniec" className="font-medium text-green-800 underline">
          dołącz do wsi
        </Link>{" "}
        lub obserwuj miejscowość.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {wsie.length > 1 ? (
        <label className="block text-sm">
          <span className="font-medium text-stone-700">Wieś</span>
          <select
            value={villageId}
            onChange={(e) => ustawVillageId(e.target.value)}
            className="mt-1 w-full max-w-md rounded-lg border border-stone-300 px-3 py-2 text-sm"
          >
            {wsie.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {sciezka && wies ? (
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4">
          <h2 className="font-semibold text-amber-950">Czytaj kronikę</h2>
          <p className="mt-1 text-sm text-stone-600">
            Opublikowane wpisy są publiczne — każdy może je zobaczyć na profilu wsi.
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <Link href={`${sciezka}#sekcja-historia`} className="font-medium text-green-800 underline">
              Zakładka Historia na profilu
            </Link>
            <Link href={`${sciezka}/historia`} className="font-medium text-green-800 underline">
              Pełna lista wpisów
            </Link>
          </div>
        </div>
      ) : null}

      <form onSubmit={wyslij} className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="font-serif text-xl text-green-950">Zgłoś wspomnienie</h2>
        <p className="mt-2 text-sm text-stone-600">
          Twoje zgłoszenie trafi do sołtysa do akceptacji. To nie jest zgłoszenie usterki — sprawy techniczne zgłaszaj w{" "}
          <Link href="/panel/mieszkaniec/zgloszenia" className="font-medium text-green-800 underline">
            Zgłoszeniach
          </Link>
          .
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            name="title"
            required
            placeholder="Tytuł (np. Otwarcie nowego mostu)"
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm sm:col-span-2"
          />
          <input name="event_date" type="date" className="rounded-lg border border-stone-300 px-3 py-2 text-sm" />
          <input
            name="era_label"
            placeholder="Epoka (opcjonalnie)"
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
          <input
            name="location_label"
            placeholder="Miejsce (np. przy kościele)"
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm sm:col-span-2"
          />
          <textarea
            name="short_description"
            rows={2}
            placeholder="Krótki lead"
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm sm:col-span-2"
          />
          <textarea
            name="body"
            required
            rows={5}
            placeholder="Opowiedz, co pamiętasz — sołtys może dodać zdjęcia po publikacji."
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm sm:col-span-2"
          />
        </div>
        <button
          type="submit"
          disabled={czek}
          className="mt-4 min-h-11 rounded-lg bg-green-800 px-4 text-sm font-medium text-white disabled:opacity-60"
        >
          {czek ? "Wysyłam…" : "Wyślij do akceptacji sołtysa"}
        </button>
        {blad ? <p className="mt-2 text-sm text-red-700">{blad}</p> : null}
        {komunikat ? <p className="mt-2 text-sm text-green-800">{komunikat}</p> : null}
      </form>
    </div>
  );
}
