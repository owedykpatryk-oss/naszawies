"use client";

import { useState, useTransition } from "react";
import { przelaczObserwacjeProfiluRynku } from "@/lib/marketplace/obserwuj-profil-rynku";

type Props = {
  profileId: string;
  poczatkowoObserwuje: boolean;
  zalogowany: boolean;
  /** Właściciel profilu — ukryj przycisk */
  jestWlascicielem?: boolean;
};

export function ObserwujProfilRynkuKlient({
  profileId,
  poczatkowoObserwuje,
  zalogowany,
  jestWlascicielem = false,
}: Props) {
  const [obserwuje, ustawObserwuje] = useState(poczatkowoObserwuje);
  const [komunikat, ustawKomunikat] = useState("");
  const [blad, ustawBlad] = useState("");
  const [czek, startT] = useTransition();

  if (jestWlascicielem) return null;

  function przelacz() {
    ustawBlad("");
    ustawKomunikat("");
    if (!zalogowany) {
      ustawBlad("Zaloguj się, aby obserwować ten profil.");
      return;
    }
    startT(async () => {
      const w = await przelaczObserwacjeProfiluRynku(profileId);
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawObserwuje(w.obserwuje);
      ustawKomunikat(
        w.obserwuje
          ? "Obserwujesz — dostaniesz powiadomienie o nowych ofertach tej firmy."
          : "Nie obserwujesz już tego profilu.",
      );
    });
  }

  return (
    <div className="flex flex-col gap-1.5 sm:items-end">
      <button
        type="button"
        disabled={czek}
        onClick={przelacz}
        className={`nawigacja-pill rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
          obserwuje
            ? "bg-stone-100 text-stone-800 ring-1 ring-stone-300 hover:bg-stone-50"
            : "bg-green-800 text-white hover:bg-green-900"
        }`}
      >
        {czek ? "…" : obserwuje ? "✓ Obserwujesz — wyłącz" : "🔔 Obserwuj firmę"}
      </button>
      {komunikat ? <p className="max-w-xs text-right text-xs text-emerald-800">{komunikat}</p> : null}
      {blad ? (
        <p className="max-w-xs text-right text-xs text-red-800" role="alert">
          {blad}
        </p>
      ) : null}
    </div>
  );
}
