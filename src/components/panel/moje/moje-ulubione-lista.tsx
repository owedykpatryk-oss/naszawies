"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { aktualizujPreferencjeObserwacjiWsi } from "@/app/(site)/panel/mieszkaniec/akcje";
import { przestanObserwowacWies, type WynikProsty } from "@/app/(site)/panel/moje/akcje";
import type { WiesPowiazana } from "@/lib/panel/pobierz-moje-powiazania";

export function MojeUlubioneLista({ wies }: { wies: WiesPowiazana[] }) {
  const router = useRouter();
  const obserwowane = wies.filter((w) => w.followId);
  const [komunikat, ustawKomunikat] = useState("");
  const [blad, ustawBlad] = useState("");
  const [ladujeId, ustawLadujeId] = useState<string | null>(null);

  if (obserwowane.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-sm text-stone-600">
        Nie masz jeszcze obserwowanych miejscowości. Dodaj wieś w zakładce{" "}
        <Link href="/panel/moje/wies" className="font-medium text-green-800 underline">
          Moje wsie
        </Link>
        .
      </p>
    );
  }

  async function usun(followId: string) {
    ustawKomunikat("");
    ustawBlad("");
    ustawLadujeId(followId);
    try {
      const wynik = await przestanObserwowacWies(followId);
      if ("blad" in wynik) {
        ustawBlad(wynik.blad);
        return;
      }
      ustawKomunikat(wynik.komunikat ?? "Usunięto.");
      router.refresh();
    } finally {
      ustawLadujeId(null);
    }
  }

  async function zapiszPreferencje(form: HTMLFormElement) {
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
    <div>
      {komunikat ? (
        <p className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900" role="status">
          {komunikat}
        </p>
      ) : null}
      {blad ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="alert">
          {blad}
        </p>
      ) : null}
      <ul className="space-y-4">
        {obserwowane.map((w) => (
          <li key={w.followId!} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <Link href={w.sciezkaProfilu} className="font-medium text-green-950 hover:underline">
                  {w.nazwa}
                </Link>
                <p className="text-xs text-stone-500">{w.gmina} · pow. {w.powiat}</p>
              </div>
              <button
                type="button"
                disabled={ladujeId === w.followId}
                onClick={() => void usun(w.followId!)}
                className="rounded-lg border border-stone-300 px-2.5 py-1 text-xs text-stone-700 hover:bg-stone-50 disabled:opacity-60"
              >
                {ladujeId === w.followId ? "Usuwam…" : "Usuń z ulubionych"}
              </button>
            </div>
            <form
              className="mt-3 space-y-2 border-t border-stone-100 pt-3"
              onSubmit={(e) => {
                e.preventDefault();
                void zapiszPreferencje(e.currentTarget);
              }}
            >
              <input type="hidden" name="follow_id" value={w.followId!} />
              <p className="text-xs font-semibold text-stone-600">Powiadomienia</p>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="notify_posts" defaultChecked={w.notify_posts} className="h-4 w-4 rounded" />
                Ogłoszenia
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="notify_events" defaultChecked={w.notify_events} className="h-4 w-4 rounded" />
                Wydarzenia
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="notify_issues" defaultChecked={w.notify_issues} className="h-4 w-4 rounded" />
                Zgłoszenia
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="notify_alerts" defaultChecked={w.notify_alerts} className="h-4 w-4 rounded" />
                Alerty
              </label>
              <button
                type="submit"
                disabled={ladujeId === w.followId}
                className="mt-1 rounded-lg bg-green-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-900 disabled:opacity-60"
              >
                Zapisz powiadomienia
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
