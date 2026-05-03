"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { WyszukiwarkaWsi } from "@/components/wies/wyszukiwarka-wsi";
import { obserwujWies, zlozWniosekMieszkaniec, type WynikProsty } from "./akcje";

export function MieszkaniecKlient() {
  const router = useRouter();
  const [komunikat, ustawKomunikat] = useState("");

  async function obsluz(wynik: WynikProsty) {
    if ("blad" in wynik) {
      ustawKomunikat(wynik.blad);
      return;
    }
    ustawKomunikat(wynik.komunikat ?? "Zapisano.");
    router.refresh();
  }

  return (
    <div className="space-y-10">
      {komunikat ? (
        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900" role="status">
          {komunikat}
        </p>
      ) : null}

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="font-serif text-xl text-green-950">Dołącz do wsi jako mieszkaniec</h2>
        <p className="mt-1 text-sm text-stone-600">
          Złóż wniosek — sołtys zatwierdzi Cię w panelu. Potrzebujesz aktywnej roli, by widzieć ogłoszenia i świetlicę
          swojej wsi.
        </p>
        <div className="mt-4">
          <WyszukiwarkaWsi
            etykietaAkcji="Wyszukaj miejscowość i wyślij wniosek"
            tekstPrzycisku="Wyślij wniosek"
            onAkcja={async (w) => {
              ustawKomunikat("");
              await obsluz(await zlozWniosekMieszkaniec(w.id));
            }}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="font-serif text-xl text-green-950">Obserwuj wieś</h2>
        <p className="mt-1 text-sm text-stone-600">
          Dodaj wieś do obserwowanych, aby szybciej dostawać informacje i powiadomienia.
        </p>
        <div className="mt-4">
          <WyszukiwarkaWsi
            etykietaAkcji="Wybierz wieś, którą chcesz obserwować"
            tekstPrzycisku="Obserwuj"
            onAkcja={async (w) => {
              ustawKomunikat("");
              await obsluz(await obserwujWies(w.id));
            }}
          />
        </div>
      </section>
    </div>
  );
}
