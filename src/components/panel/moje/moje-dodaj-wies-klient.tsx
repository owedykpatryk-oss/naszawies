"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { WyszukiwarkaWsi } from "@/components/wies/wyszukiwarka-wsi";
import { obserwujWies, zlozWniosekMieszkaniec } from "@/app/(site)/panel/mieszkaniec/akcje";
import type { WynikProsty } from "@/app/(site)/panel/moje/akcje";

export function MojeDodajWiesKlient() {
  const router = useRouter();
  const [komunikat, ustawKomunikat] = useState("");
  const [blad, ustawBlad] = useState("");

  async function obsluz(wynik: WynikProsty) {
    ustawBlad("");
    if ("blad" in wynik) {
      ustawBlad(wynik.blad);
      return;
    }
    ustawKomunikat(wynik.komunikat ?? "Zapisano.");
    router.refresh();
  }

  return (
    <section className="rounded-2xl border border-dashed border-emerald-300/80 bg-emerald-50/30 p-5">
      <h2 className="font-serif text-lg text-green-950">Dodaj miejscowość</h2>
      <p className="mt-1 text-sm text-stone-600">
        Wyszukaj wieś — możesz ją <strong>obserwować</strong> (ulubione + powiadomienia) albo złożyć{" "}
        <strong>wniosek o rolę mieszkańca</strong> (wymaga akceptacji sołtysa).
      </p>
      {komunikat ? (
        <p className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900" role="status">
          {komunikat}
        </p>
      ) : null}
      {blad ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="alert">
          {blad}
        </p>
      ) : null}
      <div className="mt-4 space-y-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Obserwuj (ulubione)</p>
          <WyszukiwarkaWsi
            etykietaAkcji="Wyszukaj i dodaj do obserwowanych"
            tekstPrzycisku="Obserwuj"
            onAkcja={async (w) => {
              ustawKomunikat("");
              await obsluz(await obserwujWies(w.id));
            }}
          />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">Dołącz jako mieszkaniec</p>
          <WyszukiwarkaWsi
            etykietaAkcji="Wyszukaj i wyślij wniosek"
            tekstPrzycisku="Wyślij wniosek"
            onAkcja={async (w) => {
              ustawKomunikat("");
              await obsluz(await zlozWniosekMieszkaniec(w.id));
            }}
          />
        </div>
      </div>
    </section>
  );
}
