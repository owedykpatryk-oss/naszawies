"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { aktualizujPreferencjeObserwacjiWsi, type WynikProsty } from "./akcje";

export type ObserwacjaWsiDoEdycji = {
  id: string;
  nazwaWsi: string;
  sciezkaWsi: string | null;
  notify_posts: boolean;
  notify_events: boolean;
  notify_issues: boolean;
  notify_alerts: boolean;
};

export function ObserwowaneWsiPreferencje({ obserwacje }: { obserwacje: ObserwacjaWsiDoEdycji[] }) {
  const router = useRouter();
  const [komunikat, ustawKomunikat] = useState("");
  const [blad, ustawBlad] = useState("");
  const [ladujeId, ustawLadujeId] = useState<string | null>(null);

  if (obserwacje.length === 0) {
    return null;
  }

  async function wyslij(form: HTMLFormElement) {
    ustawKomunikat("");
    ustawBlad("");
    const fd = new FormData(form);
    const id = String(fd.get("follow_id") ?? "");
    ustawLadujeId(id);
    try {
      const wynik: WynikProsty = await aktualizujPreferencjeObserwacjiWsi(fd);
      if ("blad" in wynik) {
        ustawBlad(wynik.blad);
        return;
      }
      ustawKomunikat(wynik.komunikat ?? "Zapisano.");
      router.refresh();
    } finally {
      ustawLadujeId(null);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-emerald-200/80 bg-emerald-50/25 p-5 shadow-sm">
      <h2 className="font-serif text-lg text-green-950">Obserwowane miejscowości — powiadomienia</h2>
      <p className="mt-1 text-xs text-stone-600">
        Te przełączniki sterują powiadomieniami, gdy sołtys opublikuje nowy wpis na tablicy wsi (np. ogłoszenie,
        wydarzenie lub awaria — zgodnie z kategorią). Bieżące wiadomości w aplikacji:{" "}
        <Link href="/panel/powiadomienia" className="text-green-800 underline">
          panel powiadomień
        </Link>
        .
      </p>
      {komunikat ? (
        <p className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900" role="status">
          {komunikat}
        </p>
      ) : null}
      {blad ? (
        <p className="mt-3 text-sm text-red-800" role="alert">
          {blad}
        </p>
      ) : null}
      <ul className="mt-4 space-y-5">
        {obserwacje.map((o) => (
          <li key={o.id} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-medium text-stone-900">{o.nazwaWsi}</p>
              {o.sciezkaWsi ? (
                <Link href={o.sciezkaWsi} className="text-xs text-green-800 underline">
                  Profil wsi
                </Link>
              ) : null}
            </div>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                void wyslij(e.currentTarget);
              }}
            >
              <input type="hidden" name="follow_id" value={o.id} />
              <fieldset className="space-y-2 text-sm text-stone-700">
                <legend className="sr-only">Kategorie powiadomień dla {o.nazwaWsi}</legend>
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    name="notify_posts"
                    defaultChecked={o.notify_posts}
                    className="mt-1 h-4 w-4 rounded border-stone-300 text-green-800"
                  />
                  <span>Ogłoszenia i wpisy na tablicy</span>
                </label>
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    name="notify_events"
                    defaultChecked={o.notify_events}
                    className="mt-1 h-4 w-4 rounded border-stone-300 text-green-800"
                  />
                  <span>Wydarzenia i zebrania</span>
                </label>
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    name="notify_issues"
                    defaultChecked={o.notify_issues}
                    className="mt-1 h-4 w-4 rounded border-stone-300 text-green-800"
                  />
                  <span>Zgłoszenia problemów (np. awarie)</span>
                </label>
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    name="notify_alerts"
                    defaultChecked={o.notify_alerts}
                    className="mt-1 h-4 w-4 rounded border-stone-300 text-green-800"
                  />
                  <span>Alerty i pilne komunikaty</span>
                </label>
              </fieldset>
              <button
                type="submit"
                disabled={ladujeId === o.id}
                className="rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-60"
              >
                {ladujeId === o.id ? "Zapisuję…" : "Zapisz dla tej wsi"}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}
